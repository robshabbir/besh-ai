const { renderTemplate, getCheckinsDue, getHourInTimezone, CHECKIN_TEMPLATES } = require('../src/services/besh-checkins');

let passed = 0, failed = 0;
function assert(condition, msg) {
  if (condition) { passed++; console.log(`✅ ${msg}`); }
  else { failed++; console.error(`❌ ${msg}`); }
}

async function runTests() {
  console.log('🧪 Besh Proactive Check-in Tests\n');

  // 1: Template rendering
  {
    const msg = renderTemplate('morning', { name: 'Alex', goal: 'run 3 miles' });
    assert(msg.includes('Alex'), 'morning template includes name');
    assert(msg.includes('run 3 miles'), 'morning template includes goal');
  }

  // 2: Evening template
  {
    const msg = renderTemplate('evening', { name: 'Sam', goal: 'meditate' });
    assert(msg.includes('Sam'), 'evening template includes name');
    assert(msg.includes('meditate'), 'evening template includes goal');
  }

  // 3: Streak template
  {
    const msg = renderTemplate('streak', { name: 'Jo', goal: 'read', count: '5' });
    assert(msg.includes('5'), 'streak includes count');
    assert(msg.includes('Jo'), 'streak includes name');
  }

  // 4: All template types exist
  {
    assert(CHECKIN_TEMPLATES.morning.length >= 2, 'morning has multiple templates');
    assert(CHECKIN_TEMPLATES.evening.length >= 2, 'evening has multiple templates');
    assert(CHECKIN_TEMPLATES.streak.length >= 1, 'streak templates exist');
    assert(CHECKIN_TEMPLATES.missed.length >= 1, 'missed templates exist');
  }

  // 5: getHourInTimezone works
  {
    const now = new Date('2026-02-27T13:00:00Z'); // 1pm UTC = 8am EST
    const hour = getHourInTimezone(now, 'America/New_York');
    assert(hour === 8, 'UTC 13:00 = EST 8:00');
  }

  // 6: getCheckinsDue — morning check-in for EST user at 8am EST
  {
    const morningUTC = new Date('2026-02-27T13:30:00Z'); // 8:30am EST
    const checkinsSent = [];

    const store = {
      async getOnboardedUsersWithGoals() {
        return [{
          id: 'u1', phone: '+15551234567', display_name: 'Alex',
          profile_json: { timezone: 'America/New_York', goal: 'run' },
          goals: [{ title: 'Run 3x this week' }]
        }];
      },
      async hasCheckinToday(userId, type) { return false; }
    };

    const due = await getCheckinsDue({ store, now: morningUTC });
    assert(due.length === 1, 'one morning check-in due');
    assert(due[0].type === 'morning', 'type is morning');
    assert(due[0].message.includes('Alex'), 'message has name');
    assert(due[0].phone === '+15551234567', 'correct phone');
  }

  // 7: No duplicate check-ins
  {
    const store = {
      async getOnboardedUsersWithGoals() {
        return [{
          id: 'u1', phone: '+15551234567', display_name: 'Alex',
          profile_json: { timezone: 'America/New_York' },
          goals: [{ title: 'Run' }]
        }];
      },
      async hasCheckinToday() { return true; } // already sent
    };

    const due = await getCheckinsDue({ store, now: new Date('2026-02-27T13:30:00Z') });
    assert(due.length === 0, 'no duplicate check-ins');
  }

  // 8: No check-in outside window
  {
    const store = {
      async getOnboardedUsersWithGoals() {
        return [{
          id: 'u1', phone: '+15551234567', display_name: 'Alex',
          profile_json: { timezone: 'America/New_York' },
          goals: [{ title: 'Run' }]
        }];
      },
      async hasCheckinToday() { return false; }
    };

    // 3pm EST = 20:00 UTC — not in morning or evening window
    const due = await getCheckinsDue({ store, now: new Date('2026-02-27T20:00:00Z') });
    assert(due.length === 0, 'no check-in at 3pm');
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
