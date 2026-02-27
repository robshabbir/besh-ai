const { createBeshScheduler } = require('../src/services/besh-scheduler');

let passed = 0, failed = 0;
function assert(condition, msg) {
  if (condition) { passed++; console.log(`✅ ${msg}`); }
  else { failed++; console.error(`❌ ${msg}`); }
}

async function runTests() {
  console.log('🧪 Besh Scheduler Tests\n');

  // 1: Fires due reminders
  {
    const sentMessages = [];
    const advanced = [];
    const conversations = [];

    const store = {
      async getDueReminders() {
        return [{
          id: 'rem-1', user_id: 'u1', text: 'drink water',
          schedule_json: { hour: 15, minute: 0, recurring: false },
          besh_users: { phone: '+15551234567', display_name: 'Alex', timezone: 'UTC' }
        }];
      },
      async advanceReminder(id, next) { advanced.push({ id, next }); },
      async appendConversation(c) { conversations.push(c); }
    };

    const twilioClient = {
      messages: {
        async create(msg) { sentMessages.push(msg); return { sid: 'SM_test' }; }
      }
    };

    const scheduler = createBeshScheduler({ store, twilioClient, fromNumber: '+18001234567' });
    await scheduler.tick();

    assert(sentMessages.length === 1, 'sent 1 SMS');
    assert(sentMessages[0].to === '+15551234567', 'sent to correct number');
    assert(sentMessages[0].body.includes('drink water'), 'message includes reminder text');
    assert(sentMessages[0].body.includes('Alex'), 'message includes user name');
    assert(advanced.length === 1, 'advanced 1 reminder');
    assert(advanced[0].next === null, 'one-shot deactivated (next=null)');
    assert(conversations.length === 1, 'stored outbound conversation');
  }

  // 2: Recurring reminders advance to next day
  {
    const advanced = [];
    const store = {
      async getDueReminders() {
        return [{
          id: 'rem-2', user_id: 'u1', text: 'meditate',
          schedule_json: { hour: 8, minute: 0, recurring: true },
          besh_users: { phone: '+15559999999', display_name: 'Sam', timezone: 'UTC' }
        }];
      },
      async advanceReminder(id, next) { advanced.push({ id, next }); },
      async appendConversation() {}
    };

    const scheduler = createBeshScheduler({ store, twilioClient: null });
    await scheduler.tick();

    assert(advanced.length === 1, 'advanced recurring reminder');
    assert(advanced[0].next instanceof Date, 'next fire is a Date');
    assert(advanced[0].next > new Date(), 'next fire is in the future');
  }

  // 3: No due reminders = no action
  {
    const store = { async getDueReminders() { return []; } };
    const scheduler = createBeshScheduler({ store });
    await scheduler.tick(); // should not throw
    assert(true, 'no-op when no reminders due');
  }

  // 4: Handles send failure gracefully
  {
    const advanced = [];
    const store = {
      async getDueReminders() {
        return [{
          id: 'rem-3', user_id: 'u1', text: 'test',
          schedule_json: { recurring: false },
          besh_users: { phone: '+15550000000', display_name: 'Jo', timezone: 'UTC' }
        }];
      },
      async advanceReminder(id, next) { advanced.push({ id, next }); },
      async appendConversation() {}
    };

    const badTwilio = {
      messages: { async create() { throw new Error('Twilio down'); } }
    };

    const scheduler = createBeshScheduler({ store, twilioClient: badTwilio, fromNumber: '+18001234567' });
    await scheduler.tick(); // should not throw

    assert(advanced.length === 1, 'still advances even after send failure');
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
