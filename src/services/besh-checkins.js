/**
 * Besh Proactive Check-ins — The Tomo killer feature
 * 
 * Unlike Tomo which only responds, Besh reaches out proactively:
 * - Morning motivation based on goals
 * - Evening "how'd it go?" reflection
 * - Streak tracking ("3 days in a row!")
 * - Missed check-in ("haven't heard from you in 2 days")
 */

const logger = require('../utils/logger');

const CHECKIN_TEMPLATES = {
  morning: [
    "Morning {name}! Ready to {goal} today? 🌅",
    "Hey {name} — new day, new chance to crush {goal}. What's the plan?",
    "Rise and shine {name}! Your goal: {goal}. Let's make it happen 💪",
  ],
  evening: [
    "Hey {name}, how'd today go with {goal}?",
    "{name}! End of day check-in — did you make progress on {goal}?",
    "Wrapping up the day {name}. How'd {goal} go? 🌙",
  ],
  streak: [
    "🔥 {name}, that's {count} days in a row! Keep the streak alive with {goal}.",
    "{count} day streak {name}! You're on fire with {goal} 🔥",
  ],
  missed: [
    "Hey {name}, haven't heard from you in a bit. Everything ok? Still working on {goal}?",
    "{name}! Just checking in — you've been quiet. How's {goal} going?",
  ]
};

/**
 * Pick a random template and fill in variables
 */
function renderTemplate(type, vars) {
  const templates = CHECKIN_TEMPLATES[type];
  if (!templates || templates.length === 0) return null;
  
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template
    .replace(/\{name\}/g, vars.name || 'there')
    .replace(/\{goal\}/g, vars.goal || 'your goal')
    .replace(/\{count\}/g, vars.count || '0');
}

/**
 * Determine which users need a proactive check-in.
 * Called by the scheduler alongside reminders.
 */
async function getCheckinsDue({ store, now }) {
  const currentHour = now.getHours(); // Server timezone — we'll adjust per user
  const checkins = [];

  try {
    // Get all onboarded users with active goals
    const users = await store.getOnboardedUsersWithGoals();

    for (const user of users) {
      const tz = user.profile_json?.timezone || 'UTC';
      const userHour = getHourInTimezone(now, tz);
      const goal = user.goals?.[0]?.title || user.profile_json?.goal || null;
      if (!goal) continue;

      // Morning check-in: 8-9am in user's timezone
      if (userHour >= 8 && userHour < 9) {
        const alreadySent = await store.hasCheckinToday(user.id, 'morning');
        if (!alreadySent) {
          checkins.push({
            userId: user.id,
            phone: user.phone,
            type: 'morning',
            message: renderTemplate('morning', { name: user.display_name, goal })
          });
        }
      }

      // Evening check-in: 8-9pm in user's timezone
      if (userHour >= 20 && userHour < 21) {
        const alreadySent = await store.hasCheckinToday(user.id, 'evening');
        if (!alreadySent) {
          checkins.push({
            userId: user.id,
            phone: user.phone,
            type: 'evening',
            message: renderTemplate('evening', { name: user.display_name, goal })
          });
        }
      }
    }
  } catch (err) {
    logger.error('Check-in computation error', { error: err.message });
  }

  return checkins;
}

function getHourInTimezone(date, timezone) {
  try {
    const str = date.toLocaleString('en-US', { timeZone: timezone, hour: 'numeric', hour12: false });
    return parseInt(str, 10);
  } catch {
    return date.getUTCHours();
  }
}

module.exports = { getCheckinsDue, renderTemplate, getHourInTimezone, CHECKIN_TEMPLATES };
