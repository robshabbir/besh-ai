#!/usr/bin/env node
/**
 * Unit test for extractCollectedInfo + buildFullSystemPrompt logic
 * No server needed - tests the core logic directly
 */
const { extractCollectedInfo, getMissingInfo } = require('./src/services/claude');

let pass = 0, fail = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    pass++;
  } catch (e) {
    console.log(`  ❌ ${name}: ${e.message}`);
    fail++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

console.log('🧪 Testing extractCollectedInfo()...\n');

test('"My name is John Smith" → extracts name', () => {
  const r = extractCollectedInfo([{role:'user', content:'My name is John Smith'}]);
  assert(r.name === 'John Smith', `got: ${r.name}`);
});

test('"I\'m John Smith" → extracts name', () => {
  const r = extractCollectedInfo([{role:'user', content:"I'm John Smith"}]);
  assert(r.name === 'John Smith', `got: ${r.name}`);
});

test('"This is John Smith" → extracts name', () => {
  const r = extractCollectedInfo([{role:'user', content:'This is John Smith calling about a leak'}]);
  assert(r.name === 'John Smith', `got: ${r.name}`);
});

test('Phone: 917-555-1234', () => {
  const r = extractCollectedInfo([{role:'user', content:'My number is 917-555-1234'}]);
  assert(r.phone === '917-555-1234', `got: ${r.phone}`);
});

test('Phone: (917) 555-1234', () => {
  const r = extractCollectedInfo([{role:'user', content:'Call me at (917) 555-1234'}]);
  assert(r.phone === '(917) 555-1234', `got: ${r.phone}`);
});

test('Phone: 9175551234', () => {
  const r = extractCollectedInfo([{role:'user', content:'9175551234'}]);
  assert(r.phone === '9175551234', `got: ${r.phone}`);
});

test('"I\'m calling about a leak" → does NOT extract name', () => {
  const r = extractCollectedInfo([{role:'user', content:"I'm calling about a leak"}]);
  assert(!r.name, `falsely extracted: ${r.name}`);
});

test('"I\'m having a problem" → does NOT extract name', () => {
  const r = extractCollectedInfo([{role:'user', content:"I'm having a problem with my pipes"}]);
  assert(!r.name, `falsely extracted: ${r.name}`);
});

test('Full conversation extracts all info', () => {
  const r = extractCollectedInfo([
    {role:'user', content:'Hi, I have a pipe that burst in my basement and water is everywhere'},
    {role:'assistant', content:'Oh no, that sounds awful! Can I get your name?'},
    {role:'user', content:'My name is John Smith'},
    {role:'assistant', content:'Okay John, what\'s the best number to reach you?'},
    {role:'user', content:'My number is 917-555-1234'},
  ]);
  assert(r.name === 'John Smith', `name: ${r.name}`);
  assert(r.phone === '917-555-1234', `phone: ${r.phone}`);
  assert(r.service === 'pipe', `service: ${r.service}`);
});

test('getMissingInfo works after name collected', () => {
  const collected = { name: 'John Smith', service: 'pipe' };
  const missing = getMissingInfo(collected);
  assert(!missing.includes('name'), 'name should not be missing');
  assert(missing.includes('phone'), 'phone should be missing');
  assert(!missing.includes('service/issue'), 'service should not be missing');
});

test('getMissingInfo returns empty when all collected', () => {
  const collected = { name: 'John', phone: '555-1234', service: 'leak' };
  const missing = getMissingInfo(collected);
  assert(missing.length === 0, `still missing: ${missing}`);
});

console.log(`\n🏁 Results: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
