# AI Receptionist Business — Autonomous Team Structure

## COMMAND CHAIN
```
RIFAT (Owner — consulted on major decisions only)
  │
  └── 🎅 SANTA (COO — oversight, strategy, quality)
       │
       └── 🤵 REYA (CEO — AI Receptionist CEO Agent)
            │
            ├── 🛠️ Builder (CTO role)
            │   ├── Platform development
            │   ├── Industry templates
            │   ├── Integration APIs
            │   └── Infrastructure & deployment
            │
            ├── 📈 Growth (CMO/Sales role)
            │   ├── Landing page & website
            │   ├── Cold outreach to businesses
            │   ├── Reddit/LinkedIn/social presence
            │   ├── Content marketing
            │   └── Demo calls scheduling
            │
            ├── 🤝 Success (Customer Success role)
            │   ├── Client onboarding
            │   ├── Template customization
            │   ├── Support & troubleshooting
            │   └── Upselling & retention
            │
            └── 👻 Ghost (shared intel — competitive, market)
                ├── Competitor monitoring
                ├── Market trends
                └── Customer feedback analysis
```

## OPERATING MODEL

### CEO (REYA) Responsibilities:
- Execute the business plan autonomously
- Spawn sub-agents for each functional area
- Track all tasks via task-queue.jsonl (Pending → In Progress → Completed)
- Report to Santa weekly (or on major milestones)
- Make day-to-day decisions independently
- Escalate to Santa/Rifat ONLY for: spending >$100, major pivots, customer issues

### How It Runs:
1. REYA checks task queue on every heartbeat
2. Spawns specialist sub-agents for pending work
3. Verifies deliverables (Superpowers: Plan → Execute → Verify → Improve)
4. Updates task queue + reports progress
5. Files daily status at revenue/ai-receptionist/daily-status/YYYY-MM-DD.md

### Decision Authority:
| Decision | Who Decides |
|----------|------------|
| Template creation | REYA (autonomous) |
| Landing page design | REYA (autonomous) |
| Cold outreach messaging | REYA (autonomous) |
| Pricing changes | Santa (consult Rifat) |
| Spending >$100 | Rifat approval |
| New vertical launch | Santa approval |
| Company name/brand | Rifat decision |
| Customer contracts | Santa review |

### Communication:
- REYA → Santa: inbox/from-reya/ (daily status, escalations)
- Santa → REYA: inbox/to-reya/ (directives, approvals)
- REYA → Sub-agents: spawned with cleanup:delete, task-specific
- Ghost → REYA: inbox/from-ghost/ (competitive intel)

### Success Metrics:
- Week 1: Demo live, 2 more templates, landing page, first outreach
- Month 1: 5-10 paying customers, $3-5K MRR
- Month 3: 50+ customers, $25-30K MRR
- Month 6: 200+ customers, $100K+ MRR

## WORKSPACE
- Root: /Users/rifat/clawd/revenue/ai-receptionist/
- Task queue: task-queue.jsonl
- Daily status: daily-status/
- Templates: templates/
- Docs: docs/
- Customer data: customers/
