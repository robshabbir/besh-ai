/**
 * Besh Commands — Special SMS commands + goal completion detection
 *
 * Handles: STOP/HELP/PAUSE/RESUME/GOALS/SUMMARY
 * Detects: goal completion phrases ("I did it", "done", "completed")
 * Provides: canned responses for each command
 */

const SPECIAL_COMMANDS = {
  stop:       /^(stop|unsubscribe|cancel|quit|end)$/i,
  help:       /^help$/i,
  pause:      /^pause$/i,
  resume:     /^(resume|start|unpause)$/i,
  goals:      /^(goals|my goals|list goals|show goals)$/i,
  summary:    /^(summary|status|my status)$/i,
  upgrade:    /^(upgrade|pro|premium|plus|upgrade to pro|upgrade to plus)$/i,
};

const COMPLETION_PATTERNS = [
  /\b(did it|done|completed|finished|crushed it|achieved|accomplished|knocked it out|nailed it)\b/i,
  /\b(goal achieved|all done|checked off|wrapped up)\b/i,
  /^(✅|done!|did it!|finished!)$/i,
];

const NON_COMPLETION_EXCEPTIONS = [
  /haven'?t (done|finished|completed)/i,
  /didn'?t (do|finish|complete)/i,
  /not (done|finished)/i,
  /skipped|missed|forgot/i,
];

/**
 * Detect if the message is a special command.
 * Returns { command, response } or null.
 */
function detectSpecialCommands(text) {
  const trimmed = (text || '').trim();

  for (const [command, regex] of Object.entries(SPECIAL_COMMANDS)) {
    if (regex.test(trimmed)) {
      return { command, response: COMMAND_RESPONSES[command] };
    }
  }
  return null;
}

/**
 * Detect if the user is reporting goal completion.
 */
function detectGoalCompletion(text) {
  const lower = (text || '').toLowerCase();

  // Check for exceptions first
  for (const ex of NON_COMPLETION_EXCEPTIONS) {
    if (ex.test(lower)) return false;
  }

  for (const pattern of COMPLETION_PATTERNS) {
    if (pattern.test(lower)) return true;
  }
  return false;
}

/**
 * Build a goals list message for a user
 */
function formatGoalsList(goals, userName) {
  if (!goals || goals.length === 0) {
    return `Hey ${userName}! You don't have any active goals yet. Text me what you want to work on and I'll help you track it 🎯`;
  }
  const list = goals.map((g, i) => `${i + 1}. ${g.title}`).join('\n');
  return `Your active goals, ${userName}:\n${list}\n\nText "done" when you hit one!`;
}

/**
 * Build a summary message
 */
function formatSummary(user, goals) {
  const name = user.display_name || 'there';
  const tz = user.profile_json?.timezone || 'UTC';
  const goalCount = goals ? goals.length : 0;
  return `Hey ${name}! You have ${goalCount} active goal${goalCount !== 1 ? 's' : ''}. Text "goals" to list them, or just tell me how you're doing today 💪`;
}

const COMMAND_RESPONSES = {
  stop:    'You\'ve been unsubscribed from Besh. Text "START" anytime to come back.',
  help:    'Besh commands:\n• "goals" — see your goals\n• "summary" — quick status\n• "upgrade" — learn about Pro\n• "pause" — pause check-ins\n• "resume" — resume check-ins\n• "STOP" — unsubscribe\n\nOr just text me anything!',
  pause:   'Got it — pausing your daily check-ins. Text "resume" when you\'re ready to get back on track 💪',
  resume:  'Welcome back! 🎉 Daily check-ins are back on. What are we working on?',
  upgrade: 'Besh Pro = unlimited texts, priority support, and early access to new features. Just $9.99/month or $79.99/year. Want me to send you a signup link?',
  goals:   null, // dynamic — needs DB
  summary: null, // dynamic — needs DB
};

module.exports = {
  detectSpecialCommands,
  detectGoalCompletion,
  formatGoalsList,
  formatSummary,
  COMMAND_RESPONSES,
};
