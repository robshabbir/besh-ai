# AGENTS.md - Calva Enterprise MVP

## Project Context
Building self-service AI receptionist platform. Customers sign up, customize their AI, get a phone number, and go live in <5 minutes.

## Tech Stack
- **Backend:** Node.js + Express
- **Database:** SQLite (simple, works for 1-1000 customers)
- **Voice:** Twilio + Gemini Flash 2.0 + TTS
- **Frontend:** Basic HTML/CSS/JS (no framework overhead)
- **Payment:** Stripe Checkout

## Current State
- Working demo phone: (929) 755-7288
- 9 industry templates built
- Basic call handling works
- Missing: signup, dashboard, self-service features

## Code Structure
```
/Users/rifat/clawd/revenue/ai-receptionist/
├── server.js         # Main Express server
├── package.json      # Dependencies
├── templates/        # 9 industry JSON configs
├── public/          # Static assets (landing page)
└── prd.json         # Ralph user stories
```

## Working Patterns

### Voice AI (Twilio ConversationRelay)
- Use ConversationRelay WebSocket for streaming
- Gemini Flash 2.0 handles multi-turn conversations well
- TTS: Test Chirp3-HD vs ElevenLabs vs Deepgram for naturalness
- Keep system prompts concise (<500 tokens)

### Database (SQLite)
- Keep schema simple
- Tables needed:
  - users (id, email, password_hash, created_at)
  - businesses (id, user_id, name, phone, greeting, hours, faqs, personality)
  - calls (id, business_id, timestamp, duration, transcript, recording_url, status)

### Authentication
- Use bcrypt for password hashing
- JWT for session tokens
- Middleware to protect dashboard routes

## Common Gotchas
- **Twilio number provisioning can fail** - handle errors gracefully
- **Edge TTS caching** - cache responses to speed up repeated phrases
- **Context window** - Keep Gemini prompts lean or you'll hit limits mid-call
- **WebSocket keep-alive** - Ping every 15s or Cloudflare drops connection

## Quality Checks
- Test voice naturalness manually (no automated way yet)
- Test signup flow end-to-end in browser
- Verify Twilio webhooks working (use ngrok for local dev)
- Check SQLite writes (use `sqlite3 calva.db` to inspect)

## Conventions
- Environment variables in `.env` (never commit)
- Secrets in macOS Keychain when possible
- Keep functions small (<50 lines)
- Comment non-obvious logic

## Ralph Instructions
When implementing user stories:
1. Read existing code first to understand patterns
2. Keep changes minimal - don't refactor unnecessarily
3. Test in browser for UI stories (use dev-browser skill)
4. Commit with descriptive message after each passing story
5. Update this AGENTS.md with learnings as you discover them
