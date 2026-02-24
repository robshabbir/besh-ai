const express = require('express');
const twilio = require('twilio');
const {
  classifyInboundText,
  nextOnboardingStep,
  sanitizeSmsReply,
  normalizePhone
} = require('../services/besh-sms');
const { createBeshSmsStore } = require('../services/besh-sms-store');

const smsBeshMetrics = {
  inbound: 0,
  outbound: 0,
  onboardingStarted: 0,
  onboardingCompleted: 0,
  duplicatesIgnored: 0,
  failures: 0
};

function createSmsBeshHandler({ store }) {
  return async (req, res) => {
    const from = normalizePhone(req.body.From || '');
    const to = normalizePhone(req.body.To || '');
    const body = String(req.body.Body || '').trim();
    const messageSid = String(req.body.MessageSid || '').trim();

    try {
      smsBeshMetrics.inbound += 1;

      if (messageSid) {
        const existing = await store.findConversationByMessageSid(messageSid);
        if (existing) {
          smsBeshMetrics.duplicatesIgnored += 1;
          const twiml = new twilio.twiml.MessagingResponse();
          twiml.message(sanitizeSmsReply('Got it — already processed that message. Send your next update anytime.', 160));
          return res.type('text/xml').send(twiml.toString());
        }
      }

      const classification = classifyInboundText({
        from,
        to,
        knownOwnerPhones: new Set(),
        businessByNumber: {}
      });

      let reply;

      if (classification.kind === 'new_user') {
        const onboarding = await store.getOnboardingState(from);

        if (!onboarding.user.onboarding_complete) {
          smsBeshMetrics.onboardingStarted += 1;
        }

        await store.appendConversation({
          userId: onboarding.user.id,
          direction: 'inbound',
          content: body,
          meta: { to, messageSid }
        });

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
      } else {
        reply = 'Besh SMS route is active. More flows coming in Sprint 1.';
      }

      smsBeshMetrics.outbound += 1;
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message(sanitizeSmsReply(reply, 160));
      return res.type('text/xml').send(twiml.toString());
    } catch (error) {
      smsBeshMetrics.failures += 1;
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message('Sorry — I hit a hiccup. Please resend your message in a moment.');
      return res.type('text/xml').send(twiml.toString());
    }
  };
}

function createSmsBeshRouter({ store } = {}) {
  const router = express.Router();
  const finalStore = store || createBeshSmsStore();

  // Middleware to validate Twilio signature
  const validateTwilioRequest = (req, res, next) => {
    if (process.env.NODE_ENV === 'test' || process.env.SKIP_TWILIO_AUTH === 'true') {
      return next();
    }
    
    twilio.webhook({ 
      authToken: process.env.TWILIO_AUTH_TOKEN,
      validate: true
    })(req, res, next);
  };

  router.post('/sms/besh', validateTwilioRequest, createSmsBeshHandler({ store: finalStore }));
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