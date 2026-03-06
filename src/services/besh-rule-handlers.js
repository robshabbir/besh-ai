/**
 * Besh Rule-Based Handlers
 * Handles simple intents without LLM - cost optimization
 */

const { detectIntent, routeMessage } = require('./besh-intent');

/**
 * Rule-based handlers for simple intents
 */
const ruleHandlers = {
  /**
   * Greeting handler
   */
  greeting: async ({ user, context }) => {
    const name = user?.profile?.name;
    const time = new Date().getHours();
    let greeting = 'hey';
    if (time >= 5 && time < 12) greeting = 'morning';
    else if (time >= 12 && time < 17) greeting = 'afternoon';
    else if (time >= 17 && time < 21) greeting = 'evening';
    
    if (name) {
      return `hey ${name}! good ${greeting} ☀️ whats up?`;
    }
    return `hey! good ${gorning}! whats good?`;
  },

  /**
   * Goal completion celebration
   */
  goal_complete: async ({ user, context, store }) => {
    // Get active goals to reference
    let goalText = '';
    if (store && user?.id) {
      try {
        const goals = await store.getActiveGoals(user.id);
        if (goals && goals.length > 0) {
          goalText = ` with the ${goals[0].title} goal`;
        }
      } catch (e) {}
    }
    
    const responses = [
      `YESSS 🎉 thats huge${goalText}! so proud of you`,
      `HELL YEAH 🔥 you crushed it${goalText}!`,
      `WAY TO GO 💪${goalText}! thats what im talking about`,
      `PRESTO 👏 you did it${goalText}!`
    ];
    return responses[Math.floor(Math.random() * responses.length)] + ' want me to mark it done?';
  },

  /**
   * Goal missed - encouragement
   */
  goal_missed: async ({ user, context }) => {
    const responses = [
      `ah man. dont stress. one day doesnt define you. get back at it tmrw yeah?`,
      `it happens. just shake it off and come back stronger tmrw. i got you.`,
      `nah dont beat yourself up. happens to everybody. just get back on the horse.`,
      `one miss doesnt erase all your progress. lets get back at it tomorrow.`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  },

  /**
   * Reminder set confirmation
   */
  reminder_set: async ({ user, context, reminderText }) => {
    return `bet 💧 ill remind you about "${reminderText}". got it set.`;
  },

  /**
   * Reminder cancel confirmation
   */
  reminder_cancel: async ({ user, context, reminderText }) => {
    return `done ✋ reminder cancelled. let me know if you want to set another one.`;
  },

  /**
   * Thanks handler
   */
  thanks: async ({ user, context }) => {
    const responses = [
      `of course! thats what im here for 💪`,
      `yeah of course! anytime 🔥`,
      `got your back always ✌️`,
      `dont mention it! lets keep making moves`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  },

  /**
   * Goodbye handler
   */
  goodbye: async ({ user, context }) => {
    const responses = [
      `alright later! hit me up anytime 👊`,
      `bye! dont be a stranger 😎`,
      `talk soon! keep grinding 💪`,
      `later! you got this ✌️`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  },

  /**
   * Confirmation handler (yes/no responses)
   */
  confirmation: async ({ user, context, response, pendingQuestion }) => {
    const lower = (response || '').toLowerCase();
    const isYes = /^(yes|yeah|yep|sure|ok|okay|definitely|absolutely)/.test(lower);
    
    if (isYes) {
      return `bet! lets do it 💪`;
    }
    return `alright no worries 👍`;
  },

  /**
   * Onboarding age response
   */
  onboarding_age: async ({ user, context, age }) => {
    const ageNum = parseInt(age);
    if (ageNum <= 19) {
      return `nice, you're a young one! 🎉 last thing — do you want me to be casual ('hey!' 😎), formal ('Hello!' 👔), or motivate you ('LET'S GO!' 🔥)?`;
    } else if (ageNum <= 29) {
      return `cool, you're young adult! last thing — casual ('hey!' 😎), formal ('Hello!' 👔), or motivate you ('LET'S GO!' 🔥)?`;
    } else if (ageNum <= 49) {
      return `got it, you're an adult! last thing — casual ('hey!' 😎), formal ('Hello!' 👔), or motivate you ('LET'S GO!' 🔥)?`;
    }
    return `respect, mature adult in the house! last thing — casual ('hey!' 😎), formal ('Hello!' 👔), or motivate you ('LET'S GO!' 🔥)?`;
  }
};

/**
 * Process message with rule handler if applicable
 * @param {object} params
 * @returns {object|null} - { response: string, handled: true } or null if not handled by rules
 */
async function processWithRules({ intent, user, context, store, message }) {
  // Only process if route is 'rule'
  const routing = routeMessage(intent);
  if (routing.route !== 'rule') {
    return null;
  }

  const handler = ruleHandlers[routing.handler];
  if (!handler) {
    return null;
  }

  try {
    const response = await handler({
      user,
      context,
      store,
      intent: intent.intent,
      reminderText: message,
      age: intent.details?.age,
      response: intent.details?.response,
      pendingQuestion: context?.pendingQuestion
    });

    return {
      response,
      handled: true,
      handler: routing.handler,
      intent: intent.intent
    };
  } catch (err) {
    console.error('[rules] Handler error:', err);
    return null;
  }
}

module.exports = {
  ruleHandlers,
  processWithRules
};
