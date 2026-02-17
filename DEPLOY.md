# Production Deployment Guide

## 🚀 Deployment Options

### Option 1: Railway (Recommended - Easiest)

**Pros**: Auto-deploy from Git, free tier, persistent URLs, great for MVP

1. **Setup Railway Account**
   ```bash
   npm install -g railway
   railway login
   ```

2. **Initialize Project**
   ```bash
   cd /Users/rifat/clawd/revenue/ai-receptionist
   railway init
   ```

3. **Set Environment Variables**
   ```bash
   railway variables set ANTHROPIC_API_KEY="sk-ant-..."
   railway variables set TWILIO_ACCOUNT_SID="AC..."
   railway variables set TWILIO_AUTH_TOKEN="..."
   railway variables set TWILIO_PHONE_NUMBER="+19297557288"
   railway variables set PORT="3000"
   ```

4. **Deploy**
   ```bash
   railway up
   ```

5. **Get URL**
   ```bash
   railway domain
   ```

6. **Update Twilio Webhook**
   - Go to Twilio Console
   - Set webhook to: `https://your-app.railway.app/voice`

**Cost**: Free tier → $5/month after

---

### Option 2: Render

**Pros**: Free tier, easy deploys, good performance

1. **Create `render.yaml`** (already configured)
2. Go to: https://render.com
3. **New Web Service** → Connect repository
4. Set environment variables in dashboard
5. Deploy

**Cost**: Free tier (spins down after 15min idle)

---

### Option 3: Fly.io

**Pros**: Edge network, fast, free tier generous

1. **Install flyctl**
   ```bash
   brew install flyctl
   flyctl auth login
   ```

2. **Initialize**
   ```bash
   cd /Users/rifat/clawd/revenue/ai-receptionist
   flyctl launch
   ```

3. **Set Secrets**
   ```bash
   flyctl secrets set ANTHROPIC_API_KEY="sk-ant-..."
   flyctl secrets set TWILIO_ACCOUNT_SID="AC..."
   flyctl secrets set TWILIO_AUTH_TOKEN="..."
   ```

4. **Deploy**
   ```bash
   flyctl deploy
   ```

**Cost**: Free tier → ~$5/month

---

### Option 4: DigitalOcean App Platform

**Pros**: Simple, good docs, predictable pricing

1. Go to: https://cloud.digitalocean.com/apps
2. **Create App** → Import from GitHub
3. Set environment variables
4. Deploy

**Cost**: $5/month

---

### Option 5: Self-Hosted (VPS)

**For production control**

#### On Ubuntu/Debian Server:

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Clone/upload your code
cd /var/www
git clone <your-repo>
cd ai-receptionist

# Install dependencies
npm install --production

# Set environment variables
cat > .env << EOF
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+19297557288
ANTHROPIC_API_KEY=sk-ant-...
PORT=3000
EOF

# Start with PM2
pm2 start server.js --name ai-receptionist
pm2 save
pm2 startup

# Setup nginx reverse proxy
sudo apt-get install nginx
sudo nano /etc/nginx/sites-available/ai-receptionist

# Add:
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/ai-receptionist /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

**Update Twilio webhook to**: `https://your-domain.com/voice`

---

## 🔒 Security Checklist

Before production:

- [ ] **Environment variables** - Never commit `.env` to git
- [ ] **HTTPS only** - Use SSL/TLS certificates
- [ ] **Rate limiting** - Add express-rate-limit
- [ ] **Request validation** - Verify Twilio signatures
- [ ] **Error handling** - Don't expose stack traces
- [ ] **Logging** - Use proper logging service
- [ ] **Monitoring** - Set up uptime monitoring
- [ ] **Backups** - If storing data, backup database

### Add Request Validation

```javascript
// Add to server.js
const twilio = require('twilio');

// Middleware to validate Twilio requests
function validateTwilioRequest(req, res, next) {
  const twilioSignature = req.headers['x-twilio-signature'];
  const url = `https://your-domain.com${req.originalUrl}`;
  
  const valid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN,
    twilioSignature,
    url,
    req.body
  );
  
  if (!valid) {
    return res.status(403).send('Forbidden');
  }
  
  next();
}

// Apply to webhook routes
app.post('/voice', validateTwilioRequest, async (req, res) => {
  // ... existing code
});
```

### Add Rate Limiting

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/voice', limiter);
app.use('/gather', limiter);
```

---

## 📊 Monitoring & Logging

### Option 1: Betterstack (Logtail)

```bash
npm install @logtail/node
```

```javascript
const { Logtail } = require('@logtail/node');
const logger = new Logtail(process.env.LOGTAIL_TOKEN);

// Replace console.log with:
logger.info('Call received', { callSid, from });
```

### Option 2: Sentry (Error Tracking)

```bash
npm install @sentry/node
```

```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: 'production'
});
```

---

## 💾 Data Persistence

### Add Database for Bookings

**PostgreSQL with Supabase (easiest):**

```bash
npm install @supabase/supabase-js
```

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Store booking
async function saveBooking(booking) {
  const { data, error } = await supabase
    .from('bookings')
    .insert([{
      name: booking.name,
      phone: booking.phone,
      address: booking.address,
      service: booking.service,
      preferred_time: booking.preferredTime,
      created_at: new Date().toISOString()
    }]);
  
  if (error) console.error('DB error:', error);
  return data;
}
```

**Create table in Supabase:**
```sql
CREATE TABLE bookings (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  phone TEXT,
  address TEXT,
  service TEXT,
  preferred_time TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔔 Notifications

### Send Confirmation SMS

```javascript
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendConfirmationSMS(booking) {
  await twilioClient.messages.create({
    body: `Hi ${booking.name}! Your ${booking.service} appointment for ${booking.preferredTime} has been scheduled. We'll call you at ${booking.phone} to confirm. - Mike's Plumbing`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: booking.phone
  });
}
```

### n8n Webhook Integration

```javascript
// After booking complete
async function notifyN8n(booking) {
  await fetch(process.env.N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking)
  });
}
```

---

## 📈 Scaling Considerations

**When you get serious volume:**

1. **Redis for Sessions**
   ```bash
   npm install redis
   ```
   Replace in-memory sessions with Redis

2. **Load Balancer**
   - Run multiple instances
   - Use Railway/Render auto-scaling

3. **CDN**
   - Cloudflare in front for DDoS protection

4. **Dedicated Twilio Numbers**
   - One number per client/business

5. **Multi-tenant Architecture**
   - Add `business_id` to sessions
   - Different prompts per business

---

## ✅ Launch Checklist

- [ ] Code deployed to production
- [ ] Environment variables set
- [ ] HTTPS configured
- [ ] Twilio webhook updated
- [ ] Test call successful
- [ ] Error tracking enabled
- [ ] Monitoring/alerts set up
- [ ] Backup strategy in place
- [ ] Documentation updated
- [ ] Client onboarding process ready

---

## 🆘 Troubleshooting Production

**Server not responding:**
```bash
# Check if running (Railway)
railway logs

# Check if running (PM2)
pm2 status
pm2 logs ai-receptionist

# Restart
railway restart
pm2 restart ai-receptionist
```

**Database issues:**
```bash
# Check connections
# Check Supabase logs
# Verify credentials
```

**Twilio not reaching webhook:**
- Check Twilio debugger
- Verify webhook URL is HTTPS
- Check server logs for errors
- Verify SSL certificate valid

---

**Ready to go live?** Start with Railway for quickest deployment, then migrate to VPS if you need more control later.
