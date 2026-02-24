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
  const current = state || { stage: 'ask_name', profile: {} };
  const profile = { ...(current.profile || {}) };

  if (current.stage === 'ask_name') {
    profile.name = text || 'there';
    return {
      state: { stage: 'ask_goal', profile },
      response: `Nice to meet you, ${profile.name}. What's your main goal this week?`,
      done: false
    };
  }

  if (current.stage === 'ask_goal') {
    profile.goal = text || 'stay consistent';
    return {
      state: { stage: 'ask_timezone', profile },
      response: 'Great. What timezone are you in? (e.g., America/New_York)',
      done: false
    };
  }

  if (current.stage === 'ask_timezone') {
    profile.timezone = text || 'UTC';
    return {
      state: { stage: 'complete', profile },
      response: `Perfect. You're all set. I'll help you stay on track for: ${profile.goal}.`,
      done: true
    };
  }

  return {
    state: current,
    response: 'You are already set up. Text "summary" anytime.',
    done: true
  };
}

function sanitizeSmsReply(text, maxLen = 320) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, Math.max(0, maxLen - 1)).trim()}…`;
}

module.exports = {
  normalizePhone,
  classifyInboundText,
  nextOnboardingStep,
  sanitizeSmsReply
};
