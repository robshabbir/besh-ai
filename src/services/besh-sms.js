
const TIMEZONE_ALIASES = {
  'est': 'America/New_York', 'edt': 'America/New_York', 'eastern': 'America/New_York',
  'cst': 'America/Chicago', 'cdt': 'America/Chicago', 'central': 'America/Chicago',
  'mst': 'America/Denver', 'mdt': 'America/Denver', 'mountain': 'America/Denver',
  'pst': 'America/Los_Angeles', 'pdt': 'America/Los_Angeles', 'pacific': 'America/Los_Angeles',
  'gmt': 'UTC', 'utc': 'UTC', 'uk': 'Europe/London', 'london': 'Europe/London',
  'dubai': 'Asia/Dubai', 'ist': 'Asia/Kolkata', 'india': 'Asia/Kolkata',
  'dhaka': 'Asia/Dhaka', 'bst': 'Asia/Dhaka', 'bangladesh': 'Asia/Dhaka',
  'tokyo': 'Asia/Tokyo', 'jst': 'Asia/Tokyo', 'sydney': 'Australia/Sydney',
  'paris': 'Europe/Paris', 'berlin': 'Europe/Berlin', 'toronto': 'America/Toronto',
};

function resolveTimezone(input) {
  if (!input) return null;
  const lower = input.trim().toLowerCase();
  if (TIMEZONE_ALIASES[lower]) return TIMEZONE_ALIASES[lower];
  // Try as-is (e.g. 'America/New_York')
  try {
    new Date().toLocaleString('en-US', { timeZone: input.trim() });
    return input.trim();
  } catch { return null; }
}

function normalizePhone(phone = '') {
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `+1${digits}`;
  if (digits.startsWith('1') && digits.length === 11) return `+${digits}`;
  return `+${digits}`;
}

function classifyInboundText({ from, to, knownOwnerPhones = new Set(), businessByNumber = {} }) {
  const fromN = normalizePhone(from);
  const toN = normalizePhone(to);

  if (knownOwnerPhones.has(fromN)) {
    return { kind: 'owner', from: fromN, to: toN };
  }

  const biz = businessByNumber[toN];
  if (biz) {
    return { kind: 'customer', from: fromN, to: toN, businessId: biz.id };
  }

  return { kind: 'new_user', from: fromN, to: toN };
}

function nextOnboardingStep(state, inboundText) {
  const text = String(inboundText || '').trim();
  const lower = text.toLowerCase();
  const current = state || { stage: 'ask_name', profile: {} };
  const profile = { ...(current.profile || {}) };

  if (current.stage === 'ask_name') {
    // Detect greetings — don't store as name, ask again
    const greetings = /^(hi|hey|hello|yo|sup|what'?s up|howdy|hola|greetings|good\s*(morning|afternoon|evening)|start|begin|ok|okay|sure|yeah|yes|yep|yea|nah|no)\s*[!?.]*$/i;
    if (greetings.test(text.trim())) {
      return {
        state: { stage: 'ask_name', profile },
        response: `Hey! 👋 I'm Besh — your personal AI, right in your texts. What's your first name?`,
        done: false
      };
    }
    profile.name = text || 'there';
    return {
      state: { stage: 'ask_goal', profile },
      response: `Nice to meet you, ${profile.name}! 👋 I'm Besh — your personal AI, right in your texts. What's one goal you really want to crush this week?`,
      done: false
    };
  }

  if (current.stage === 'ask_goal') {
    profile.goal = text || 'stay consistent';
    return {
      state: { stage: 'ask_timezone', profile },
      response: `Love that. I'll help keep you on track with that every day. Last thing — what's your timezone? (e.g. America/New_York or just say EST, PST, etc.)`,
      done: false
    };
  }

  if (current.stage === 'ask_timezone') {
    if (lower.startsWith('actually')) {
      const priorGoal = profile.goal || 'stay consistent';
      const correctedGoal = text
        .replace(/^actually[,:\s-]*/i, '')
        .replace(/^make that[,:\s-]*/i, '')
        .trim();
      const didUpdate = Boolean(correctedGoal);
      if (didUpdate) {
        profile.goal = correctedGoal;
      }
      return {
        state: { stage: 'ask_timezone', profile },
        response: didUpdate
          ? `Updated — your goal is now: ${profile.goal}. What timezone are you in? (e.g., America/New_York)`
          : `Got it — we'll keep your goal as: ${priorGoal}. What timezone are you in? (e.g., America/New_York)`,
        done: false
      };
    }

    profile.timezone = text || 'UTC';
    return {
      state: { stage: 'complete', profile },
      response: `You're all set, ${profile.name}! 🎯 I've got your goal: ${profile.goal}. I'll check in on you daily and send reminders anytime you ask. Text me anything — let's make it happen.`,
      done: true
    };
  }

  if (lower.includes('summary')) {
    const name = profile.name || 'there';
    const goal = profile.goal || 'stay consistent';
    const timezone = profile.timezone || 'UTC';
    return {
      state: current,
      response: `Summary for ${name}: goal=${goal}; timezone=${timezone}.`,
      done: true
    };
  }

  return {
    state: current,
    response: `Hey again! You're all set — just text me anything about your goals, and I'm here. Text "summary" to see your setup.`,
    done: true
  };
}

function sanitizeSmsReply(text, maxLen = 320) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, Math.max(0, maxLen - 1)).trim()}…`;
}

module.exports = {
  resolveTimezone,
  normalizePhone,
  classifyInboundText,
  nextOnboardingStep,
  sanitizeSmsReply
};
