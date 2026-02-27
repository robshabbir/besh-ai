/**
 * Tests for streak tracking + goal completion + STOP compliance
 */

const { detectSpecialCommands, detectGoalCompletion } = require('../src/services/besh-commands');

let passed = 0, failed = 0;
function assert(condition, msg) {
  if (condition) { passed++; console.log(`✅ ${msg}`); }
  else { failed++; console.error(`❌ ${msg}`); }
}

async function runTests() {
  console.log('🧪 Besh Commands & Completion Tests\n');

  // 1: STOP/UNSUBSCRIBE compliance
  {
    const r = detectSpecialCommands('STOP');
    assert(r.command === 'stop', 'STOP detected');

    const r2 = detectSpecialCommands('unsubscribe');
    assert(r2.command === 'stop', 'unsubscribe detected');

    const r3 = detectSpecialCommands('QUIT');
    assert(r3.command === 'stop', 'QUIT detected');
  }

  // 2: HELP command
  {
    const r = detectSpecialCommands('HELP');
    assert(r.command === 'help', 'HELP detected');
  }

  // 3: Goal completion detection
  {
    const completions = [
      'I did it!',
      'done for today',
      'completed my run',
      'finished my workout',
      'I crushed it today',
      'goal achieved!',
    ];
    completions.forEach(msg => {
      const r = detectGoalCompletion(msg);
      assert(r === true, `detects completion: "${msg}"`);
    });
  }

  // 4: Non-completions not flagged
  {
    const nonCompletions = [
      'I skipped today',
      'maybe tomorrow',
      'how am I doing?',
      'set a new goal',
    ];
    nonCompletions.forEach(msg => {
      const r = detectGoalCompletion(msg);
      assert(r === false, `does not flag: "${msg}"`);
    });
  }

  // 5: PAUSE/RESUME commands
  {
    assert(detectSpecialCommands('pause').command === 'pause', 'pause detected');
    assert(detectSpecialCommands('resume').command === 'resume', 'resume detected');
    assert(detectSpecialCommands('goals').command === 'goals', 'goals list detected');
    assert(detectSpecialCommands('summary').command === 'summary', 'summary detected');
  }

  // 6: Normal messages return null
  {
    assert(detectSpecialCommands('hey how are you') === null, 'normal message is null');
    assert(detectSpecialCommands('I want to run today') === null, 'goal message is null');
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
