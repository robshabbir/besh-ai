const express = require('express');
const twilio = require('twilio');
const {
  classifyInboundText,
  nextOnboardingStep,
  sanitizeSmsReply,
  normalizePhone
} = require('../services/besh-sms');

const router = express.Router();

// Temporary in-memory onboarding state (Sprint 1 placeholder)
const onboardingByPhone = new Map();

router.post('/sms/besh', async (req, res) => {
  const from = normalizePhone(req.body.From || '');
  const to = normalizePhone(req.body.To || '');
  const body = String(req.body.Body || '').trim();

  const classification = classifyInboundText({
    from,
    to,
    knownOwnerPhones: new Set(),
    businessByNumber: {}
  });

  let reply;

  if (classification.kind === 'new_user') {
    const state = onboardingByPhone.get(from) || { stage: 'ask_name', profile: {} };
    const step = nextOnboardingStep(state, body);
    onboardingByPhone.set(from, step.state);
    reply = step.response;
  } else {
    reply = 'Besh SMS route is active. More flows coming in Sprint 1.';
  }

  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(sanitizeSmsReply(reply, 160));

  res.type('text/xml').send(twiml.toString());
});

module.exports = router;
