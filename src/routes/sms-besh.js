const express = require('express');
const twilio = require('twilio');
const {
  classifyInboundText,
  nextOnboardingStep,
  sanitizeSmsReply,
  normalizePhone
} = require('../services/besh-sms');
const { createBeshSmsStore } = require('../services/besh-sms-store');
const { createBeshMemory } = require('../services/besh-memory');
const { createBeshAI } = require('../services/besh-ai');
const { parseReminder } = require('../services/besh-reminders');
const { detectSpecialCommands, detectGoalCompletion, formatGoalsList, formatSummary } = require('../services/besh-commands');
const { detectIntent, detectSentiment, routeMessage } = require('../services/besh-intent');
const { logInsight } = require('../services/besh-insights');
const { processWithRules } = require('../services/besh-rule-handlers');

const SUBSCRIPTION_TIERS = { free: 'free', pro: 'pro', premium: 'premium' };
const FREE_TIER_DAILY_LIMIT = 20; // free tier: 20 msgs/day
const FREE_TIER_MONTHLY_LIMIT = 600; // free tier: 600 msgs/month

function hasPaidSubscription(user) {
  if (!user) return false;
  const tier = (user.subscription_tier || 'free').toLowerCase();
  const status = (user.subscription_status || 'active').toLowerCase();
  
  // Check if subscription has expired
  if (user.subscription_expires_at) {
    const expires = new Date(user.subscription_expires_at);
    if (expires < new Date()) {
      return false; // Expired - treat as free
    }
  }
  
  return tier !== 'free' && status === 'active';
}

const smsBeshMetrics = {
  inbound: 0,
  outbound: 0,
  onboardingStarted: 0,
  onboardingCompleted: 0,
  aiConversations: 0,
  duplicatesIgnored: 0,
  failures: 0,
  // AI Quality Metrics
  aiRequests: 0,
  aiSuccess: 0,
  aiFailures: 0,
  totalResponseTimeMs: 0,
  avgResponseTimeMs: 0,
  intentsDetected: {},
  injectionsBlocked: 0
};

function updateAIMetrics(success, responseTimeMs, intent, isInjection = false) {
  smsBeshMetrics.aiRequests += 1;
  if (success) {
    smsBeshMetrics.aiSuccess += 1;
    smsBeshMetrics.totalResponseTimeMs += responseTimeMs;
    smsBeshMetrics.avgResponseTimeMs = Math.round(smsBeshMetrics.totalResponseTimeMs / smsBeshMetrics.aiRequests);
  } else {
    smsBeshMetrics.aiFailures += 1;
  }
  if (intent) {
    smsBeshMetrics.intentsDetected[intent] = (smsBeshMetrics.intentsDetected[intent] || 0) + 1;
  }
  if (isInjection) {
    smsBeshMetrics.injectionsBlocked += 1;
  }
}

function createSmsBeshHandler({ store, llm } = {}) {
  const memory = createBeshMemory({ store });
  const ai = createBeshAI({ llm });

  return async (req, res) => {
    const from = normalizePhone(req.body.From || '');
    const to = normalizePhone(req.body.To || '');
    const body = String(req.body.Body || '').trim();
    const messageSid = String(req.body.MessageSid || '').trim();

    try {
      smsBeshMetrics.inbound += 1;

      // Deduplicate
      if (messageSid) {
        const existing = await store.findConversationByMessageSid(messageSid);
        if (existing) {
          smsBeshMetrics.duplicatesIgnored += 1;
          const twiml = new twilio.twiml.MessagingResponse();
          twiml.message(sanitizeSmsReply('Got it — already processed that message. Send your next update anytime.', 160));
          return res.type('text/xml').send(twiml.toString());
        }
      }

      // === SPECIAL COMMANDS (TCPA compliance — handle before anything else) ===
      const specialCmd = detectSpecialCommands(body);
      if (specialCmd) {
        let cmdReply = specialCmd.response;

        // Dynamic commands that need DB
        if (specialCmd.command === 'stop') {
          const stopUser = await store.getOrCreateUserByPhone(from);
          if (store.updateUser) await store.updateUser(stopUser.id, { unsubscribed: true });
          smsBeshMetrics.outbound += 1;
          const twiml = new twilio.twiml.MessagingResponse();
          twiml.message(cmdReply || 'You have been unsubscribed. Text START to resubscribe.');
          return res.type('text/xml').send(twiml.toString());
        }

        if (specialCmd.command === 'goals' || specialCmd.command === 'summary') {
          const cmdUser = await store.getOrCreateUserByPhone(from);
          const activeGoals = store.getActiveGoals ? await store.getActiveGoals(cmdUser.id) : [];
          cmdReply = specialCmd.command === 'goals'
            ? formatGoalsList(activeGoals, cmdUser.display_name || 'there')
            : formatSummary(cmdUser, activeGoals);
        }

        // Handle UPGRADE command - check subscription status first
        if (specialCmd.command === 'upgrade') {
          const cmdUser = await store.getOrCreateUserByPhone(from);
          
          // Check if already subscribed
          if (hasPaidSubscription(cmdUser)) {
            cmdReply = "You're already on Pro! 🎉 Thanks for being a supporter. Text 'MANAGE' to change your plan.";
          } else {
            // Check if Stripe is configured
            if (process.env.STRIPE_SECRET_KEY && process.env.BASE_URL) {
              try {
                const baseUrl = process.env.BASE_URL;
                const response = await fetch(`${baseUrl}/api/besh/create-checkout-session`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ tier: 'pro', phone: from })
                });
                const data = await response.json();
                if (data.url) {
                  cmdReply = "Upgrade to Pro for unlimited texts! Click here: " + data.url + " 🚀";
                } else {
                  cmdReply = "Having trouble loading upgrade. Try: besh.ai/upgrade";
                }
              } catch (e) {
                console.error('Upgrade error:', e);
                cmdReply = "Oops! Something went wrong. Try: besh.ai/upgrade";
              }
            } else {
              cmdReply = "Pro is coming soon! You'll get unlimited texts, priority support, and early access to new features.";
            }
          }
        }

        // Handle MANAGE command - subscription management
        if (specialCmd.command === 'manage') {
          const cmdUser = await store.getOrCreateUserByPhone(from);
          
          if (cmdUser.stripe_customer_id) {
            try {
              const baseUrl = process.env.BASE_URL;
              const response = await fetch(`${baseUrl}/api/besh/create-portal-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId: cmdUser.stripe_customer_id })
              });
              const data = await response.json();
              if (data.url) {
                cmdReply = "Manage your subscription: " + data.url;
              } else {
                cmdReply = "Having trouble loading portal. Text 'STOP' to cancel.";
              }
            } catch (e) {
              cmdReply = "Oops! Something went wrong.";
            }
          } else {
            cmdReply = "You don't have an active subscription yet. Text 'UPGRADE' to get started!";
          }
        }

        await store.appendConversation && await store.appendConversation({
          userId: (await store.getOrCreateUserByPhone(from)).id,
          direction: 'outbound',
          content: cmdReply,
          meta: { command: specialCmd.command }
        });

        smsBeshMetrics.outbound += 1;
        const twiml = new twilio.twiml.MessagingResponse();
        twiml.message(sanitizeSmsReply(cmdReply, 320));
        return res.type('text/xml').send(twiml.toString());
      }

      const classification = classifyInboundText({
        from, to,
        knownOwnerPhones: new Set(),
        businessByNumber: {}
      });

      let reply;

      if (classification.kind === 'new_user') {
        const onboarding = await store.getOnboardingState(from);

        // Store inbound message
        await store.appendConversation({
          userId: onboarding.user.id,
          direction: 'inbound',
          content: body,
          meta: { to, messageSid }
        });

        if (onboarding.user.onboarding_complete) {
          // ===== RATE LIMIT CHECK (free tier) =====
          if (!hasPaidSubscription(onboarding.user)) {
            const today = new Date().toISOString().split('T')[0];
            const userMsgsToday = (onboarding.user.last_message_date === today)
              ? (onboarding.user.messages_today || 0)
              : 0;
            const userMsgsMonth = onboarding.user.messages_this_month || 0;

            if (userMsgsToday >= FREE_TIER_DAILY_LIMIT) {
              smsBeshMetrics.outbound += 1;
              const twiml = new twilio.twiml.MessagingResponse();
              twiml.message(sanitizeSmsReply(
                "You\'ve hit your daily limit (20 messages). Upgrade to Pro for unlimited texts — reply UPGRADE to learn more, or text me again tomorrow! 🚀", 320
              ));
              return res.type('text/xml').send(twiml.toString());
            }

            if (userMsgsMonth >= FREE_TIER_MONTHLY_LIMIT) {
              smsBeshMetrics.outbound += 1;
              const twiml = new twilio.twiml.MessagingResponse();
              twiml.message(sanitizeSmsReply(
                "You\'ve hit your monthly limit (600 messages). Upgrade to Pro for unlimited texts — reply UPGRADE to learn more! 🚀", 320
              ));
              return res.type('text/xml').send(twiml.toString());
            }
          }

          // =====ING: AI CON POST-ONBOARDVERSATION =====
          smsBeshMetrics.aiConversations += 1;

          // Use smart intent detection with sentiment
          const userContext = {
            onboardingStage: onboarding.state?.stage,
            pendingQuestion: onboarding.state?.pendingQuestion,
            goals: await store.getActiveGoals?.(onboarding.user.id) || []
          };
          const intentResult = detectIntent(body, userContext);
          const sentiment = detectSentiment(body);
          const routing = routeMessage(intentResult);
          
          // Log insights for data collection
          const intent = intentResult.intent;
          logger.info('Intent detected', { intent, sentiment: sentiment.sentiment, route: routing.route, userId: onboarding.user.id });

          // Create goal if goal intent detected (deduplicated by title)
          if (intent === 'goal' && store.createGoal) {
            const goalText = memory.extractGoalText(body);
            if (goalText) {
              const activeGoals = await store.getActiveGoals(onboarding.user.id);
              const duplicate = activeGoals.find(
                g => g.title.toLowerCase() === goalText.toLowerCase()
              );
              if (!duplicate) {
                await store.createGoal({
                  userId: onboarding.user.id,
                  title: goalText,
                  cadence: null
                });
              }
            }
          }

          // Create reminder if reminder intent detected
          if (intent === 'reminder' && store.createReminder) {
            const parsed = parseReminder(body, (onboarding.user.profile_json || {}).timezone || 'UTC');
            if (parsed) {
              await store.createReminder({
                userId: onboarding.user.id,
                text: parsed.text,
                scheduleJson: { hour: parsed.hour, minute: parsed.minute, recurring: parsed.recurring },
                nextFireAt: parsed.nextFireAt
              });
            } else {
              // parseReminder couldn't extract a time — ask explicitly rather than silently dropping
              reply = "Got it — what time should I remind you? Something like 'at 9am' works great.";
            }
          }

          // Only call AI if a handler above hasn't already set an explicit reply
          if (!reply) {
            // Try rule-based handlers first (free, faster)
            const ruleResult = await processWithRules({
              intent: intentResult,
              user: onboarding.user,
              context: userContext,
              store,
              message: body
            });
            
            if (ruleResult && ruleResult.handled) {
              reply = ruleResult.response;
              logger.info('Rule handler executed', { handler: ruleResult.handler, intent: ruleResult.intent });
            } else {
              // Fall back to LLM
              const ctx = await memory.buildContext(onboarding.user.id);
            // Detect goal completion — celebrate + offer to mark done
          const isCompletion = detectGoalCompletion(body);
          if (isCompletion && store.getActiveGoals) {
            const userGoals = await store.getActiveGoals(onboarding.user.id);
            if (userGoals.length > 0) {
              // Append completion context to AI message
              body = body + ' [user is celebrating completing their goal: ' + userGoals[0].title + ']';
            }
          }

            const startTime = Date.now();
            try {
              const result = await ai.generateResponse({
                context: ctx,
                userMessage: body,
                intent
              });
              const responseTime = Date.now() - startTime;
              updateAIMetrics(true, responseTime, intent, result.blocked || false);
              reply = result.response;
            } catch (aiErr) {
              const responseTime = Date.now() - startTime;
              updateAIMetrics(false, responseTime, intent, false);
              logger.error('AI generation failed in SMS flow', { error: aiErr.message, userId: onboarding?.user?.id });
              reply = "Hey, I hit a snag. Mind sending that again?";
            }
            }
          }

          await store.appendConversation({
            userId: onboarding.user.id,
            direction: 'outbound',
            content: reply,
            meta: { intent, inReplyToMessageSid: messageSid }
          });
          
          // Log insight for analytics
          logInsight({
            userId: onboarding.user.id,
            conversationId: null,
            intent: intentResult,
            sentiment: sentiment,
            routing: routing,
            metadata: {
              messageLength: body.length,
              responseTimeMs: Date.now() - (global.aiStartTime || Date.now()),
              activeGoals: userContext.goals?.length || 0
            }
          }).catch(err => console.log('[insights] Error:', err.message));
        } else {
          // ===== ONBOARDING FLOW =====
          smsBeshMetrics.onboardingStarted += 1;

          const step = nextOnboardingStep(
            { stage: onboarding.stage, profile: onboarding.profile },
            body
          );

          const savedUser = await store.saveOnboardingStep({
            userId: onboarding.user.id,
            phone: from,
            state: step.state,
            done: step.done
          });

          reply = step.response;

          if (step.done && !onboarding.user.onboarding_complete) {
            smsBeshMetrics.onboardingCompleted += 1;
          }

          await store.appendConversation({
            userId: savedUser.id,
            direction: 'outbound',
            content: reply,
            meta: { stage: step.state.stage, inReplyToMessageSid: messageSid }
          });
        }
      } else {
        reply = 'Besh SMS route is active. More flows coming in Sprint 1.';
      }

      // Increment rate limit counters for post-onboarding users
      if (classification.kind === 'new_user') {
        const counterUser = await store.getOrCreateUserByPhone(from);
        if (counterUser.onboarding_complete && !hasPaidSubscription(counterUser) && store.updateUserMessageCount) {
          const today = new Date().toISOString().split('T')[0];
          const curDaily = (counterUser.last_message_date === today)
            ? (counterUser.messages_today || 0) : 0;
          store.updateUserMessageCount(counterUser.id, {
            messages_today: curDaily + 1,
            last_message_date: today,
            messages_this_month: (counterUser.messages_this_month || 0) + 1
          });
        }
      }

      smsBeshMetrics.outbound += 1;
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message(sanitizeSmsReply(reply, 320));
      return res.type('text/xml').send(twiml.toString());
    } catch (error) {
      smsBeshMetrics.failures += 1;
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message('Sorry — I hit a hiccup. Please resend your message in a moment.');
      return res.type('text/xml').send(twiml.toString());
    }
  };
}

function createSmsBeshRouter({ store, llm } = {}) {
  const router = express.Router();
  const finalStore = store || createBeshSmsStore();

  const validateTwilioRequest = (req, res, next) => {
    if (process.env.NODE_ENV === 'test' || process.env.SKIP_TWILIO_AUTH === 'true') {
      return next();
    }
    twilio.webhook({
      authToken: process.env.TWILIO_AUTH_TOKEN,
      url: process.env.BASE_URL ? `${process.env.BASE_URL}/api/sms/besh` : undefined,
      validate: true
    })(req, res, next);
  };

  router.post('/sms/besh', validateTwilioRequest, createSmsBeshHandler({ store: finalStore, llm }));
  return router;
}

const router = createSmsBeshRouter();

function getSmsBeshMetrics() {
  return { ...smsBeshMetrics };
}

module.exports = router;
module.exports.createSmsBeshRouter = createSmsBeshRouter;
module.exports.createSmsBeshHandler = createSmsBeshHandler;
module.exports.getSmsBeshMetrics = getSmsBeshMetrics;
