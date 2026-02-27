/**
 * Tests for besh-ai.js — AI text conversation engine
 */

const { createBeshAI } = require('../src/services/besh-ai');

let passed = 0, failed = 0;
function assert(condition, msg) {
  if (condition) { passed++; console.log(`✅ ${msg}`); }
  else { failed++; console.error(`❌ ${msg}`); }
}

async function runTests() {
  console.log('🧪 Besh AI Text Engine Tests\n');

  // 1: Build system prompt includes user context
  {
    const ai = createBeshAI();
    const prompt = ai.buildSystemPrompt({
      userName: 'Alex',
      profile: { goal: 'run a marathon', timezone: 'America/New_York' },
      intent: 'chat'
    });
    assert(prompt.includes('Alex'), 'system prompt includes user name');
    assert(prompt.includes('run a marathon'), 'system prompt includes goal');
    assert(prompt.includes('America/New_York'), 'system prompt includes timezone');
    assert(typeof prompt === 'string', 'returns string');
    assert(prompt.length > 100, 'prompt has substance');
  }

  // 2: System prompt adapts to intent
  {
    const ai = createBeshAI();
    const reminderPrompt = ai.buildSystemPrompt({ userName: 'Jo', profile: {}, intent: 'reminder' });
    const chatPrompt = ai.buildSystemPrompt({ userName: 'Jo', profile: {}, intent: 'chat' });
    assert(reminderPrompt.includes('reminder'), 'reminder intent injects reminder context');
    assert(reminderPrompt !== chatPrompt, 'different intents produce different prompts');
  }

  // 3: SMS response sanitizer enforces length
  {
    const ai = createBeshAI();
    const short = ai.sanitizeResponse('Hey there!');
    assert(short === 'Hey there!', 'short response passes through');

    const long = ai.sanitizeResponse('A'.repeat(400));
    assert(long.length <= 320, 'long response truncated to 320');
  }

  // 4: SMS response sanitizer strips markdown
  {
    const ai = createBeshAI();
    const cleaned = ai.sanitizeResponse('**Bold** and *italic* and `code`');
    assert(!cleaned.includes('**'), 'strips bold markdown');
    assert(!cleaned.includes('*'), 'strips italic markdown');
    assert(!cleaned.includes('`'), 'strips code markdown');
  }

  // 5: Generate response with mock LLM
  {
    const mockLLM = async (systemPrompt, messages) => {
      return { text: 'Great job on your run today! Keep it up.' };
    };
    const ai = createBeshAI({ llm: mockLLM });
    const result = await ai.generateResponse({
      context: {
        userName: 'Alex',
        profile: { goal: 'run a marathon' },
        recentMessages: []
      },
      userMessage: 'I just ran 5 miles!',
      intent: 'chat'
    });
    assert(result.response.includes('Great job'), 'generates response from LLM');
    assert(result.response.length <= 320, 'response within SMS limit');
  }

  // 6: Generate response handles LLM failure gracefully
  {
    const failLLM = async () => { throw new Error('API down'); };
    const ai = createBeshAI({ llm: failLLM });
    const result = await ai.generateResponse({
      context: { userName: 'Sam', profile: {}, recentMessages: [] },
      userMessage: 'hello',
      intent: 'chat'
    });
    assert(result.response.length > 0, 'returns fallback on LLM failure');
    assert(!result.error, 'does not expose error to user (graceful)');
  }

  // 7: Conversation history formatted correctly for LLM
  {
    const capturedMessages = [];
    const captureLLM = async (systemPrompt, messages) => {
      capturedMessages.push(...messages);
      return { text: 'Got it.' };
    };
    const ai = createBeshAI({ llm: captureLLM });
    await ai.generateResponse({
      context: {
        userName: 'Pat',
        profile: {},
        recentMessages: [
          { direction: 'inbound', content: 'Hi' },
          { direction: 'outbound', content: 'Hey Pat!' }
        ]
      },
      userMessage: 'How are you?',
      intent: 'chat'
    });
    assert(capturedMessages.length === 3, 'sends history + new message to LLM');
    assert(capturedMessages[0].role === 'user', 'first history msg is user');
    assert(capturedMessages[1].role === 'assistant', 'second history msg is assistant');
    assert(capturedMessages[2].role === 'user', 'new message appended as user');
    assert(capturedMessages[2].content === 'How are you?', 'new message content correct');
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
