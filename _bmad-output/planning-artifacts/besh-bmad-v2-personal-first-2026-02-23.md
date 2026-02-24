# Besh BMAD v2 — Personal Assistant First (Tomo-parity)

## Directive Locked
- Match Tomo UX and product behavior as closely as possible.
- Personal assistant first (not business-exclusive).
- Voice deferred to advanced tier later.
- Reuse Calva components where they accelerate delivery.

## Brainstorm (What Tomo nails)
1. Zero-friction start: web CTA opens native SMS app.
2. No heavy signup before value.
3. Conversational onboarding (AI learns user context via chat).
4. Sticky loop: reminders + accountability + memory.
5. Extremely minimal web UI.

## Model (Besh product model)
### Core user jobs
- Stay accountable
- Organize schedule/tasks
- Get reminders + follow-through nudges
- Quick life/admin assistant by text

### Channels
- Primary: SMS/iMessage-style text
- Secondary later: WhatsApp + web chat
- Voice: later tier (optional)

## Architecture (parity + better)
### Runtime
- Node/Express service (existing codebase) with new SMS-first module
- Gemini Flash (fast + cost-efficient)
- Supabase Postgres for memory and state
- Twilio SMS gateway

### New core tables
- users (phone, profile, timezone)
- goals (user_id, goal, cadence, status)
- reminders (user_id, schedule, next_fire)
- conversations (user_id, message, direction, channel)
- memory_facts (user_id, key, value, confidence)
- actions (user_id, task, due_at, status)

### Message flow
1. inbound SMS webhook
2. resolve user by phone (or bootstrap if new)
3. build context package (recent msgs + facts + active goals)
4. LLM response + structured intents
5. persist intents + schedule reminders/actions
6. outbound SMS reply

### Better-than-Tomo upgrades
- Deterministic reminder scheduler + retries
- Explicit memory controls ("forget X", "show what you remember")
- Safer defaults for sensitive prompts
- Lightweight web settings dashboard (optional)

## UX parity spec
### Homepage
- Hero + one CTA only
- "It all starts with one text" framing
- Login link + terms/privacy
- Social proof counter strip

### Onboarding in 5 texts
1. Name + preferred style
2. Main goals this week
3. Routine/time constraints
4. Reminder cadence
5. First action commitment

## Delivery plan (BMAD)
### Sprint 1 (build now)
- SMS webhook + user bootstrap
- conversation persistence
- basic memory extraction
- goals + reminders schema
- onboarding state machine
- tests for route + state transitions

### Sprint 2
- proactive reminders
- command set (/summary, /plan, /focus, /forget)
- streak/accountability loop

### Sprint 3
- web shell (minimal)
- billing gates
- polish + growth loop

## Verify gate
Before merge to main:
- parity checklist against Tomo UX
- privacy/safety checklist
- end-to-end SMS onboarding demo
- load test for reminder fanout
