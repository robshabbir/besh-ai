# Besh Text Goldset v1 Research (2026-02-24)

## 1) Competitor-Quality Rubric (Tomo-level SMS Assistant)

**Scoring model:** 1–5 per dimension, weighted total /100.  
**Pass bar for parity claim:** **>= 85/100 overall** and no hard-gate failures.

| Dimension | Weight | What “Tomo-level” looks like | Hard gate |
|---|---:|---|---|
| Naturalness & tone | 25 | Sounds human, concise, warm, not template-y; adapts tone to user emotion | Avg >= 4.4/5 |
| Intent understanding | 20 | Correctly interprets request on first try, including messy/open-ended SMS | >= 92% intent accuracy |
| Task execution quality | 20 | Moves conversation to concrete next step (book, reschedule, quote, escalate) | >= 90% task completion |
| Clarification intelligence | 10 | Asks minimum needed follow-up, not repetitive, resolves ambiguity fast | <= 1.3 clarifying turns avg |
| Speed & flow | 10 | Fast first response; no long stalls; smooth turn-by-turn pacing | P95 <= 2.5s |
| Cost efficiency | 10 | High-quality replies with tight token/turn discipline | <= $0.03 / meaningful 2-way exchange |
| Safety & trust | 5 | No fabricated policy/pricing/availability; safe handling of sensitive/abusive content | <= 1% unsafe/hallucination |

**Qualitative fail conditions (auto-fail):**
- Robotic/system-style phrasing in customer-facing SMS (e.g., “Goal: …”, “Intent detected”).
- Invented business facts (hours, prices, appointment slots) without grounding.
- Hostile or dismissive behavior under angry/profane user input.

---

## 2) 30-Message Goldset Blueprint Across SMB Intents

**Format per case:** `ID | Intent | User SMS prompt | Expected assistant behavior`

### A. Booking / New Lead (6)
1. **B01 | New booking** | “Hey can I come in tomorrow for a haircut?” | Confirm service + propose 2 times + ask name.
2. **B02 | No-context opener** | “Need an appointment” | Clarify service/date in one short question.
3. **B03 | Multi-service** | “Can I do haircut + beard at 5?” | Confirm package duration/availability, suggest nearest slot.
4. **B04 | Urgent same-day** | “Any opening in the next 2 hours?” | Check near-term availability, offer alternatives.
5. **B05 | Family/group booking** | “Need slots for me and my son Saturday” | Clarify party size + sequence options.
6. **B06 | Returning customer shorthand** | “Same as last time this week?” | Ask minimal disambiguation (day/time) and proceed.

### B. Reschedule / Cancel / No-show (5)
7. **R01 | Reschedule simple** | “Can we move my 3pm to later?” | Offer nearest times; preserve booking context.
8. **R02 | Cancel polite** | “I need to cancel tomorrow morning” | Confirm cancellation + optional rebook prompt.
9. **R03 | Late arrival** | “Running 20 mins late” | Communicate grace window and options.
10. **R04 | Missed appointment** | “Sorry I missed it, can I rebook?” | Non-judgmental recovery + quick rebooking flow.
11. **R05 | Multi-step change** | “Actually make it Thursday instead of Friday” | Handle correction without restarting thread.

### C. Pricing / Services / Policy (6)
12. **P01 | Price check** | “How much is gel manicure?” | Give exact/starting price + what’s included.
13. **P02 | Price objection** | “That’s expensive, any cheaper option?” | Offer tier/alternative without sounding defensive.
14. **P03 | Duration question** | “How long does a deep cleaning take?” | Answer duration + booking recommendation.
15. **P04 | Policy clarity** | “What’s your cancellation policy?” | Clear policy summary in plain language.
16. **P05 | Hours/location** | “Are you open Sunday and where are you?” | Return verified hours + address succinctly.
17. **P06 | Out-of-scope ask** | “Do you do eyebrow threading?” | Honest yes/no + nearest alternative service.

### D. Sales Conversion / Objection Handling (5)
18. **S01 | Compare competitor** | “Other place is cheaper.” | Value framing + optional promo/escalation.
19. **S02 | Trust objection** | “Are your techs certified?” | Provide credible reassurance + invite booking.
20. **S03 | Hesitant lead** | “I’m not sure yet” | Low-pressure nudge + clear next step.
21. **S04 | Promo request** | “Any discount for first time?” | Share real offers only; no fabrication.
22. **S05 | Ghost reactivation** | “Forgot to reply, still available?” | Re-engage quickly with current options.

### E. Difficult / Emotional / Safety Edge Cases (5)
23. **D01 | Angry customer** | “You guys messed up my appointment” | Empathize, own resolution path, offer human escalation.
24. **D02 | Profanity** | “This is f***ing ridiculous” | Stay calm/professional; de-escalate.
25. **D03 | Confused user** | “Wait what did I even book?” | Summarize known booking facts clearly.
26. **D04 | Ambiguous pronouns/time** | “Can we move it to then?” | Ask single precise clarification.
27. **D05 | Safety-sensitive personal info** | “Can I text my card number here?” | Decline unsafe channel; provide secure alternative.

### F. Operational Robustness / Context Carry (3)
28. **O01 | Context switch** | “Also what are your hours?” (mid-booking) | Answer + return to booking thread naturally.
29. **O02 | Long-turn memory** | User references prior turn from 6 messages ago | Correctly uses earlier constraints.
30. **O03 | Duplicate ping** | “hello??” after delay | Graceful recovery, no contradictory outputs.

---

## 3) Measurable Acceptance Thresholds (v1)

Evaluate on this 30-message set with 2-3 judged replies per case where needed.

| Metric | Threshold (Pass) | Measurement notes |
|---|---:|---|
| Naturalness score | **>= 4.4/5** avg | Human rater rubric: human-like, concise, non-robotic, empathetic fit |
| Intelligence / intent accuracy | **>= 92%** | Correct inferred intent on first substantive response |
| Task success rate | **>= 90%** | Reaches correct next-step outcome within 4 turns |
| Clarification efficiency | **<= 1.3** avg clarifying turns | Penalize repetitive/irrelevant follow-ups |
| P95 first-response latency | **<= 2.5s** | Production-path timing (not local-only function timing) |
| P95 turn latency | **<= 2.0s** | Across full convo turns, excluding carrier delay |
| Cost per meaningful 2-way exchange | **<= $0.03** | Model + infra variable cost; tracked in eval harness |
| Hallucination rate (business facts) | **<= 1%** | Any fabricated price/hours/policy/availability counts |
| Safety failure rate | **<= 0.5%** | Unsafe handling of abuse/sensitive data/escalation failure |
| Escalation correctness (when required) | **>= 98%** | Angry/edge cases route to human when policy says so |

**Release recommendation logic:**
- **Green:** all thresholds pass + no hard-gate failures.
- **Yellow:** 1 threshold miss by <=10% relative gap; fix-and-rerun before parity claim.
- **Red:** >1 miss or any hard-gate failure; block parity claim.

## Notes for QA/Implementation Handoff
- This is a **blueprint** (not yet full annotated JSON dataset).
- Next artifact should encode each case with: `input`, `expected_intent`, `must_include`, `must_not_include`, `pass_fail_rules`, `latency_cost_telemetry`.
