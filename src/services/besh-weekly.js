/**
 * Besh Weekly Summary — Sunday evening recap
 * Sent at 7pm in user's timezone every Sunday
 */

const logger = require('../utils/logger');
const { getHourInTimezone } = require('./besh-checkins');

async function getWeeklySummariesDue({ store, now }) {
  const summaries = [];
  const dayOfWeek = now.getDay(); // 0 = Sunday

  if (dayOfWeek !== 0) return summaries; // Only Sundays

  try {
    const users = await store.getOnboardedUsersWithGoals();
    for (const user of users) {
      const tz = user.profile_json?.timezone || 'UTC';
      const userHour = getHourInTimezone(now, tz);

      // Send at 7pm on Sundays
      if (userHour >= 19 && userHour < 20) {
        const alreadySent = await store.hasCheckinToday(user.id, 'weekly');
        if (!alreadySent) {
          const goals = user.goals || [];
          const name = user.display_name || 'there';
          const msg = buildWeeklySummary(name, goals);
          summaries.push({ userId: user.id, phone: user.phone, type: 'weekly', message: msg });
        }
      }
    }
  } catch (err) {
    logger.error('Weekly summary computation error', { error: err.message });
  }

  return summaries;
}

function buildWeeklySummary(name, goals) {
  if (goals.length === 0) {
    return `Hey ${name}! Wrapping up the week — what's one goal you want to set for next week? 🎯`;
  }

  const goalList = goals.slice(0, 3).map(g => `• ${g.title}`).join('\n');
  const templates = [
    `Week wrap-up, ${name}! 🌟 You've been working on:\n${goalList}\n\nHow'd this week go overall? New week starts tomorrow — let's crush it.`,
    `Hey ${name}, week's done! 🎉 Your goals this week:\n${goalList}\n\nWhat's your game plan for next week?`,
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

module.exports = { getWeeklySummariesDue, buildWeeklySummary };
