# Calva Landing Page - Launch Checklist

**Use this checklist to go from development → production launch**

---

## 📋 Pre-Launch Checklist

### ✅ Content Review
- [ ] Review all copy for typos/grammar
- [ ] Verify phone number is correct: (929) 755-7288
- [ ] Check all pricing amounts: $297, $597, $997
- [ ] Verify business hours mentioned are accurate
- [ ] Replace placeholder testimonials with real ones
- [ ] Update FAQ answers if needed
- [ ] Check industry templates are relevant

### ✅ Technical Setup
- [ ] Test on Chrome, Safari, Firefox
- [ ] Test on iPhone (iOS Safari)
- [ ] Test on Android Chrome
- [ ] Test all CTAs click correctly
- [ ] Test FAQ accordion opens/closes
- [ ] Test smooth scrolling works
- [ ] Test mobile menu toggle (if applicable)
- [ ] Verify all links go somewhere valid
- [ ] Check console for JavaScript errors (F12)
- [ ] Test page load speed (should be <1s)

### ✅ Assets & Files
- [ ] Generate favicons (favicon-16x16.png, favicon-32x32.png)
- [ ] Generate apple-touch-icon.png (180×180px)
- [ ] Create og-image.jpg (1200×630px for social sharing)
- [ ] Update meta description if needed
- [ ] Add custom logo (replace 📞 emoji)
- [ ] Optimize all images (<100KB each)

### ✅ Legal & Compliance
- [ ] Create Privacy Policy page
- [ ] Create Terms of Service page
- [ ] Create Refund Policy section
- [ ] Update footer links to point to legal pages
- [ ] Review GDPR compliance (if EU traffic)
- [ ] Add cookie consent banner (if needed)

### ✅ Payment Setup
- [ ] Create Stripe account (or use existing)
- [ ] Create 3 products in Stripe:
  - [ ] Starter ($297/mo)
  - [ ] Growth ($597/mo)
  - [ ] Premium ($997/mo)
- [ ] Generate payment links for each
- [ ] Replace all `href="#signup"` with Stripe links
- [ ] Test checkout flow end-to-end
- [ ] Set up webhook for successful payments

### ✅ Analytics & Tracking
- [ ] Create Google Analytics 4 property
- [ ] Get tracking ID (G-XXXXXXXXXX)
- [ ] Add GA4 script to index.html <head>
- [ ] Set up conversion goals in GA4
- [ ] Add Facebook Pixel (if running FB ads)
- [ ] Set up Google Ads conversion tracking (if applicable)
- [ ] Test tracking with Google Tag Assistant

---

## 🚀 Deployment Steps

### Option A: Vercel (Recommended)

```bash
# 1. Install CLI
npm i -g vercel

# 2. Deploy
cd /Users/rifat/clawd/revenue/ai-receptionist/landing-page/
vercel --prod

# 3. Add custom domain
# Go to Vercel dashboard → Add domain: calva.ai
```

**Checklist:**
- [ ] Deploy successful
- [ ] Get deployment URL
- [ ] Add custom domain in Vercel dashboard
- [ ] Update DNS records (A + CNAME)
- [ ] Wait for SSL certificate (usually <24h)
- [ ] Test HTTPS works

### Option B: Netlify

```bash
# 1. Install CLI
npm i -g netlify-cli

# 2. Deploy
cd /Users/rifat/clawd/revenue/ai-receptionist/landing-page/
netlify deploy --prod

# 3. Add custom domain in dashboard
```

**Checklist:**
- [ ] Deploy successful
- [ ] Add domain in Netlify settings
- [ ] Update DNS records
- [ ] Enable HTTPS
- [ ] Test deployment

### Option C: Traditional Hosting

**Checklist:**
- [ ] Upload all files via FTP/SFTP
- [ ] Verify file permissions (755 folders, 644 files)
- [ ] Test site loads correctly
- [ ] Enable HTTPS (Let's Encrypt or hosting SSL)
- [ ] Set up 301 redirect (www → non-www or vice versa)

---

## 🌐 Domain & DNS Setup

### After Deployment, Update DNS:

**For Vercel:**
```
Type    Name    Value                   TTL
A       @       76.76.21.21            Auto
CNAME   www     cname.vercel-dns.com   Auto
```

**For Netlify:**
```
Type    Name    Value                       TTL
A       @       75.2.60.5                  Auto
CNAME   www     calva-xxxxx.netlify.app    Auto
```

**Checklist:**
- [ ] Update A record for root domain (@)
- [ ] Update CNAME for www subdomain
- [ ] Wait for DNS propagation (check with: `dig calva.ai`)
- [ ] Test both http://calva.ai and http://www.calva.ai
- [ ] Verify HTTPS redirects work
- [ ] Test on mobile network (not just WiFi)

---

## 🔒 Security Setup

### Post-Deployment Security

**Checklist:**
- [ ] Verify HTTPS is enabled and working
- [ ] Force HTTPS redirect (HTTP → HTTPS)
- [ ] Add security headers (CSP, X-Frame-Options, etc.)
- [ ] Enable HSTS (Strict-Transport-Security header)
- [ ] Remove any sensitive data from source
- [ ] Set up monitoring for uptime

**Vercel Security Headers** (`vercel.json`):
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" }
      ]
    }
  ]
}
```

---

## 📊 Post-Launch Setup

### Monitoring & Analytics

**Checklist:**
- [ ] Set up uptime monitoring (UptimeRobot.com - free)
- [ ] Add site to Google Search Console
- [ ] Submit sitemap.xml (if created)
- [ ] Set up alerts for downtime
- [ ] Monitor Google Analytics dashboard
- [ ] Check page speed (PageSpeed Insights)
- [ ] Set up error tracking (Sentry or similar)

### SEO Setup

**Checklist:**
- [ ] Submit to Google Search Console
- [ ] Submit to Bing Webmaster Tools
- [ ] Create and submit sitemap.xml
- [ ] Add site to Google My Business (if applicable)
- [ ] Set up structured data (Schema.org)
- [ ] Check mobile-friendliness (Google Mobile-Friendly Test)
- [ ] Fix any SEO issues reported

### Marketing Setup

**Checklist:**
- [ ] Set up email capture (Mailchimp, ConvertKit, etc.)
- [ ] Create welcome email sequence
- [ ] Set up abandoned cart emails (if applicable)
- [ ] Add live chat widget (optional: Intercom, Drift, Tawk.to)
- [ ] Set up Facebook/LinkedIn retargeting pixels
- [ ] Create social media sharing images
- [ ] Share on social media

---

## 🧪 Testing Checklist

### Browser Testing
- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] iOS Safari (iPhone)
- [ ] Android Chrome

### Device Testing
- [ ] Desktop (1920×1080)
- [ ] Laptop (1366×768)
- [ ] Tablet (768×1024)
- [ ] iPhone 12/13/14 (390×844)
- [ ] iPhone SE (375×667)
- [ ] Samsung Galaxy (360×640)

### Functionality Testing
- [ ] All navigation links work
- [ ] Smooth scroll to sections
- [ ] FAQ accordion opens/closes
- [ ] Mobile menu toggles (if applicable)
- [ ] All CTA buttons link correctly
- [ ] Phone number clicks (tel: link)
- [ ] Pricing cards clickable
- [ ] Form validation (if forms added)
- [ ] No console errors (F12)
- [ ] Images load (when added)

### Performance Testing
- [ ] PageSpeed Insights score >90
- [ ] GTmetrix score A
- [ ] Load time <2 seconds
- [ ] No layout shift (CLS)
- [ ] Lighthouse audit passed

---

## 🎯 Conversion Optimization

### A/B Testing Ideas (Post-Launch)

**Week 1-2:**
- [ ] Test hero CTA copy ("Start Free Trial" vs "Get Started Free")
- [ ] Test with/without phone number in hero
- [ ] Test pricing order (popular first vs ascending price)

**Week 3-4:**
- [ ] Test testimonial placement
- [ ] Test different hero images/backgrounds
- [ ] Test shorter vs longer copy

**Month 2:**
- [ ] Test video vs no video
- [ ] Test chat widget placement
- [ ] Test exit-intent popup

### Key Metrics to Track

**Daily:**
- [ ] Unique visitors
- [ ] Bounce rate
- [ ] CTA clicks
- [ ] Trial signups

**Weekly:**
- [ ] Conversion rate
- [ ] Traffic sources
- [ ] Top pages
- [ ] User flow

**Monthly:**
- [ ] Trial → Paid conversion
- [ ] Customer acquisition cost
- [ ] Lifetime value
- [ ] ROI on marketing

---

## ✅ Launch Day Checklist

### T-1 Day (Before Launch)
- [ ] Final content review
- [ ] Test all functionality again
- [ ] Prepare social media posts
- [ ] Prepare email announcement
- [ ] Brief support team (if any)
- [ ] Set up monitoring

### Launch Day
- [ ] Deploy to production
- [ ] Verify site is live
- [ ] Test checkout flow
- [ ] Monitor analytics
- [ ] Post on social media
- [ ] Send email announcement
- [ ] Monitor for errors/issues
- [ ] Respond to any questions

### T+1 Day (After Launch)
- [ ] Review analytics data
- [ ] Check for any errors
- [ ] Respond to feedback
- [ ] Fix any bugs found
- [ ] Thank everyone who shared

---

## 🚨 Common Issues & Fixes

### Issue: Styles not loading
**Fix:** Clear browser cache (Cmd+Shift+R or Ctrl+F5)

### Issue: Mobile menu not working
**Fix:** Check script.js loaded, verify console for errors

### Issue: Slow load time
**Fix:** Optimize images, enable CDN, check hosting

### Issue: SSL not working
**Fix:** Wait 24h for certificate, check DNS records

### Issue: Images broken
**Fix:** Check file paths (case-sensitive), verify uploads

### Issue: Stripe links not working
**Fix:** Verify Stripe account active, test in incognito mode

---

## 📞 Support Resources

### If Stuck:
- **Vercel docs:** https://vercel.com/docs
- **Netlify docs:** https://docs.netlify.com
- **Stripe docs:** https://stripe.com/docs
- **Google Analytics:** https://support.google.com/analytics

### Community Help:
- Stack Overflow
- Vercel Discord
- Reddit: /r/webdev

---

## 🎉 Post-Launch Celebration

Once everything is ✅:
- [ ] Celebrate! 🎉
- [ ] Document lessons learned
- [ ] Plan next iteration
- [ ] Start driving traffic

---

**Expected timeline:**
- Pre-launch tasks: 2-3 hours
- Deployment: 30 minutes
- DNS propagation: 24-48 hours
- Testing & fixes: 1-2 hours

**Total: 1-2 days from code complete → live site**

---

**Last updated:** Feb 2026  
**Status:** Complete launch checklist  
**Use:** Check off items as you go
