# Stripe Integration Plan for Besh

## Overview
Enable paid subscriptions via Stripe to monetize Besh.

## Pricing Tiers
| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | 20 msgs/day, 600/mo |
| Pro | $9.99/mo or $79.99/yr | Unlimited texts, priority support |
| Premium | $19.99/mo | Pro + voice calls, early features |

## Implementation Steps

### 1. Stripe Setup (Prerequisites)
- [ ] Get Stripe API keys (test + live)
- [ ] Create Products in Stripe Dashboard
- [ ] Configure Webhook endpoint

### 2. Database Schema
- [ ] Add `stripe_customer_id` to `besh_users`
- [ ] Add `subscription_tier` (already exists)
- [ ] Add `subscription_status` (already exists)
- [ ] Add `subscription_expires_at` (already exists)

### 3. Backend Implementation
- [ ] Create `/api/besh/create-checkout-session` endpoint
- [ ] Handle Stripe webhook at `/api/besh/webhook`
- [ ] Update user subscription status on payment success
- [ ] Handle `customer.subscription.deleted` (cancellation)
- [ ] Handle `invoice.payment_failed` (past due)

### 4. SMS Commands
- [ ] "UPGRADE" → Send Stripe checkout link
- [ ] "MANAGE" → Send customer portal link
- [ ] "CANCEL" → Handle cancellation

### 5. Testing
- [ ] Test checkout flow (test mode)
- [ ] Test webhook handling
- [ ] Test subscription status updates

## API Keys Needed
```
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Files to Modify
- `src/routes/sms-besh.js` (upgrade command)
- `src/routes/stripe.js` (new - checkout & webhook)
- `src/services/besh-sms-store.js` (update subscription)
- `.env` (add keys)

## Timeline
- Setup: 30 min
- Backend: 1 hour
- Testing: 30 min
- **Total: ~2 hours**
