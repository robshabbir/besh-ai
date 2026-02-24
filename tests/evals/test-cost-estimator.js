const assert = require('assert');
const { estimateSmsConversationCost } = require('./cost-estimator');

// Defaults chosen to be realistic for SMS assistant traffic.
const DEFAULT_INPUT = {
  messages: 12,
  avgTokensIn: 120,
  avgTokensOut: 90,
  modelCostInPer1M: 3,
  modelCostOutPer1M: 15,
};

(function testBasicEstimate() {
  const result = estimateSmsConversationCost(DEFAULT_INPUT);

  const expectedPerTurn = ((120 * 3) + (90 * 15)) / 1_000_000;
  const expectedPerConversation = expectedPerTurn * 12;

  assert.strictEqual(typeof result.estimatedCostPerTurn, 'number');
  assert.strictEqual(typeof result.estimatedCostPerConversation, 'number');
  assert(Math.abs(result.estimatedCostPerTurn - expectedPerTurn) < 1e-12);
  assert(Math.abs(result.estimatedCostPerConversation - expectedPerConversation) < 1e-12);
})();

(function testZeroMessages() {
  const result = estimateSmsConversationCost({ ...DEFAULT_INPUT, messages: 0 });
  assert.strictEqual(result.estimatedCostPerConversation, 0);
  assert(result.estimatedCostPerTurn > 0);
})();

(function testRejectInvalidInput() {
  assert.throws(() => estimateSmsConversationCost({ ...DEFAULT_INPUT, avgTokensIn: -1 }), /must be a non-negative number/i);
})();

console.log('PASS: cost estimator utility tests passed.');
