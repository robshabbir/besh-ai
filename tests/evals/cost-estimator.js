function assertNonNegativeNumber(value, name) {
  if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
    throw new TypeError(`${name} must be a non-negative number`);
  }
}

function estimateSmsConversationCost({
  messages,
  avgTokensIn,
  avgTokensOut,
  modelCostInPer1M,
  modelCostOutPer1M,
}) {
  assertNonNegativeNumber(messages, 'messages');
  assertNonNegativeNumber(avgTokensIn, 'avgTokensIn');
  assertNonNegativeNumber(avgTokensOut, 'avgTokensOut');
  assertNonNegativeNumber(modelCostInPer1M, 'modelCostInPer1M');
  assertNonNegativeNumber(modelCostOutPer1M, 'modelCostOutPer1M');

  const estimatedCostPerTurn =
    ((avgTokensIn * modelCostInPer1M) + (avgTokensOut * modelCostOutPer1M)) / 1_000_000;

  const estimatedCostPerConversation = estimatedCostPerTurn * messages;

  return {
    estimatedCostPerConversation,
    estimatedCostPerTurn,
  };
}

module.exports = {
  estimateSmsConversationCost,
};
