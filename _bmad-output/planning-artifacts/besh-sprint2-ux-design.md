# Besh Sprint 2 - UX Design Specification

## Overview
This document outlines the UX design for the Besh AI text-first assistant. The goal is to create a simple, intuitive, and engaging experience for users primarily interacting via SMS, with a clear web presence for onboarding and management.

## 1. Onboarding Flow (SMS)

**Goal:** Guide new users through initial setup and profile creation to enable personalized AI interactions.

**Stages:**
1.  **Welcome & Ask Name:**
    *   **User sees:** "hey! 👋 i'm besh — think of me as your personal AI that lives in your texts. what should i call you?"
    *   **User replies:** Their name (e.g., "Alex", "My name is Sarah")
    *   **System stores:** `profile.name`

2.  **Ask Goal:**
    *   **User sees:** "Alex! love that. so what's something you're working on right now? a goal, a habit, anything — i'll help you stay on it 💪"
    *   **User replies:** Their primary goal (e.g., "Learn to code", "Run a marathon", "Read more books")
    *   **System stores:** `profile.goal`, auto-detects `profile.timezone` from phone number if possible.

3.  **Ask Birth Year:**
    *   **User sees:** "locked in 🔥 i got you on "'<user's goal>'". one quick question — how old are you? (just your birth year, e.g., 1990)"
    *   **User replies:** Their birth year (e.g., "1995", "1982")
    *   **System validates:** 4-digit year, within reasonable range (e.g., 1924-2012 for age 12-100)
    *   **System stores:** `profile.birth_year`, `profile.age_group` (derived from birth year: teen, young_adult, adult, mature_adult)
    *   **Error handling:** "hmm, i didn't catch that. can you tell me your birth year? (like 1990)"

4.  **Ask Communication Style:**
    *   **User sees:** "cool, you're a <age_group>! last thing — how do you want me to talk? casual (like this! 😎), formal (more proper 👔), or motivating (LET'S GO! 🔥)?"
    *   **User replies:** Their preferred style (e.g., "Casual", "Formal", "Motivate me")
    *   **System stores:** `profile.comm_style` (casual, formal, motivating, normal)

5.  **Completion:**
    *   **User sees:** "all set, <user's name>! 🎉 i got your style: <comm_style>. text me anytime about your goal or anything else. let's do this!"
    *   **System stores:** `onboarding_complete = true`

## 2. Chat UI (SMS)

**Goal:** Provide a seamless and intuitive conversational experience through text messages.

**Key Principles:**
*   **Simplicity:** No complex menus or commands, rely on natural language.
*   **Context-aware:** Responses leverage user's profile, goals, and conversation history.
*   **Personality:** Maintain Besh's warm, friendly, casual tone (customizable by `comm_style`).
*   **Conciseness:** Keep messages short and to the point (under 160 characters).

**Interactions:**
*   **Goal Setting:** User expresses a new goal (e.g., "Set a goal to meditate daily"). Besh confirms and tracks.
*   **Reminders:** User requests a reminder (e.g., "Remind me to drink water at 3pm"). Besh confirms and schedules.
*   **Progress Check-ins:** User asks "How am I doing?" or Besh proactively checks in. Besh references goals and offers encouragement.
*   **Free-form Chat:** User asks questions or shares thoughts. Besh responds conversationally.
*   **Special Commands (Hidden/Discoverable):**
    *   `STOP`: Unsubscribe (TCPA compliant)
    *   `START`: Resubscribe
    *   `GOALS`: List active goals
    *   `SUMMARY`: Get a summary of progress
    *   `UPGRADE`: Information on upgrading to Pro tier
    *   `MANAGE`: Link to subscription management portal (if Pro)

**Error Handling:**
*   **Rate Limit Hit (Free Tier):** "You've hit your daily limit (20 messages). Upgrade to Pro for unlimited texts — reply UPGRADE to learn more, or text me again tomorrow! 🚀"
*   **AI Snag:** "Hey, I hit a snag processing that. Mind sending it again?"
*   **Injection Blocked:** "Hey, let's keep things on track! What can I help you with today?"

## 3. Web Presence (Landing Page & Settings)

**Goal:** Support the SMS experience with a clear web-based entry point and user account management.

**Landing Page (`besh.ai` or `/text`):**
*   **Headline:** Clear value proposition (e.g., "Your Personal AI, Right in Your Texts.")
*   **Call to Action:** "Text Besh Now" button/link (sms: URI or direct phone number).
*   **Testimonials/Benefits:** Showcase key features and user success stories.
*   **Pricing Tiers:** Clearly outline Free and Pro tiers.
*   **FAQ:** Address common questions about privacy, usage, and features.

**User Settings/Dashboard (Web - Requires Login/Auth):**
*   **Goals Management:** View, edit, mark complete, or delete active/completed goals.
*   **Reminder Management:** View, edit, or delete scheduled reminders.
*   **Profile:** Edit name, preferred communication style, timezone, and (potentially) age group.
*   **Subscription:** View current plan, upgrade/downgrade options, billing history.
*   **Conversation History:** Read-only view of past interactions with Besh.
*   **Connect other apps:** (Future) Integrations with calendar, to-do apps.

## Appendix: Future Considerations
*   **Voice Integration:** If voice becomes a premium feature, the web UI would include microphone input/output and transcription display.
*   **Rich Media (MMS):** Potential to send/receive images for richer interactions (e.g., progress photos).
*   **Integrations:** Google Calendar, Apple Reminders, Todoist for advanced goal/reminder sync.
