/**
 * Tests for reminder parsing, storage, and scheduling
 */

const { createBeshMemory } = require('../src/services/besh-memory');
const { parseReminder } = require('../src/services/besh-reminders');

let passed = 0, failed = 0;
function assert(condition, msg) {
  if (condition) { passed++; console.log(`✅ ${msg}`); }
  else { failed++; console.error(`❌ ${msg}`); }
}

async function runTests() {
  console.log('🧪 Besh Reminder Tests\n');

  // 1: Parse "remind me to X at Y" format
  {
    const r = parseReminder('remind me to drink water at 3pm', 'America/New_York');
    assert(r.text === 'drink water', 'extracts reminder text');
    assert(r.hour === 15, 'parses 3pm as hour 15');
    assert(r.minute === 0, 'default minute is 0');
    assert(r.timezone === 'America/New_York', 'preserves timezone');
  }

  // 2: Parse "remind me to X at H:MM am/pm"
  {
    const r = parseReminder('remind me to call mom at 9:30am', 'UTC');
    assert(r.text === 'call mom', 'extracts text');
    assert(r.hour === 9, 'parses 9am');
    assert(r.minute === 30, 'parses :30');
  }

  // 3: Parse "reminder to X at Y"
  {
    const r = parseReminder('reminder to stretch at 6pm', 'America/Chicago');
    assert(r.text === 'stretch', 'extracts from "reminder to"');
    assert(r.hour === 18, 'parses 6pm');
  }

  // 4: Parse "remind me to X every day at Y"
  {
    const r = parseReminder('remind me to journal every day at 8pm', 'UTC');
    assert(r.text === 'journal', 'extracts text with "every day"');
    assert(r.hour === 20, 'parses 8pm');
    assert(r.recurring === true, 'marks as recurring');
  }

  // 5: Returns null for unparseable
  {
    const r = parseReminder('what time is it?', 'UTC');
    assert(r === null, 'returns null for non-reminder');
  }

  // 6: Intent detection catches reminders
  {
    const store = { getUser: async()=>null, getConversationHistory: async()=>[], getActiveGoals: async()=>[] };
    const memory = createBeshMemory({ store });
    assert(memory.detectIntent('remind me to exercise at 5pm') === 'reminder', 'detects remind me');
    assert(memory.detectIntent('set a reminder for 3pm') === 'reminder', 'detects set a reminder');
    assert(memory.detectIntent('reminder to take meds at noon') === 'reminder', 'detects reminder to');
  }

  // 7: Compute next fire time
  {
    const r = parseReminder('remind me to stretch at 3pm', 'America/New_York');
    assert(r.nextFireAt instanceof Date, 'nextFireAt is a Date');
    assert(r.nextFireAt > new Date(), 'nextFireAt is in the future');
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
