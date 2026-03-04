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

// US area code -> timezone (covers ~95% of US numbers)
const AREA_CODE_TIMEZONES = {
  '201':'America/New_York','202':'America/New_York','203':'America/New_York','212':'America/New_York',
  '213':'America/Los_Angeles','214':'America/Chicago','215':'America/New_York','216':'America/New_York',
  '224':'America/Chicago','225':'America/Chicago','228':'America/Chicago','229':'America/New_York',
  '231':'America/New_York','234':'America/New_York','239':'America/New_York','240':'America/New_York',
  '248':'America/New_York','251':'America/Chicago','252':'America/New_York','253':'America/Los_Angeles',
  '254':'America/Chicago','256':'America/Chicago','260':'America/New_York','262':'America/Chicago',
  '267':'America/New_York','269':'America/New_York','270':'America/New_York','272':'America/New_York',
  '281':'America/Chicago','301':'America/New_York','302':'America/New_York','303':'America/Denver',
  '304':'America/New_York','305':'America/New_York','307':'America/Denver','308':'America/Chicago',
  '309':'America/Chicago','310':'America/Los_Angeles','312':'America/Chicago','313':'America/New_York',
  '314':'America/Chicago','315':'America/New_York','316':'America/Chicago','317':'America/New_York',
  '318':'America/Chicago','319':'America/Chicago','320':'America/Chicago','321':'America/New_York',
  '323':'America/Los_Angeles','325':'America/Chicago','330':'America/New_York','331':'America/Chicago',
  '334':'America/Chicago','336':'America/New_York','337':'America/Chicago','339':'America/New_York',
  '347':'America/New_York','346':'America/Chicago','351':'America/New_York','352':'America/New_York',
  '360':'America/Los_Angeles','361':'America/Chicago','385':'America/Denver','386':'America/New_York',
  '401':'America/New_York','402':'America/Chicago','404':'America/New_York','405':'America/Chicago',
  '406':'America/Denver','407':'America/New_York','408':'America/Los_Angeles','409':'America/Chicago',
  '410':'America/New_York','412':'America/New_York','413':'America/New_York','414':'America/Chicago',
  '415':'America/Los_Angeles','417':'America/Chicago','419':'America/New_York','423':'America/New_York',
  '424':'America/Los_Angeles','425':'America/Los_Angeles','430':'America/Chicago','432':'America/Chicago',
  '434':'America/New_York','435':'America/Denver','440':'America/New_York','443':'America/New_York',
  '458':'America/Los_Angeles','469':'America/Chicago','470':'America/New_York','475':'America/New_York',
  '478':'America/New_York','479':'America/Chicago','480':'America/Denver','484':'America/New_York',
  '501':'America/Chicago','502':'America/New_York','503':'America/Los_Angeles','504':'America/Chicago',
  '505':'America/Denver','507':'America/Chicago','508':'America/New_York','509':'America/Los_Angeles',
  '510':'America/Los_Angeles','512':'America/Chicago','513':'America/New_York','515':'America/Chicago',
  '516':'America/New_York','517':'America/New_York','518':'America/New_York','520':'America/Denver',
  '530':'America/Los_Angeles','539':'America/Chicago','540':'America/New_York','541':'America/Los_Angeles',
  '551':'America/New_York','559':'America/Los_Angeles','561':'America/New_York','562':'America/Los_Angeles',
  '563':'America/Chicago','567':'America/New_York','570':'America/New_York','571':'America/New_York',
  '573':'America/Chicago','574':'America/New_York','575':'America/Denver','580':'America/Chicago',
  '585':'America/New_York','586':'America/New_York','601':'America/Chicago','602':'America/Denver',
  '603':'America/New_York','605':'America/Chicago','606':'America/New_York','607':'America/New_York',
  '608':'America/Chicago','609':'America/New_York','610':'America/New_York','612':'America/Chicago',
  '614':'America/New_York','615':'America/Chicago','616':'America/New_York','617':'America/New_York',
  '618':'America/Chicago','619':'America/Los_Angeles','620':'America/Chicago','623':'America/Denver',
  '626':'America/Los_Angeles','628':'America/Los_Angeles','629':'America/Chicago','630':'America/Chicago',
  '631':'America/New_York','636':'America/Chicago','641':'America/Chicago','646':'America/New_York',
  '650':'America/Los_Angeles','651':'America/Chicago','657':'America/Los_Angeles','660':'America/Chicago',
  '661':'America/Los_Angeles','662':'America/Chicago','667':'America/New_York','669':'America/Los_Angeles',
  '678':'America/New_York','681':'America/New_York','682':'America/Chicago','689':'America/New_York',
  '701':'America/Chicago','702':'America/Los_Angeles','703':'America/New_York','704':'America/New_York',
  '706':'America/New_York','707':'America/Los_Angeles','708':'America/Chicago','712':'America/Chicago',
  '713':'America/Chicago','714':'America/Los_Angeles','715':'America/Chicago','716':'America/New_York',
  '717':'America/New_York','718':'America/New_York','719':'America/Denver','720':'America/Denver',
  '724':'America/New_York','725':'America/Los_Angeles','727':'America/New_York','731':'America/Chicago',
  '732':'America/New_York','734':'America/New_York','737':'America/Chicago','740':'America/New_York',
  '747':'America/Los_Angeles','754':'America/New_York','757':'America/New_York','760':'America/Los_Angeles',
  '762':'America/New_York','763':'America/Chicago','765':'America/New_York','769':'America/Chicago',
  '770':'America/New_York','772':'America/New_York','773':'America/Chicago','774':'America/New_York',
  '775':'America/Los_Angeles','779':'America/Chicago','781':'America/New_York','786':'America/New_York',
  '801':'America/Denver','802':'America/New_York','803':'America/New_York','804':'America/New_York',
  '805':'America/Los_Angeles','806':'America/Chicago','808':'Pacific/Honolulu','810':'America/New_York',
  '812':'America/New_York','813':'America/New_York','814':'America/New_York','815':'America/Chicago',
  '816':'America/Chicago','817':'America/Chicago','818':'America/Los_Angeles','828':'America/New_York',
  '830':'America/Chicago','831':'America/Los_Angeles','832':'America/Chicago','843':'America/New_York',
  '845':'America/New_York','847':'America/Chicago','848':'America/New_York','850':'America/New_York',
  '856':'America/New_York','857':'America/New_York','858':'America/Los_Angeles','859':'America/New_York',
  '860':'America/New_York','862':'America/New_York','863':'America/New_York','864':'America/New_York',
  '865':'America/New_York','870':'America/Chicago','872':'America/Chicago','878':'America/New_York',
  '901':'America/Chicago','903':'America/Chicago','904':'America/New_York','906':'America/New_York',
  '907':'America/Anchorage','908':'America/New_York','909':'America/Los_Angeles','910':'America/New_York',
  '912':'America/New_York','913':'America/Chicago','914':'America/New_York','915':'America/Denver',
  '916':'America/Los_Angeles','917':'America/New_York','918':'America/Chicago','919':'America/New_York',
  '920':'America/Chicago','925':'America/Los_Angeles','928':'America/Denver','929':'America/New_York',
  '931':'America/Chicago','936':'America/Chicago','937':'America/New_York','938':'America/Chicago',
  '940':'America/Chicago','941':'America/New_York','947':'America/New_York','949':'America/Los_Angeles',
  '951':'America/Los_Angeles','952':'America/Chicago','954':'America/New_York','956':'America/Chicago',
  '970':'America/Denver','971':'America/Los_Angeles','972':'America/Chicago','973':'America/New_York',
  '978':'America/New_York','979':'America/Chicago','980':'America/New_York','984':'America/New_York',
  '985':'America/Chicago','989':'America/New_York',
};

function timezoneFromPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  let areaCode;
  if (digits.length === 11 && digits.startsWith('1')) areaCode = digits.substring(1, 4);
  else if (digits.length === 10) areaCode = digits.substring(0, 3);
  else return null;
  return AREA_CODE_TIMEZONES[areaCode] || null;
}

function resolveTimezone(input) {
  if (!input) return null;
  const lower = input.trim().toLowerCase();
  if (TIMEZONE_ALIASES[lower]) return TIMEZONE_ALIASES[lower];
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
  if (knownOwnerPhones.has(fromN)) return { kind: 'owner', from: fromN, to: toN };
  const biz = businessByNumber[toN];
  if (biz) return { kind: 'customer', from: fromN, to: toN, businessId: biz.id };
  return { kind: 'new_user', from: fromN, to: toN };
}

// Robust greeting detection
const GREETING_RE = /^(hi+|hey+|hello+|yo+|sup|wh?at'?s?\s*up|howdy|hola|greetings|good\s*(morning|afternoon|evening|night)|start|begin|ok(ay)?|sure|ye[ahps]+|nah?|no|lol|lmao|haha|omg|wow|cool|nice|test|testing|help|menu)\s*[!?.,]*$/i;

function isGreeting(text) {
  return GREETING_RE.test((text || '').trim());
}

function getAgeGroup(birthYear) {
  const age = new Date().getFullYear() - birthYear;
  if (age <= 19) return 'teen';
  if (age <= 29) return 'young_adult';
  if (age <= 49) return 'adult';
  return 'mature_adult';
}

function parseBirthYear(text) {
  const currentYear = new Date().getFullYear();
  // Allow years from 1924 to 2012 for age between ~12 and ~100
  const yearMatch = String(text).match(/\b(19(?:2[4-9]|[3-9]\d)|20(?:0\d|1[0-2]))\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    // Double check age derived from year is reasonable
    const age = currentYear - year;
    if (age >= 12 && age <= 100) return year;
  }
  return null;
}

function parseCommStyle(text) {
  const lower = String(text).toLowerCase();
  if (lower.includes('casual') || lower.includes('relaxed') || lower.includes('fun') || lower.includes('chill') || lower.includes('easy') || lower.includes('😎')) return 'casual';
  if (lower.includes('formal') || lower.includes('professional') || lower.includes('serious') || lower.includes('proper') || lower.includes('👔')) return 'formal';
  if (lower.includes('motivate') || lower.includes('go') || lower.includes('energetic') || lower.includes('hype') || lower.includes('🔥')) return 'motivating';
  return 'normal';
}

function nextOnboardingStep(state, inboundText, phoneNumber) {
  const text = String(inboundText || '').trim();

  const lower = text.toLowerCase();
  const current = state || { stage: 'ask_name', profile: {} };
  const profile = { ...(current.profile || {}) };

  if (current.stage === 'ask_name') {
    if (isGreeting(text) || !text) {
      return {
        state: { stage: 'ask_name', profile },
        response: "hey! 👋 i'm besh — think of me as your personal AI that lives in your texts. what should i call you?",
        done: false
      };
    }
    let name = text;
    const nameMatch = text.match(/(?:i'?m|my name is|call me|it's|this is)\s+(.+)/i);
    if (nameMatch) name = nameMatch[1].trim();
    name = name.charAt(0).toUpperCase() + name.slice(1);
    profile.name = name;
    const autoTz = timezoneFromPhone(phoneNumber);
    if (autoTz) profile.timezone = autoTz;
    return {
      state: { stage: 'ask_goal', profile },
      response: name + '! love that. so what\'s something you\'re working on right now? a goal, a habit, anything — i\'ll help you stay on it 💪',
      done: false
    };
  }

  if (current.stage === 'ask_goal') {
    if (lower.startsWith('actually') || lower.startsWith('wait') || lower.startsWith('change')) {
      const corrected = text.replace(/^(actually|wait|change)[,:\s-]*/i, '')
        .replace(/^(my name is|i'm|call me|it's)\s+/i, '').trim();
      if (corrected && corrected.length < 30) {
        profile.name = corrected.charAt(0).toUpperCase() + corrected.slice(1);
        return {
          state: { stage: 'ask_goal', profile },
          response: 'got it, ' + profile.name + '! so what\'s something you\'re working on? 💪',
          done: false
        };
      }
    }

    profile.goal = text || 'stay consistent';
    if (!profile.timezone) profile.timezone = 'UTC';
    
    return {
      state: { stage: 'ask_age', profile },
      response: 'locked in 🔥 i got you on "' + profile.goal + '". one quick question — how old are you? (just your age, i won\'t judge)',
      done: false
    };
  }

  // Handle ask_age stage
  if (current.stage === 'ask_age') {
    const birthYear = parseBirthYear(text);
    
    if (birthYear) {
      profile.birth_year = birthYear;
      profile.age_group = computeAgeGroup(birthYear);
    } else {
      return {
        state: { stage: 'ask_age', profile },
        response: "hmm, i didn't catch that. can you tell me your birth year? (like 1990)",
        done: false
      };
    }
    
    return {
      state: { stage: 'ask_comm_style', profile },
      response: "cool, you're a " + profile.age_group.replace('_', ' ') + "! last thing — how do you want me to talk? casual (like this! 😎), formal (more proper 👔), or motivating (LET\'S GO! 🔥)?",
      done: false
    };
  }

  // Handle ask_comm_style stage
  if (current.stage === 'ask_comm_style') {
    profile.comm_style = parseCommStyle(text);
    
    return {
      state: { stage: 'complete', profile },
      response: 'all set, ' + profile.name + '! 🎉 i got your style: ' + profile.comm_style + '. text me anytime about your goal or anything else. let\'s do this!',
      done: true
    };
  }

  if (lower.includes('summary')) {
    return {
      state: current,
      response: (profile.name || 'hey') + ' — goal: ' + (profile.goal || 'not set') + '. text me anytime.',
      done: true
    };
  }

  return {
    state: current,
    response: "you're all set — just text me whenever. i'm here 24/7",
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
  timezoneFromPhone,
  normalizePhone,
  classifyInboundText,
  nextOnboardingStep,
  sanitizeSmsReply,
  isGreeting,
  AREA_CODE_TIMEZONES
};

function computeAgeGroup(birthYear) {
  const age = new Date().getFullYear() - birthYear;
  if (age >= 13 && age <= 19) return 'teen';
  if (age >= 20 && age <= 29) return 'young_adult';
  if (age >= 30 && age <= 49) return 'adult';
  if (age >= 50) return 'mature_adult';
  return 'young_adult'; // Default if outside explicit ranges
}
