/**
 * Besh Reminders — Parse, store, and schedule SMS reminders
 */

const REMINDER_PATTERNS = [
  // "remind me to X at H:MMam/pm"
  { regex: /remind(?:er)?\s+(?:me\s+)?to\s+(.+?)\s+(?:every\s+day\s+)?at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i, recurring: false },
  // "reminder to X at H:MMam/pm"  
  { regex: /reminder\s+to\s+(.+?)\s+(?:every\s+day\s+)?at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i, recurring: false },
];

// Check if "every day" or "daily" is in the message
function isRecurring(text) {
  return /every\s+day|daily|every\s+morning|every\s+night/i.test(text);
}

/**
 * Parse a reminder from user text.
 * Returns { text, hour, minute, timezone, recurring, nextFireAt } or null.
 */
function parseReminder(message, timezone = 'UTC') {
  for (const { regex } of REMINDER_PATTERNS) {
    const m = message.match(regex);
    if (m) {
      const text = m[1].replace(/\s+every\s+day/i, '').replace(/\s+daily/i, '').trim();
      let hour = parseInt(m[2], 10);
      const minute = m[3] ? parseInt(m[3], 10) : 0;
      const ampm = m[4].toLowerCase();

      if (ampm === 'pm' && hour !== 12) hour += 12;
      if (ampm === 'am' && hour === 12) hour = 0;

      const recurring = isRecurring(message);
      const nextFireAt = computeNextFire(hour, minute, timezone);

      return { text, hour, minute, timezone, recurring, nextFireAt };
    }
  }
  return null;
}

/**
 * Compute next fire time — today if not yet passed, tomorrow if already past.
 */
function computeNextFire(hour, minute, timezone) {
  const now = new Date();
  
  // Build a date string for today at the specified time in the user's timezone
  const today = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const candidate = new Date(today);
  candidate.setHours(hour, minute, 0, 0);

  // Convert back to UTC by finding the offset
  const nowInTz = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const offsetMs = now.getTime() - nowInTz.getTime();
  
  let fireAt = new Date(candidate.getTime() + offsetMs);
  
  // If already passed today, schedule for tomorrow
  if (fireAt <= now) {
    fireAt = new Date(fireAt.getTime() + 24 * 60 * 60 * 1000);
  }

  return fireAt;
}

module.exports = { parseReminder, computeNextFire };
