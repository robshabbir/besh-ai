# Assets Needed for Calva Landing Page

## 🖼️ Images & Icons

### Favicon Package (Required)
Generate at: https://realfavicongenerator.net/

**Files needed:**
```
favicon-16x16.png       (16×16px)
favicon-32x32.png       (32×32px)
apple-touch-icon.png    (180×180px)
android-chrome-192x192.png
android-chrome-512x512.png
site.webmanifest
```

**How to create:**
1. Create base logo (512×512px PNG with transparent background)
2. Upload to RealFaviconGenerator
3. Download package
4. Extract all files to landing-page directory

**Quick CLI tool:**
```bash
# Install
npm install -g pwa-asset-generator

# Generate (if you have logo.png)
pwa-asset-generator logo.png ./favicons --favicon --type png
```

---

### Open Graph Image (For Social Sharing)
**Filename:** `og-image.jpg`
**Dimensions:** 1200×630px
**File size:** <500KB

**What to include:**
- Calva logo/wordmark
- Tagline: "Every Call, Covered"
- Visual: Phone + AI elements (abstract)
- Background: Dark theme matching brand

**Design tools:**
- Canva: https://www.canva.com/create/og-images/
- Figma: Use template
- Photoshop/Sketch: Manual design

**Example layout:**
```
┌────────────────────────────────────┐
│                                    │
│    📞 CALVA                        │
│    Every Call, Covered             │
│                                    │
│    AI Receptionist for Business   │
│                                    │
│    [Abstract phone + AI visual]    │
│                                    │
└────────────────────────────────────┘
```

---

### Logo Files (Optional but recommended)

**Main logo:**
- `logo.svg` - Vector format (scalable)
- `logo.png` - Raster backup (2x resolution)
- `logo-white.png` - White version for dark backgrounds

**Dimensions:** 
- SVG: Viewbox 0 0 200 50 (roughly)
- PNG: 400×100px @2x (200×50 displayed)

**Current:** Using emoji 📞 as placeholder

---

### Hero Background (Optional enhancement)

**Filename:** `hero-bg.webp` or `hero-bg.jpg`
**Dimensions:** 1920×800px
**File size:** <200KB

**Ideas:**
- Abstract gradient
- Blurred office/phone scene
- Geometric patterns
- AI-themed visuals

**Not required:** Current gradient background works well

---

### Feature Icons (Optional upgrade)

Currently using emoji. Could upgrade to:
- Custom SVG icons
- Icon font (Font Awesome, Feather Icons)
- Illustrated icons

**If custom icons:**
- Create 6 icons (24/7, Calendar, Target, Speech, Globe, Chart)
- Format: SVG
- Style: Line icons, consistent stroke width
- Color: Match accent color (#6366f1)

---

## 📝 Content Assets

### Testimonials (Replace placeholders)

**Current:** 3 placeholder testimonials with fake names

**Need:**
- 3-6 real customer testimonials
- Customer name
- Business name + type
- Optional: Photo (headshot, 200×200px)
- Permission to use publicly

**Template:**
```
"Quote about how Calva helped their business..."
- Name, Title
  Business Name (Industry)
```

---

### Demo Video (Optional addition)

**If creating video:**
- Duration: 30-60 seconds
- Format: MP4 (H.264)
- Dimensions: 1280×720px (720p)
- Hosting: YouTube or Vimeo
- Content: Screen recording of AI answering call

**Embed code location:** Between Hero and Problem sections

---

### Case Studies (Future content)

**Format:** PDF or separate web pages
- Customer story
- Problem they had
- How Calva solved it
- Results (metrics)

**Example:** "How Mike's Plumbing increased bookings by 40%"

---

## 🎨 Brand Assets

### Color Palette (Already defined)
```css
Primary: #6366f1 (Indigo)
Dark:    #0a0a0f
Card:    #1f1f2e
Text:    #ffffff, #b4b4c8
```

### Typography (Already defined)
```css
Font: Inter (Google Fonts)
Weights: 400, 500, 600, 700, 800
```

### Voice & Tone
- Professional but approachable
- Confident, not arrogant
- Clear, jargon-free
- Action-oriented

---

## 📄 Legal Documents (Required before launch)

### Privacy Policy
**Filename:** `privacy.html` or link to external
**Required sections:**
- What data we collect
- How we use it
- Cookie usage
- Third-party services (analytics)
- User rights
- Contact information

**Template generator:** https://www.privacypolicygenerator.info/

---

### Terms of Service
**Filename:** `terms.html` or link to external
**Required sections:**
- Service description
- User obligations
- Payment terms
- Cancellation policy
- Limitation of liability
- Dispute resolution

**Template generator:** https://www.termsofservicegenerator.net/

---

### Refund Policy
**Should specify:**
- Trial period (7 days free)
- Refund window (e.g., 30 days)
- How to request refund
- What's not refundable

---

## 🔗 Integration Assets

### Stripe Payment Links
**Need 3 links:**
1. Starter plan ($297/mo)
2. Growth plan ($597/mo)
3. Premium plan ($997/mo)

**Setup:**
1. Create Stripe account
2. Create products
3. Generate payment links
4. Replace `href="#signup"` in HTML

**Example:**
```html
<a href="https://buy.stripe.com/test_xxxxx" class="btn btn-primary">
  Start Free Trial
</a>
```

---

### Google Analytics ID
**Need:** `G-XXXXXXXXXX`

**Setup:**
1. Create Google Analytics property
2. Get tracking ID
3. Add to HTML (see README)

---

### Email Service (for contact form)

**Options:**
- Formspree (simplest)
- Netlify Forms (if on Netlify)
- SendGrid API
- Custom backend

**For Formspree:**
```html
<form action="https://formspree.io/f/YOUR-ID" method="POST">
  ...
</form>
```

---

## 📊 Analytics & Tracking

### Pixels/Tags to add:

**Google Ads:**
- Conversion tracking pixel
- Remarketing tag

**Facebook Pixel:**
- Page view tracking
- CTA click events
- Pricing page view

**LinkedIn Insight Tag:**
- (If targeting B2B)

---

## ✅ Asset Checklist

### Before Launch (Must Have)
- [ ] Favicon package (16px, 32px, apple-touch)
- [ ] OG image (og-image.jpg, 1200×630px)
- [ ] Privacy policy page/link
- [ ] Terms of service page/link
- [ ] 3 Stripe payment links
- [ ] Google Analytics ID
- [ ] Real phone number (or confirm +19297557288)

### Nice to Have (Week 1)
- [ ] Custom logo (SVG + PNG)
- [ ] 3 real testimonials
- [ ] Demo video
- [ ] Professional headshots for team

### Future Enhancements
- [ ] Case study PDFs
- [ ] Custom icon set
- [ ] Hero background image
- [ ] Blog content
- [ ] Email templates

---

## 🎯 Priority Order

**Critical (before public launch):**
1. Favicon package
2. OG image
3. Privacy/Terms pages
4. Stripe links
5. Real testimonials

**Important (first week):**
6. Google Analytics
7. Logo files
8. Demo video

**Nice to have:**
9. Custom icons
10. Case studies
11. Hero image

---

## 📦 Where to Put Assets

```
landing-page/
├── index.html
├── styles.css
├── script.js
├── favicon-16x16.png          ← Add here
├── favicon-32x32.png           ← Add here
├── apple-touch-icon.png        ← Add here
├── og-image.jpg                ← Add here
├── site.webmanifest            ← Add here
├── logo.svg                    ← Add here
├── logo.png                    ← Add here
├── privacy.html                ← Add here
├── terms.html                  ← Add here
└── assets/                     ← Optional folder
    ├── images/
    ├── icons/
    └── videos/
```

---

## 🔨 Quick Asset Creation Commands

### Generate favicons from logo
```bash
# Using ImageMagick (if installed)
convert logo.png -resize 16x16 favicon-16x16.png
convert logo.png -resize 32x32 favicon-32x32.png
convert logo.png -resize 180x180 apple-touch-icon.png

# Using web tool
open https://realfavicongenerator.net/
```

### Optimize images
```bash
# Using ImageOptim (Mac)
open -a ImageOptim og-image.jpg

# Using TinyPNG
open https://tinypng.com/

# Using CLI
npm install -g imagemin-cli
imagemin og-image.jpg --out-dir=.
```

---

## 📞 Need Help?

**Design resources:**
- Canva (free templates)
- Figma (design tool)
- Unsplash (free stock photos)
- Flaticon (free icons)

**Content writing:**
- ChatGPT (draft copy)
- Grammarly (proofing)
- Hemingway Editor (clarity)

---

**Last updated:** Feb 2026  
**Status:** Comprehensive asset guide  
**Priority:** Complete "Must Have" items before launch
