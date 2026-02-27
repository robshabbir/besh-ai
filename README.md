# Besh - AI Receptionist Platform

**Every call, covered.** Multi-tenant AI receptionist platform powered by Twilio Voice and Claude.

## Features

- 🤖 **AI-Powered Voice** - Natural conversations using Claude Sonnet 4.5
- 📞 **24/7 Availability** - Never miss a call, even outside business hours
- 📅 **Smart Booking** - Automatically collects customer info and schedules appointments
- 🚨 **Emergency Detection** - Identifies urgent situations and escalates immediately
- 🏢 **Multi-Tenant** - One platform, unlimited businesses
- 📊 **Admin Dashboard** - Monitor calls, manage bookings, view analytics
- 🔧 **Industry Templates** - Pre-built for plumbing, law firms, medical offices
- 🔐 **Secure** - API key authentication, rate limiting, production-ready

## Quick Start

### Prerequisites

- Node.js 18+
- Twilio account with phone number
- Anthropic API key (Claude)

### Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Setup database and demo tenant
npm run setup

# Start server
npm start
```

Server runs at `http://localhost:3000`

### Configuration

Create `.env` file:

```env
# Server
PORT=3000
NODE_ENV=production
BASE_URL=https://your-domain.com

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-...

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+19297557288

# Logging
LOG_LEVEL=info
```

### Twilio Webhook Setup

1. Log in to Twilio Console
2. Go to Phone Numbers → Manage → Active Numbers
3. Click your phone number
4. Under "Voice & Fax", set:
   - **A Call Comes In**: Webhook `https://your-domain.com/api/voice` (POST)
   - **Status Callback URL**: `https://your-domain.com/api/status` (POST)
5. Save

### Expose Local Server

For development, expose your local server:

```bash
# Using ngrok
ngrok http 3000

# Or using Tailscale
tailscale serve https / http://localhost:3000
```

## Usage

### 1. Onboarding New Tenant

Visit `http://localhost:3000/onboard`

1. Choose industry template (Plumber, Law Firm, Medical)
2. Fill in business details
3. Save API key (shown once!)
4. Configure phone number in dashboard

### 2. Access Dashboard

Visit `http://localhost:3000/admin/dashboard`

- Enter your API key
- View calls and bookings
- Manage appointment status
- Configure settings

### 3. API Access

All API endpoints require authentication:

```bash
curl -H "Authorization: Bearer besh_YOUR_API_KEY" \
     https://your-domain.com/api/calls
```

Available endpoints:

- `GET /api/tenant` - Get tenant info
- `GET /api/calls` - List calls
- `GET /api/bookings` - List bookings
- `GET /api/notifications` - List notifications
- `GET /health` - Health check

## Architecture

```
├── server.js              # Main Express server
├── src/
│   ├── db/
│   │   ├── schema.sql     # SQLite schema
│   │   ├── index.js       # Database queries
│   │   └── migrate.js     # Migration runner
│   ├── services/
│   │   ├── claude.js      # Claude conversation engine
│   │   ├── twilio.js      # Twilio phone management
│   │   ├── template.js    # Template processor
│   │   ├── booking.js     # Booking logic
│   │   └── notify.js      # SMS/email notifications
│   ├── routes/
│   │   ├── voice.js       # Twilio voice webhooks
│   │   ├── admin.js       # Admin dashboard API
│   │   ├── api.js         # REST API
│   │   └── onboard.js     # Onboarding flow
│   ├── middleware/
│   │   ├── auth.js        # API key authentication
│   │   └── rateLimit.js   # Rate limiting
│   └── utils/
│       └── logger.js      # Structured logging
├── public/                # Frontend (HTML/CSS/JS)
│   ├── index.html         # Landing page
│   ├── dashboard.html     # Admin dashboard
│   └── onboard.html       # Onboarding wizard
├── templates/             # Industry templates
│   ├── plumber.json
│   ├── law-firm.json
│   └── medical-office.json
└── data/                  # SQLite database
```

## Database Schema

### Tenants
- `id`, `name`, `industry`, `phone_number`, `config_json`, `api_key`, `created_at`, `active`

### Calls
- `id`, `tenant_id`, `call_sid`, `caller_phone`, `transcript_json`, `intent`, `collected_data_json`, `duration_seconds`, `created_at`

### Bookings
- `id`, `tenant_id`, `call_id`, `customer_name`, `customer_phone`, `customer_email`, `service`, `preferred_time`, `address`, `status`, `created_at`

### Notifications
- `id`, `tenant_id`, `type`, `payload_json`, `sent_at`

## Adding Custom Templates

Create a new template file in `templates/`:

```json
{
  "template_name": "Your Industry Template",
  "industry": "your_industry",
  "business_config": {
    "name": "{{BUSINESS_NAME}}",
    "services": ["Service 1", "Service 2"]
  },
  "system_prompt": "You are an AI receptionist for {{BUSINESS_NAME}}...",
  "customization_variables": {
    "BUSINESS_NAME": "Your business name"
  }
}
```

## Deployment

### Docker

```bash
# Build image
docker build -t besh-ai .

# Run container
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  -e TWILIO_ACCOUNT_SID=AC... \
  -e TWILIO_AUTH_TOKEN=... \
  besh-ai
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure proper `BASE_URL`
- [ ] Use HTTPS (required for Twilio webhooks)
- [ ] Setup database backups (`data/calva.db`)
- [ ] Configure log aggregation
- [ ] Setup monitoring/alerts
- [ ] Enable rate limiting
- [ ] Review security headers (Helmet)

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start with nodemon (auto-reload)
- `npm run migrate` - Run database migrations
- `npm run seed` - Create demo tenant
- `npm run setup` - Migrate + seed

## Demo Tenant

After running `npm run seed`, you'll have:

- **Business:** Mike's Plumbing NYC
- **Industry:** Plumbing Services
- **Phone:** From your `.env` (TWILIO_PHONE_NUMBER)
- **API Key:** Printed in terminal (save this!)

## Troubleshooting

### Calls not being received

1. Check Twilio webhook URL is correct
2. Verify webhook is publicly accessible (use ngrok)
3. Check Twilio debugger in console
4. Verify phone number is configured in database

### Database locked errors

SQLite uses WAL mode for better concurrency. If issues persist:
- Check file permissions on `data/` directory
- Ensure only one process is writing
- Consider Redis for session storage in production

### Claude API errors

- Verify `ANTHROPIC_API_KEY` is set correctly
- Check API quota/limits
- Review logs for specific error messages

## Production Considerations

### Scalability

- Move session storage to Redis
- Use PostgreSQL for database (update `src/db/index.js`)
- Deploy multiple instances behind load balancer
- Implement webhook queue (Bull/BullMQ)

### Security

- Rotate API keys regularly
- Implement HTTPS everywhere
- Add CORS configuration
- Review Helmet CSP settings
- Setup audit logging

### Monitoring

- Setup health check monitoring
- Track call success/failure rates
- Monitor Claude API latency
- Alert on error rates

## License

MIT

## Support

For issues and questions:
- GitHub Issues: [your-repo]
- Email: support@besh.ai
- Documentation: https://docs.besh.ai

---

**Built with ❤️ using Twilio + Claude**
