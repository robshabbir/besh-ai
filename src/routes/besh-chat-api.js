/**
 * Besh Web Chat API — /api/besh/chat
 * Text-first AI chat endpoint using besh-ai engine + memory
 * Handles both onboarding (new users) and AI conversations (onboarded users)
 */

const express = require('express');
const crypto = require('crypto');
const { nextOnboardingStep, sanitizeSmsReply } = require('../services/besh-sms');
const { createBeshMemory } = require('../services/besh-memory');
const { createBeshAI } = require('../services/besh-ai');
const { rateLimit } = require('../middleware/rateLimit');
const logger = require('../utils/logger');

/**
 * Core handler — testable without Express
 */
function createBeshChatHandler({ store, llm } = {}) {
  const memory = createBeshMemory({ store });
  const ai = createBeshAI({ llm });

  return async function handleChat({ message, sessionId }) {
    // Get or create session
    let sid = sessionId;
    if (!sid) {
      sid = 'web-' + crypto.randomBytes(16).toString('hex');
    }

    // Get or create user for this session
    const user = await store.getOrCreateWebSession(sid);

    // Store inbound message
    await store.appendConversation({
      userId: user.id,
      direction: 'inbound',
      content: message,
      meta: { channel: 'web', sessionId: sid }
    });

    let response;
    let onboarding = false;

    if (!user.onboarding_complete) {
      // === ONBOARDING ===
      onboarding = true;
      const step = nextOnboardingStep(
        { stage: user.onboarding_stage || 'ask_name', profile: user.profile_json || {} },
        message
      );

      await store.saveOnboardingStep({
        userId: user.id,
        state: step.state,
        done: step.done
      });

      response = step.response;

      if (step.done) {
        onboarding = false;
      }
    } else {
      // === AI CONVERSATION ===
      const ctx = await memory.buildContext(user.id);
      const intent = memory.detectIntent(message);
      const result = await ai.generateResponse({ context: ctx, userMessage: message, intent });
      response = result.response;
    }

    // Store outbound
    await store.appendConversation({
      userId: user.id,
      direction: 'outbound',
      content: response,
      meta: { channel: 'web', sessionId: sid }
    });

    return { response, sessionId: sid, onboarding };
  };
}

/**
 * Express router factory
 */
function createBeshChatRouter({ store, llm } = {}) {
  const router = express.Router();
  const handler = createBeshChatHandler({ store, llm });

  router.post('/besh/chat', rateLimit(30, 60000), async (req, res) => {
    try {
      const { message, sessionId } = req.body;

      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const result = await handler({
        message: message.trim(),
        sessionId: sessionId || null
      });

      res.json(result);
    } catch (error) {
      logger.error('Besh chat API error', { error: error.message });
      res.status(500).json({
        response: "Sorry, I hit a snag. Try sending that again?",
        error: true
      });
    }
  });

  return router;
}

module.exports = { createBeshChatHandler, createBeshChatRouter };
