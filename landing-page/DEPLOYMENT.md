# Calva Landing Page - Deployment Guide

## 🚀 Quick Deploy (5 minutes)

### Option 1: Vercel (Recommended)

**Why Vercel:**
- Free tier perfect for landing pages
- Auto HTTPS + CDN
- Deploy in 30 seconds
- Great performance

**Steps:**

```bash
# 1. Install Vercel CLI (one-time)
npm i -g vercel

# 2. Navigate to landing page directory
cd /Users/rifat/clawd/revenue/ai-receptionist/landing-page/

# 3. Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (your account)
# - Link to existing project? No
# - Project name? calva-landing
# - Directory? ./
# - Override settings? No

# 4. Production deploy
vercel --prod

# 5. Add custom domain (in Vercel dashboard)
# Go to: https://vercel.com/dashboard
# Click project → Settings → Domains
# Add: calva.ai
```

**Expected output:**
```
✅ Production: https://calva-landing.vercel.app
```

---

### Option 2: Netlify

**Why Netlify:**
- Free tier with great features
- Drag-and-drop deploy
- Form handling built-in
- Auto HTTPS

**Steps:**

```bash
# Method A: Drag and Drop (easiest)
1. Go to: https://app.netlify.com/drop
2. Drag the landing-page folder
3. Done! Gets URL like: https://calva-xxxxx.netlify.app

# Method B: CLI
npm i -g netlify-cli
cd /Users/rifat/clawd/revenue/ai-receptionist/landing-page/
netlify deploy --prod --dir=.

# Method C: Git-based (continuous deployment)
1. Push to GitHub
2. Connect repo in Netlify dashboard
3. Auto-deploys on every push
```

---

### Option 3: GitHub Pages (Free)

**Why GitHub Pages:**
- Completely free
- Simple Git-based workflow
- Good for open source projects

**Steps:**

```bash
# 1. Create GitHub repo
# Go to: https://github.com/new
# Name: calva-landing-page

# 2. Initialize and push
cd /Users/rifat/clawd/revenue/ai-receptionist/landing-page/
git init
git add .
git commit -m "Initial Calva landing page"
git branch -M main
git remote add origin git@github.com:YOUR-USERNAME/calva-landing-page.git
git push -u origin main

# 3. Enable GitHub Pages
# Go to: repo Settings → Pages
# Source: main branch, / (root)
# Save

# 4. Access at:
# https://YOUR-USERNAME.github.io/calva-landing-page/
```

---

### Option 4: Traditional cPanel Hosting

**If you already have web hosting:**

**Steps:**

1. **Connect via FTP/SFTP:**
   - Host: your-host.com
   - Username: your-cpanel-username
   - Password: your-cpanel-password
   - Port: 21 (FTP) or 22 (SFTP)

2. **Upload files:**
   - Upload all files to: `/public_html/` or `/www/`
   - Maintain structure (index.html at root)

3. **Set permissions (if needed):**
   ```bash
   # Via SSH
   cd /public_html
   chmod 644 *.html *.css *.js
   chmod 755 .
   ```

4. **Access:**
   - https://yourdomain.com/

---

## 🌐 Custom Domain Setup

### After deploying to Vercel/Netlify:

**1. Get your deployment URL:**
- Vercel: `calva-landing.vercel.app`
- Netlify: `calva-xxxxx.netlify.app`

**2. Purchase domain (if not done):**
- Namecheap: ~$10/year
- Google Domains: ~$12/year
- Cloudflare: ~$10/year

**3. Update DNS records:**

**For Vercel:**
```
Type    Name    Value                       TTL
A       @       76.76.21.21                Auto
CNAME   www     cname.vercel-dns.com       Auto
```

**For Netlify:**
```
Type    Name    Value                           TTL
A       @       75.2.60.5                      Auto
CNAME   www     calva-xxxxx.netlify.app        Auto
```

**4. Add domain in hosting dashboard:**
- Vercel: Project Settings → Domains → Add
- Netlify: Site Settings → Domain Management → Add custom domain

**5. Wait for propagation (5 min - 48 hours):**
```bash
# Check DNS propagation
dig calva.ai
nslookup calva.ai
```

**6. SSL Certificate:**
- Auto-enabled by Vercel/Netlify
- Usually active within 24 hours

---

## 🔒 HTTPS & Security

### Auto HTTPS (Vercel/Netlify/GitHub Pages)
✅ Automatic
✅ Free Let's Encrypt certificate
✅ Auto-renewal
✅ Nothing to configure

### Force HTTPS (if needed)
Add to `_headers` file (Netlify) or `vercel.json` (Vercel):

**Netlify `_headers`:**
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Strict-Transport-Security: max-age=31536000; includeSubDomains
```

**Vercel `vercel.json`:**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    }
  ]
}
```

---

## 📊 Post-Deployment Checklist

### Immediate (Day 1)
- [ ] Verify site loads at production URL
- [ ] Test on mobile device
- [ ] Test all CTAs work
- [ ] Verify HTTPS is active (🔒 in browser)
- [ ] Test phone link clicks
- [ ] Test FAQ accordion
- [ ] Test mobile menu
- [ ] Check page load speed: https://pagespeed.web.dev/

### Within Week 1
- [ ] Set up Google Analytics
- [ ] Add to Google Search Console
- [ ] Submit sitemap (if created)
- [ ] Set up uptime monitoring (UptimeRobot.com - free)
- [ ] Add Facebook Pixel (if running ads)
- [ ] Test conversion tracking
- [ ] Share on social media

### Monitoring Tools (Free Tier)
- **Uptime:** https://uptimerobot.com/
- **Performance:** https://www.webpagetest.org/
- **SEO:** https://search.google.com/search-console
- **Analytics:** https://analytics.google.com/

---

## 🔄 Updating the Site

### Vercel/Netlify (Git-based)
```bash
# Make changes to files
# Then:
git add .
git commit -m "Update pricing"
git push

# Auto-deploys in ~30 seconds
```

### Vercel CLI
```bash
cd /Users/rifat/clawd/revenue/ai-receptionist/landing-page/
# Make changes
vercel --prod
```

### Netlify CLI
```bash
cd /Users/rifat/clawd/revenue/ai-receptionist/landing-page/
# Make changes
netlify deploy --prod
```

### Traditional hosting (FTP)
- Edit files locally
- Re-upload via FTP
- May need to clear browser cache

---

## 🐛 Troubleshooting

### Site not loading
```bash
# Check DNS
dig calva.ai

# Check if deployed
curl -I https://calva.ai

# Common issues:
# - DNS not propagated (wait 24-48h)
# - Wrong DNS records
# - SSL provisioning (wait 24h)
```

### Styles not loading
- Clear browser cache: Cmd+Shift+R (Mac) or Ctrl+F5 (Win)
- Check file paths in HTML
- Check if CSS file uploaded correctly

### Mobile menu not working
- Check if script.js loaded
- Check browser console for errors (F12)
- Verify JavaScript enabled

### Images not showing
- Check file paths (case-sensitive on Linux)
- Verify images uploaded
- Check image file extensions

---

## 💰 Cost Breakdown

### Free Tier (Recommended for MVP)
| Service | Cost | Limits |
|---------|------|--------|
| Vercel | $0/mo | 100GB bandwidth |
| Netlify | $0/mo | 100GB bandwidth |
| GitHub Pages | $0/mo | 1GB storage |
| Domain | $10-12/year | N/A |

**Total: ~$1/month** (domain cost amortized)

### Paid Tier (if needed)
| Service | Cost | What you get |
|---------|------|--------------|
| Vercel Pro | $20/mo | Unlimited bandwidth, priority support |
| Netlify Pro | $19/mo | Unlimited bandwidth, form submissions |
| Cloudflare | $20/mo | Enhanced DDoS protection |

**Recommendation:** Start free, upgrade only if you exceed limits (unlikely for landing page).

---

## 📈 Performance Tips

### Already optimized:
✅ No frameworks (React, Vue, etc.)
✅ Minimal CSS (~20KB)
✅ Minimal JS (~10KB)
✅ Google Fonts with preconnect
✅ CSS animations (GPU-accelerated)

### If adding images later:
- Use WebP format
- Compress before upload (TinyPNG.com)
- Add `loading="lazy"` attribute
- Use appropriate sizes (don't upload 5MB images)

---

## 🎯 Next Steps After Deployment

1. **Add Stripe payment links** (replace `#signup` hrefs)
2. **Set up email capture** (Mailchimp, ConvertKit, or custom)
3. **Add live chat** (Intercom, Drift, or Tawk.to)
4. **Create blog** (for SEO content marketing)
5. **Set up A/B testing** (Google Optimize or VWO)
6. **Launch paid ads** (Google Ads, Facebook Ads)

---

## 📞 Support

Stuck? Check logs:
- **Vercel:** Dashboard → Deployments → View logs
- **Netlify:** Dashboard → Deploys → Deploy log
- **Browser:** F12 → Console tab

---

**Last updated:** Feb 2026  
**Status:** ✅ Production-ready deployment guide  
**Recommended:** Vercel for speed, Netlify for forms, GitHub Pages for free
