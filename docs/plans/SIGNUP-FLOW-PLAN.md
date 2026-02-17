# Calva Self-Service Signup Flow - Technical Implementation Plan

**Version:** 1.0  
**Date:** February 16, 2026  
**Status:** Design Phase

---

## 1. Executive Summary

This plan details the implementation of a complete self-service signup flow for Calva, transforming it from a manually-onboarded platform to a fully automated SaaS product. Businesses will be able to sign up, configure their AI receptionist, get a phone number, and go live — all without manual intervention.

**Goal:** Enable any business to onboard in under 10 minutes, from landing page to live AI receptionist.

---

## 2. User Flow Overview

```
Landing Page
    ↓
[Get Started] → Step 1: Create Account
    ↓              - Email
    ↓              - Password
    ↓              - Business Name
    ↓
Step 2: Choose Industry
    ↓              - Plumber, Law, Medical, Restaurant, etc.
    ↓              - Custom option
    ↓
Step 3: Customize
    ↓              - Business hours
    ↓              - Greeting customization
    ↓              - FAQ/Knowledge base
    ↓              - Owner name
    ↓              - Service area
    ↓
Step 4: Phone Number
    ↓              - Area code preference
    ↓              - Auto-provision Twilio number
    ↓              - Display provisioned number
    ↓
Step 5: Payment
    ↓              - 3 tiers: Starter, Pro, Business
    ↓              - Stripe Checkout Session
    ↓              - 7-day trial
    ↓
Step 6: Go Live!
    ↓              - Test call button
    ↓              - Dashboard access
    ↓              - Setup guide
    ↓
    → Dashboard
```

---

## 3. Technical Stack

### Current Stack (Keep)
- **Backend:** Express.js
- **Database:** SQLite with better-sqlite3
- **Templates:** EJS
- **Payment:** Stripe
- **Telephony:** Twilio
- **Session:** None currently → **ADD express-session**

### New Dependencies Needed
```json
{
  "express-session": "^1.18.0",
  "connect-sqlite3": "^0.9.13",
  "bcrypt": "^5.1.1",
  "express-validator": "^7.0.1"
}
```

---

## 4. Authentication Strategy

### Decision: Session-based Authentication (Express Sessions)

**Why sessions over JWT?**
- Simpler to implement and maintain
- Server-side session invalidation (important for account security)
- Less token management complexity
- Sessions stored in SQLite (already our DB)
- Better for small team, ship fast

**Implementation:**
```javascript
// server.js
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);

app.use(session({
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: './data'
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));
```

**Dual Authentication:**
- **Web Dashboard:** Session cookies (after signup/login)
- **API Endpoints:** API keys (existing system, unchanged)

---

## 5. Database Schema Changes

### 5.1 New Table: `users`

Users represent individuals who can log into the dashboard. One user = one tenant (for now, can evolve to multi-user later).

```sql
-- Migration: 005_create_users_table.sql

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  tenant_id INTEGER UNIQUE NOT NULL,
  email_verified INTEGER DEFAULT 0,
  verification_token TEXT,
  reset_token TEXT,
  reset_token_expires INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  last_login INTEGER,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CHECK (email_verified IN (0, 1))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_verification_token ON users(verification_token);
CREATE INDEX idx_users_reset_token ON users(reset_token);
```

### 5.2 New Table: `subscriptions`

Separate subscriptions from tenants for cleaner billing management.

```sql
-- Migration: 006_create_subscriptions_table.sql

CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER UNIQUE NOT NULL,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'trialing',
  current_period_start INTEGER,
  current_period_end INTEGER,
  cancel_at_period_end INTEGER DEFAULT 0,
  trial_end INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CHECK (plan IN ('starter', 'pro', 'business')),
  CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  CHECK (cancel_at_period_end IN (0, 1))
);

CREATE INDEX idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

### 5.3 New Table: `onboarding_progress`

Track partial signups for analytics and recovery emails.

```sql
-- Migration: 007_create_onboarding_progress_table.sql

CREATE TABLE IF NOT EXISTS onboarding_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  email TEXT,
  business_name TEXT,
  industry TEXT,
  current_step INTEGER DEFAULT 1,
  data_json TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  completed INTEGER DEFAULT 0,
  CHECK (current_step BETWEEN 1 AND 6),
  CHECK (completed IN (0, 1))
);

CREATE INDEX idx_onboarding_session ON onboarding_progress(session_id);
CREATE INDEX idx_onboarding_email ON onboarding_progress(email);
CREATE INDEX idx_onboarding_completed ON onboarding_progress(completed);
```

### 5.4 Modified Table: `tenants`

Add signup-related fields and separate billing concerns.

```sql
-- Migration: 008_modify_tenants_for_signup.sql

-- Add new columns to tenants
ALTER TABLE tenants ADD COLUMN onboarding_completed INTEGER DEFAULT 0;
ALTER TABLE tenants ADD COLUMN signup_source TEXT DEFAULT 'web';
ALTER TABLE tenants ADD COLUMN twilio_phone_sid TEXT;

CREATE INDEX idx_tenants_onboarding ON tenants(onboarding_completed);
```

---

## 6. API Routes

### 6.1 New Route: `/signup` (Authentication & Onboarding)

**File:** `src/routes/signup.js`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/signup` | Signup page (landing redirect) | None |
| POST | `/signup/register` | Create account (Step 1) | None |
| POST | `/signup/select-industry` | Save industry choice (Step 2) | Session |
| POST | `/signup/customize` | Save customizations (Step 3) | Session |
| POST | `/signup/provision-phone` | Provision Twilio number (Step 4) | Session |
| POST | `/signup/create-checkout` | Create Stripe Checkout (Step 5) | Session |
| GET | `/signup/success` | Post-payment success handler | Session |
| POST | `/signup/complete` | Finalize onboarding | Session |

### 6.2 Modified Route: `/onboard`

Keep existing `/onboard` for backward compatibility or deprecate it. The new `/signup` flow replaces it.

**Recommendation:** Redirect `/onboard` to `/signup` with a notice.

### 6.3 New Route: `/auth`

**File:** `src/routes/auth.js`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/auth/login` | Login page | None |
| POST | `/auth/login` | Login handler | None |
| POST | `/auth/logout` | Logout handler | Session |
| GET | `/auth/verify-email` | Email verification | None |
| POST | `/auth/forgot-password` | Request password reset | None |
| POST | `/auth/reset-password` | Reset password with token | None |

### 6.4 Modified Route: `/admin`

**File:** `src/routes/admin.js`

Add session authentication middleware to all admin routes.

```javascript
// All routes require session auth
router.use(requireSession);

// Dashboard now loads tenant from session
router.get('/dashboard', (req, res) => {
  const tenant = db.getTenantById(req.session.tenantId);
  // ... render dashboard
});
```

---

## 7. Frontend Pages/Components

### 7.1 New Page: `public/signup.html`

Multi-step signup wizard with progress indicator.

**Structure:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Sign Up - Calva AI Receptionist</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <!-- Progress Bar (Steps 1-6) -->
  <div id="progress-bar"></div>
  
  <!-- Step 1: Account Creation -->
  <div id="step-1" class="signup-step active">
    <h2>Create Your Account</h2>
    <form id="register-form">
      <input type="email" name="email" required>
      <input type="password" name="password" required>
      <input type="text" name="businessName" required>
      <button type="submit">Continue →</button>
    </form>
  </div>

  <!-- Step 2: Industry Selection -->
  <div id="step-2" class="signup-step hidden">
    <h2>Choose Your Industry</h2>
    <div id="industry-grid">
      <!-- Industry cards loaded dynamically -->
    </div>
  </div>

  <!-- Step 3: Customization -->
  <div id="step-3" class="signup-step hidden">
    <h2>Customize Your AI Receptionist</h2>
    <form id="customize-form">
      <!-- Dynamic form based on template -->
    </form>
  </div>

  <!-- Step 4: Phone Number -->
  <div id="step-4" class="signup-step hidden">
    <h2>Get Your Phone Number</h2>
    <input type="text" id="area-code" placeholder="Area code (optional)">
    <button id="provision-btn">Get Phone Number</button>
    <div id="phone-result"></div>
  </div>

  <!-- Step 5: Payment -->
  <div id="step-5" class="signup-step hidden">
    <h2>Choose Your Plan</h2>
    <div id="pricing-cards">
      <!-- Pricing tiers -->
    </div>
  </div>

  <!-- Step 6: Success -->
  <div id="step-6" class="signup-step hidden">
    <h2>🎉 You're All Set!</h2>
    <div id="success-info">
      <!-- API key, phone number, next steps -->
    </div>
  </div>

  <script src="/js/signup.js"></script>
</body>
</html>
```

### 7.2 New JavaScript: `public/js/signup.js`

Handle multi-step form, API calls, validation, Stripe integration.

**Key Functions:**
```javascript
// Step navigation
function nextStep(stepNumber);
function prevStep(stepNumber);

// API calls
async function registerAccount(data);
async function selectIndustry(industry);
async function saveCustomization(config);
async function provisionPhone(areaCode);
async function createCheckoutSession(plan);

// Stripe
async function initStripeCheckout(sessionId);

// Validation
function validateEmail(email);
function validatePassword(password);
```

### 7.3 New Page: `public/auth/login.html`

Simple login page for returning users.

```html
<form id="login-form">
  <input type="email" name="email" required>
  <input type="password" name="password" required>
  <button type="submit">Log In</button>
</form>
<a href="/auth/forgot-password">Forgot Password?</a>
<a href="/signup">Don't have an account? Sign Up</a>
```

### 7.4 Modified Page: `public/dashboard.html`

Now loads from session instead of API key. Add logout button.

```html
<!-- Add to header -->
<div id="user-menu">
  <span id="user-email">{{ user.email }}</span>
  <a href="/auth/logout">Logout</a>
</div>
```

---

## 8. Backend Services & Logic

### 8.1 New Service: `src/services/auth.js`

Handle password hashing, verification, token generation.

```javascript
const bcrypt = require('bcrypt');
const crypto = require('crypto');

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateVerificationToken,
  generateResetToken
};
```

### 8.2 Modified Service: `src/services/twilio-provisioning.js`

**Existing:** Already has `provisionPhoneNumberForTenant(tenantId, areaCode)`

**Enhancement:** Add error retry logic and better area code handling.

```javascript
// Add to existing service
async function provisionPhoneNumberForTenant(tenantId, areaCode = null, country = 'US') {
  // Current implementation is good
  // Add: Retry logic (3 attempts)
  // Add: Fallback to nearby area codes if requested code unavailable
  
  const MAX_RETRIES = 3;
  let attempt = 0;
  
  while (attempt < MAX_RETRIES) {
    try {
      // Existing provisioning logic
      return await provisionNumber();
    } catch (error) {
      attempt++;
      if (attempt >= MAX_RETRIES) throw error;
      await sleep(1000 * attempt); // Exponential backoff
    }
  }
}
```

### 8.3 Modified Service: `src/routes/billing.js`

**Update:** Integrate with new `subscriptions` table instead of storing in tenant config.

**Key Changes:**
```javascript
// In handleCheckoutCompleted()
async function handleCheckoutCompleted(session) {
  // 1. Get user from session metadata (passed during checkout)
  // 2. Create subscription record in subscriptions table
  // 3. Activate tenant
  // 4. Mark onboarding as completed
  
  const { user_id, tenant_id } = session.metadata;
  
  // Create subscription
  db.createSubscription({
    tenant_id,
    stripe_customer_id: session.customer,
    stripe_subscription_id: session.subscription,
    plan: session.metadata.plan,
    status: 'trialing',
    trial_end: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
  });
  
  // Complete onboarding
  db.updateTenant(tenant_id, { 
    onboarding_completed: 1,
    active: 1 
  });
}
```

### 8.4 New Service: `src/services/email.js`

Send transactional emails (verification, password reset, welcome).

**Options:**
- Simple: Use existing logger + manual email checking
- Better: SendGrid, AWS SES, or Resend

**For MVP:** Log email content, send manually or build simple SMTP wrapper.

```javascript
// Minimal implementation
function sendVerificationEmail(email, token) {
  const verifyUrl = `${process.env.BASE_URL}/auth/verify-email?token=${token}`;
  
  logger.info('SEND_EMAIL', {
    to: email,
    subject: 'Verify Your Calva Account',
    body: `Click to verify: ${verifyUrl}`,
    action: 'email_verification'
  });
  
  // TODO: Integrate real email service
}

function sendWelcomeEmail(email, apiKey, phoneNumber) {
  logger.info('SEND_EMAIL', {
    to: email,
    subject: 'Welcome to Calva!',
    body: `Your AI receptionist is live at ${phoneNumber}. API Key: ${apiKey}`,
    action: 'welcome'
  });
}
```

---

## 9. Database Functions (src/db/index.js)

### New Functions to Add

```javascript
// ============= USER QUERIES =============

function createUser(email, passwordHash, tenantId) {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const stmt = getDb().prepare(`
    INSERT INTO users (email, password_hash, tenant_id, verification_token)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(email, passwordHash, tenantId, verificationToken);
  return { userId: result.lastInsertRowid, verificationToken };
}

function getUserByEmail(email) {
  const stmt = getDb().prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email);
}

function getUserById(id) {
  const stmt = getDb().prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id);
}

function verifyUserEmail(token) {
  const stmt = getDb().prepare(`
    UPDATE users SET email_verified = 1, verification_token = NULL 
    WHERE verification_token = ?
  `);
  return stmt.run(token).changes > 0;
}

function updateUserLastLogin(userId) {
  const stmt = getDb().prepare(`
    UPDATE users SET last_login = strftime('%s', 'now') WHERE id = ?
  `);
  stmt.run(userId);
}

// ============= SUBSCRIPTION QUERIES =============

function createSubscription(data) {
  const stmt = getDb().prepare(`
    INSERT INTO subscriptions (
      tenant_id, stripe_customer_id, stripe_subscription_id, 
      plan, status, trial_end
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.tenant_id,
    data.stripe_customer_id,
    data.stripe_subscription_id,
    data.plan,
    data.status,
    data.trial_end
  );
  return result.lastInsertRowid;
}

function getSubscriptionByTenantId(tenantId) {
  const stmt = getDb().prepare('SELECT * FROM subscriptions WHERE tenant_id = ?');
  return stmt.get(tenantId);
}

function updateSubscriptionStatus(subscriptionId, status) {
  const stmt = getDb().prepare(`
    UPDATE subscriptions 
    SET status = ?, updated_at = strftime('%s', 'now')
    WHERE stripe_subscription_id = ?
  `);
  return stmt.run(status, subscriptionId).changes > 0;
}

// ============= ONBOARDING PROGRESS QUERIES =============

function saveOnboardingProgress(sessionId, data) {
  const stmt = getDb().prepare(`
    INSERT OR REPLACE INTO onboarding_progress 
    (session_id, email, business_name, industry, current_step, data_json, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
  `);
  stmt.run(
    sessionId,
    data.email || null,
    data.businessName || null,
    data.industry || null,
    data.currentStep,
    JSON.stringify(data)
  );
}

function getOnboardingProgress(sessionId) {
  const stmt = getDb().prepare('SELECT * FROM onboarding_progress WHERE session_id = ?');
  const progress = stmt.get(sessionId);
  if (progress && progress.data_json) {
    progress.data = JSON.parse(progress.data_json);
  }
  return progress;
}

function completeOnboarding(sessionId) {
  const stmt = getDb().prepare(`
    UPDATE onboarding_progress SET completed = 1 WHERE session_id = ?
  `);
  stmt.run(sessionId);
}
```

---

## 10. Middleware

### 10.1 New Middleware: `src/middleware/session-auth.js`

Protect dashboard routes with session authentication.

```javascript
function requireSession(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.redirect('/auth/login?redirect=' + encodeURIComponent(req.originalUrl));
  }
  
  // Load user and tenant
  const user = db.getUserById(req.session.userId);
  if (!user) {
    req.session.destroy();
    return res.redirect('/auth/login');
  }
  
  const tenant = db.getTenantById(user.tenant_id);
  if (!tenant || !tenant.active) {
    return res.status(403).json({ error: 'Account inactive' });
  }
  
  // Attach to request
  req.user = user;
  req.tenant = tenant;
  
  next();
}

function optionalSession(req, res, next) {
  if (req.session && req.session.userId) {
    const user = db.getUserById(req.session.userId);
    const tenant = user ? db.getTenantById(user.tenant_id) : null;
    
    if (user && tenant) {
      req.user = user;
      req.tenant = tenant;
    }
  }
  next();
}

module.exports = { requireSession, optionalSession };
```

### 10.2 Modified Middleware: `src/middleware/validation.js`

Add validation for signup forms.

```javascript
function validateSignupData(req, res, next) {
  const { email, password, businessName } = req.body;
  
  // Email validation
  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  
  // Password validation (min 8 chars, complexity)
  if (!password || password.length < 8) {
    return res.status(400).json({ 
      error: 'Password must be at least 8 characters' 
    });
  }
  
  // Business name validation
  if (!businessName || businessName.trim().length === 0) {
    return res.status(400).json({ error: 'Business name required' });
  }
  
  if (businessName.length > MAX_LENGTHS.businessName) {
    return res.status(400).json({ 
      error: `Business name too long (max ${MAX_LENGTHS.businessName} chars)` 
    });
  }
  
  // Sanitize
  req.body.email = email.toLowerCase().trim();
  req.body.businessName = sanitizeText(businessName);
  
  next();
}
```

---

## 11. Twilio Integration Details

### Current State
- `provisionPhoneNumberForTenant()` already exists
- Auto-provisions numbers
- Sets webhook URLs automatically

### Enhancements Needed

**1. Area Code Preference:**
```javascript
// Allow user to request specific area code
// Fallback to nearby codes if unavailable

async function provisionWithPreference(tenantId, preferredAreaCode) {
  const areaCodeOptions = [
    preferredAreaCode,
    ...getNearbyAreaCodes(preferredAreaCode)
  ];
  
  for (const areaCode of areaCodeOptions) {
    try {
      return await provisionPhoneNumberForTenant(tenantId, areaCode);
    } catch (error) {
      continue; // Try next area code
    }
  }
  
  // Fallback: any available number
  return await provisionPhoneNumberForTenant(tenantId);
}
```

**2. Phone Number Preview:**
```javascript
// Show available numbers before purchasing
GET /signup/preview-numbers?areaCode=415

// Returns:
{
  "numbers": [
    { "phoneNumber": "+14155551234", "locality": "San Francisco", "region": "CA" },
    { "phoneNumber": "+14155555678", "locality": "San Francisco", "region": "CA" }
  ]
}
```

**3. Error Handling:**
- Twilio API rate limits → Retry with backoff
- No numbers available → Show error, let user try different area code
- Provisioning fails after payment → Store in DB as "pending", manual intervention

---

## 12. Stripe Integration Details

### Payment Flow

**Step 5: Choose Plan → Create Checkout Session**

```javascript
POST /signup/create-checkout
{
  "plan": "starter",  // or "pro", "business"
  "tenantId": 123,
  "userId": 456
}

// Response:
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/pay/..."
}

// Redirect user to Stripe Checkout
```

### Pricing Configuration

```javascript
const PRICING = {
  starter: {
    priceId: process.env.STRIPE_PRICE_STARTER,
    name: 'Starter',
    amount: 4900,  // $49/mo
    features: ['100 calls/month', 'AI receptionist', 'SMS notifications', 'Basic analytics']
  },
  pro: {
    priceId: process.env.STRIPE_PRICE_PRO,
    name: 'Pro',
    amount: 9900,  // $99/mo
    features: ['500 calls/month', 'Priority support', 'Advanced analytics', 'Custom voice']
  },
  business: {
    priceId: process.env.STRIPE_PRICE_BUSINESS,
    name: 'Business',
    amount: 19900,  // $199/mo
    features: ['Unlimited calls', 'Dedicated account manager', 'Custom integrations', 'SLA']
  }
};
```

### Webhook Handling

**Already implemented in `src/routes/billing.js`:**
- `checkout.session.completed` → Create tenant + subscription
- `customer.subscription.updated` → Update status
- `customer.subscription.deleted` → Deactivate tenant
- `invoice.payment_failed` → Send reminder

**Modifications Needed:**
```javascript
// Update handleCheckoutCompleted to:
// 1. Look up user by metadata.userId
// 2. Create subscription in subscriptions table (not tenant config)
// 3. Mark tenant onboarding_completed = 1
// 4. Send welcome email with API key

async function handleCheckoutCompleted(session) {
  const { userId, tenantId, plan } = session.metadata;
  
  // Create subscription record
  db.createSubscription({
    tenant_id: tenantId,
    stripe_customer_id: session.customer,
    stripe_subscription_id: session.subscription,
    plan: plan,
    status: 'trialing',
    trial_end: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
  });
  
  // Activate tenant
  db.updateTenant(tenantId, { 
    onboarding_completed: 1,
    active: 1 
  });
  
  // Send welcome email
  const user = db.getUserById(userId);
  const tenant = db.getTenantById(tenantId);
  sendWelcomeEmail(user.email, tenant.api_key, tenant.phone_number);
}
```

### Trial Period
- **7-day free trial** (configured in Stripe Checkout)
- No charge during trial
- Auto-converts to paid after 7 days
- User can cancel anytime

---

## 13. Template System Integration

### Current State
- Industry templates exist in `templates/` directory
- Templates have customization variables
- `mergeTemplateWithConfig()` merges variables

### Integration with Signup Flow

**Step 2: Industry Selection**
```javascript
// Load available templates
GET /signup/templates

// Response:
{
  "templates": [
    {
      "id": "plumber",
      "name": "Plumbing",
      "icon": "🔧",
      "description": "Emergency plumbing, drain cleaning, water heaters"
    },
    {
      "id": "law-firm",
      "name": "Law Firm",
      "icon": "⚖️",
      "description": "Legal consultations, case intake, appointments"
    },
    // ... more industries
    {
      "id": "custom",
      "name": "Custom",
      "icon": "✨",
      "description": "Build your own AI receptionist from scratch"
    }
  ]
}
```

**Step 3: Customization**
```javascript
// Load customization form for selected template
GET /signup/templates/plumber/variables

// Response:
{
  "template": "plumber",
  "variables": {
    "BUSINESS_NAME": { "label": "Business Name", "type": "text", "required": true },
    "OWNER_NAME": { "label": "Owner/Technician Name", "type": "text", "required": true },
    "BUSINESS_HOURS": { "label": "Business Hours", "type": "hours", "required": true },
    "SERVICE_AREA": { "label": "Service Area", "type": "text", "required": true },
    "EMERGENCY_PHONE": { "label": "Emergency Phone", "type": "phone", "required": false }
  }
}

// User fills out form, submit:
POST /signup/customize
{
  "template": "plumber",
  "variables": {
    "BUSINESS_NAME": "Bob's Plumbing",
    "OWNER_NAME": "Bob",
    "BUSINESS_HOURS": "Mon-Fri 8am-6pm",
    "SERVICE_AREA": "San Francisco Bay Area",
    "EMERGENCY_PHONE": "+14155551234"
  }
}
```

**Generate System Prompt:**
```javascript
// In backend (existing function, use as-is)
const processedConfig = mergeTemplateWithConfig(templateName, variables);

// processedConfig.systemPrompt now has all {{VARIABLES}} replaced
// Save to tenant config
```

---

## 14. File Structure for New Code

```
ai-receptionist/
├── src/
│   ├── db/
│   │   ├── migrations/
│   │   │   ├── 005_create_users_table.sql
│   │   │   ├── 006_create_subscriptions_table.sql
│   │   │   ├── 007_create_onboarding_progress_table.sql
│   │   │   └── 008_modify_tenants_for_signup.sql
│   │   └── index.js (add new query functions)
│   ├── routes/
│   │   ├── signup.js (NEW - main signup flow)
│   │   ├── auth.js (NEW - login, logout, password reset)
│   │   ├── admin.js (MODIFY - add session auth)
│   │   └── billing.js (MODIFY - integrate subscriptions table)
│   ├── services/
│   │   ├── auth.js (NEW - password hashing, tokens)
│   │   ├── email.js (NEW - transactional emails)
│   │   └── twilio-provisioning.js (MODIFY - retry logic)
│   ├── middleware/
│   │   ├── session-auth.js (NEW - session middleware)
│   │   └── validation.js (MODIFY - add signup validation)
│   └── utils/
│       └── logger.js (existing)
├── public/
│   ├── signup.html (NEW - multi-step signup wizard)
│   ├── auth/
│   │   ├── login.html (NEW)
│   │   ├── forgot-password.html (NEW)
│   │   └── reset-password.html (NEW)
│   ├── js/
│   │   ├── signup.js (NEW - signup flow logic)
│   │   └── auth.js (NEW - login/logout logic)
│   └── dashboard.html (MODIFY - add logout, load from session)
├── data/
│   ├── calva.db (existing)
│   └── sessions.db (NEW - session store)
├── server.js (MODIFY - add express-session)
└── package.json (MODIFY - add dependencies)
```

---

## 15. Implementation Steps & Effort Estimates

### Phase 1: Database & Authentication (2-3 days)
- [ ] Install new dependencies (`express-session`, `bcrypt`, etc.)
- [ ] Create database migrations (users, subscriptions, onboarding_progress)
- [ ] Run migrations
- [ ] Implement auth service (password hashing, tokens)
- [ ] Add session middleware to server.js
- [ ] Write database query functions
- [ ] **Effort:** 16-20 hours

### Phase 2: Backend Routes (3-4 days)
- [ ] Create `/signup` routes (register, select-industry, customize, etc.)
- [ ] Create `/auth` routes (login, logout, password reset)
- [ ] Modify `/admin` routes to use session auth
- [ ] Modify `/billing` routes to use subscriptions table
- [ ] Add validation middleware for signup
- [ ] **Effort:** 20-24 hours

### Phase 3: Frontend - Signup Flow (4-5 days)
- [ ] Create `signup.html` with 6-step wizard
- [ ] Build `signup.js` with step navigation
- [ ] Implement form validation (client-side)
- [ ] Integrate Stripe Checkout (client-side)
- [ ] Add progress indicators
- [ ] Style with Tailwind (match existing design)
- [ ] **Effort:** 24-32 hours

### Phase 4: Frontend - Auth Pages (1-2 days)
- [ ] Create `login.html`
- [ ] Create `forgot-password.html` and `reset-password.html`
- [ ] Build `auth.js` for login/logout
- [ ] Modify `dashboard.html` to load from session
- [ ] Add logout button
- [ ] **Effort:** 8-12 hours

### Phase 5: Integration & Testing (3-4 days)
- [ ] End-to-end signup flow testing
- [ ] Twilio phone provisioning testing (sandbox + production)
- [ ] Stripe checkout testing (test mode)
- [ ] Session persistence testing
- [ ] Error handling (no numbers available, payment fails, etc.)
- [ ] Edge cases (duplicate email, weak password, etc.)
- [ ] **Effort:** 20-24 hours

### Phase 6: Email & Notifications (1-2 days)
- [ ] Implement email service (or use logger for MVP)
- [ ] Send verification emails
- [ ] Send welcome emails
- [ ] Send password reset emails
- [ ] **Effort:** 8-12 hours

### Phase 7: Polish & Launch Prep (2-3 days)
- [ ] Add analytics (track signup funnel)
- [ ] Error messages & user feedback
- [ ] Loading states & spinners
- [ ] Mobile responsiveness
- [ ] Security review (session settings, HTTPS, etc.)
- [ ] Documentation (admin guide, troubleshooting)
- [ ] **Effort:** 12-16 hours

---

## 16. Total Effort Estimate

| Phase | Time Range |
|-------|------------|
| Phase 1: Database & Auth | 16-20 hours |
| Phase 2: Backend Routes | 20-24 hours |
| Phase 3: Frontend Signup | 24-32 hours |
| Phase 4: Frontend Auth | 8-12 hours |
| Phase 5: Integration & Testing | 20-24 hours |
| Phase 6: Email & Notifications | 8-12 hours |
| Phase 7: Polish & Launch | 12-16 hours |
| **TOTAL** | **108-140 hours** |

**Team of 2 developers:** ~2.5-3.5 weeks (full-time)  
**Solo developer:** ~5-7 weeks (full-time)  
**Part-time (20hr/week):** ~8-10 weeks

---

## 17. Risk Mitigation

### Risk 1: Twilio Provisioning Failures
**Mitigation:**
- Retry logic with exponential backoff (3 attempts)
- Fallback to manual provisioning if auto-fails
- Store "pending phone" state in DB
- Admin panel to manually assign numbers

### Risk 2: Stripe Payment Issues
**Mitigation:**
- Test thoroughly in Stripe test mode
- Handle all webhook events (payment_failed, etc.)
- Graceful degradation if payment fails (don't lose signup data)
- Allow completing signup later from email link

### Risk 3: Session Security
**Mitigation:**
- Use `httpOnly`, `secure`, `sameSite` cookie flags
- Session timeout (7 days max)
- Store sessions in SQLite (persists across restarts)
- Rate limit login attempts

### Risk 4: Email Deliverability
**Mitigation:**
- Start with transactional email service (SendGrid, Postmark)
- Log all emails for debugging
- Fallback: Display verification link on screen
- Allow manual email verification by admin

### Risk 5: Template System Complexity
**Mitigation:**
- Start with 3-4 core templates (plumber, law, restaurant, custom)
- Add more templates iteratively
- "Custom" option for edge cases
- Templates are JSON (easy to add/modify)

---

## 18. Success Metrics

Track these to measure signup flow effectiveness:

1. **Conversion Rate:**
   - Landing page → Step 1 (email signup)
   - Step 1 → Step 6 (completed signup)
   - Overall: Landing → Paid customer

2. **Drop-off Points:**
   - Which step has highest abandonment?
   - Time spent on each step

3. **Phone Provisioning:**
   - Success rate of auto-provisioning
   - Most requested area codes

4. **Payment:**
   - Trial → Paid conversion rate
   - Most popular plan

5. **Onboarding Time:**
   - Average time from signup to first call
   - Time to complete all 6 steps

---

## 19. Post-Launch Improvements

**Nice-to-haves for v2:**
- Email verification (enforce before going live)
- SMS verification for phone numbers
- Invite team members (multi-user accounts)
- OAuth login (Google, Microsoft)
- Preview AI receptionist (test call) before paying
- Custom voice selection
- More granular permissions
- Referral program
- In-app onboarding tour

---

## 20. Environment Variables

Add to `.env`:

```bash
# Session
SESSION_SECRET=your-long-random-string-here

# Stripe (already have these, but note plan IDs)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_STARTER=price_starter_12345
STRIPE_PRICE_PRO=price_pro_67890
STRIPE_PRICE_BUSINESS=price_business_abcde
STRIPE_WEBHOOK_SECRET=whsec_...

# Twilio (already configured)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...

# Email (optional for MVP)
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=SG...
EMAIL_FROM=hello@calva.ai

# Base URL
BASE_URL=https://calva.ai
```

---

## 21. Testing Checklist

### Manual Testing
- [ ] Signup: All 6 steps complete
- [ ] Signup: Email already exists → Error
- [ ] Signup: Weak password → Error
- [ ] Signup: Phone provisioning succeeds
- [ ] Signup: Payment succeeds → Trial starts
- [ ] Login: Correct credentials → Dashboard
- [ ] Login: Wrong password → Error
- [ ] Logout: Session cleared
- [ ] Password reset: Email sent
- [ ] Password reset: Link works
- [ ] Session: Persists across browser restart
- [ ] Session: Expires after 7 days

### Integration Testing
- [ ] Stripe webhook: `checkout.session.completed` creates subscription
- [ ] Stripe webhook: `subscription.updated` changes status
- [ ] Twilio: Phone number receives calls
- [ ] Twilio: Webhook URL configured correctly
- [ ] Dashboard: Shows correct tenant data
- [ ] API: Still works with API key auth (unchanged)

### Edge Cases
- [ ] No Twilio numbers available
- [ ] Stripe payment fails
- [ ] User abandons signup at Step 3 → Resume later?
- [ ] User signs up twice with same email
- [ ] Session expires mid-signup
- [ ] Browser back button during signup

---

## 22. Deployment Checklist

### Pre-Launch
- [ ] Run database migrations in production
- [ ] Set all environment variables
- [ ] Create Stripe products/prices in live mode
- [ ] Test Twilio provisioning with real numbers
- [ ] Configure session secret (strong random string)
- [ ] Enable HTTPS (required for secure cookies)
- [ ] Test signup flow end-to-end in production
- [ ] Set up error monitoring (Sentry, etc.)

### Launch Day
- [ ] Update landing page with "Get Started" button → `/signup`
- [ ] Monitor logs for errors
- [ ] Watch Stripe dashboard for test signups
- [ ] Check Twilio provisioning success rate
- [ ] Have manual phone provisioning ready as backup

### Post-Launch
- [ ] Collect user feedback
- [ ] Monitor drop-off rates
- [ ] Fix bugs as reported
- [ ] Add missing templates
- [ ] Improve error messages based on support tickets

---

## 23. Security Considerations

### Passwords
- Minimum 8 characters (configurable)
- Hashed with bcrypt (cost factor 10)
- Never logged or transmitted in plain text
- Password reset tokens expire after 1 hour

### Sessions
- HTTPOnly cookies (prevent XSS)
- Secure flag in production (HTTPS only)
- SameSite=lax (CSRF protection)
- Expire after 7 days of inactivity
- Stored in SQLite (not in-memory)

### API Keys
- Existing system unchanged (still valid)
- Used for API access, not dashboard
- Regenerate if compromised

### Rate Limiting
- Login: 5 attempts per 15 minutes
- Signup: 3 signups per hour per IP
- Password reset: 3 requests per hour

### Input Validation
- Sanitize all user inputs (existing `sanitizeText()` function)
- Validate email format
- Validate phone format
- Max lengths enforced

---

## 24. FAQ (Developer Reference)

**Q: Can users have multiple tenants?**  
A: Not in v1. One user = one tenant. Can add multi-tenant support later.

**Q: What if Twilio provisioning fails after payment?**  
A: Store `twilio_phone_sid` as NULL. Show error to user: "Provisioning phone number... check back in 5 minutes." Admin can manually provision.

**Q: Do we validate email addresses?**  
A: Optional for MVP. Send verification email, but allow use without verification. Can enforce later.

**Q: Can users change their plan after signup?**  
A: Yes, via Stripe Customer Portal (existing `/billing/portal` route).

**Q: What happens if a user cancels their subscription?**  
A: Tenant becomes inactive (`active = 0`). Webhook handler already does this. Phone number is released (manual for now).

**Q: Do we need a separate admin panel?**  
A: No. Existing `/admin/dashboard` becomes the user dashboard after login.

**Q: How do we handle multiple users accessing the same tenant?**  
A: Not supported in v1. Add `roles` table and permission system in v2.

---

## 25. Conclusion

This plan provides a complete roadmap for implementing Calva's self-service signup flow. Key decisions:

1. **Session-based auth** (simple, practical)
2. **Separate subscriptions table** (clean billing)
3. **Existing patterns** (Express, EJS, SQLite)
4. **Stripe Checkout** (handles payment UI)
5. **Auto Twilio provisioning** (already built, enhance)

**Next Steps:**
1. Review this plan with team
2. Set up development environment
3. Start with Phase 1 (Database & Auth)
4. Build iteratively, test frequently
5. Ship fast, iterate based on feedback

**Estimated Launch:** 3-5 weeks with 1-2 developers working full-time.

---

**Document Version:** 1.0  
**Last Updated:** February 16, 2026  
**Author:** AI Agent (Calva Planning Team)
