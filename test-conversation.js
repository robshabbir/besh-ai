#!/usr/bin/env node
/**
 * Simulated conversation test via WebSocket
 * Tests: name extraction, no duplicate questions, pricing answers, context
 */
const WebSocket = require('ws');

const WS_URL = 'ws://localhost:3100/ws';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runTest() {
  console.log('🧪 Starting conversation quality test...\n');
  
  const ws = new WebSocket(WS_URL);
  const responses = [];
  let currentResolve = null;
  
  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.type === 'text') {
      responses.push(msg.token);
      console.log(`  🤖 AI: ${msg.token}`);
      if (msg.last && currentResolve) {
        currentResolve();
        currentResolve = null;
      }
    }
  });

  function waitForResponse(timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      currentResolve = resolve;
      // Also resolve after timeout or when we've gotten enough text
      const timer = setTimeout(() => {
        currentResolve = null;
        resolve();
      }, timeoutMs);
    });
  }

  function sendPrompt(text) {
    console.log(`  👤 User: ${text}`);
    ws.send(JSON.stringify({ type: 'prompt', voicePrompt: text }));
  }

  await new Promise((resolve) => ws.on('open', resolve));
  console.log('✅ Connected\n');

  // Setup
  ws.send(JSON.stringify({ 
    type: 'setup', 
    callSid: 'TEST-' + Date.now(),
    from: '+19175551234',
    to: '+19297557288'  // business number
  }));
  await sleep(1000);

  // Turn 1: Emergency call
  sendPrompt("Hi, I have a pipe that burst in my basement and water is everywhere");
  await waitForResponse(12000);
  await sleep(500);
  console.log();

  // Turn 2: Give name
  sendPrompt("My name is John Smith");
  await waitForResponse(12000);
  await sleep(500);
  
  // CHECK: AI should NOT ask for name again
  const turn2Responses = responses.slice(-3).join(' ').toLowerCase();
  const askedNameAgain = /your name|who am i speaking|what's your name|name is/i.test(turn2Responses);
  console.log(`  ${askedNameAgain ? '❌ FAIL' : '✅ PASS'}: AI ${askedNameAgain ? 'asked for name again!' : 'did NOT ask for name again'}`);
  console.log();

  // Turn 3: Ask about pricing
  sendPrompt("How much is an emergency visit going to cost me?");
  await waitForResponse(12000);
  await sleep(500);
  
  // CHECK: Response should include dollar amounts or pricing info
  const turn3Responses = responses.slice(-3).join(' ');
  const hasPricing = /\$|\bdollar|\bprice|\bcost|\brange|\bfee|\baround|\btypically|\busually|\bquote/i.test(turn3Responses);
  console.log(`  ${hasPricing ? '✅ PASS' : '❌ FAIL'}: AI ${hasPricing ? 'gave pricing info' : 'did NOT give pricing info'}`);
  console.log();

  // Turn 4: Give phone number
  sendPrompt("My number is 917-555-1234");
  await waitForResponse(12000);
  await sleep(500);
  
  // CHECK: AI should NOT ask for name
  const turn4Responses = responses.slice(-3).join(' ').toLowerCase();
  const askedNameAgain2 = /your name|who am i speaking|what's your name/i.test(turn4Responses);
  console.log(`  ${askedNameAgain2 ? '❌ FAIL' : '✅ PASS'}: AI ${askedNameAgain2 ? 'asked for name AGAIN after phone!' : 'did NOT ask for name after phone'}`);
  console.log();

  ws.close();
  
  console.log('\n🏁 Test complete');
  process.exit(0);
}

runTest().catch(e => { console.error('Test error:', e); process.exit(1); });
