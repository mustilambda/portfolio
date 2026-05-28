# Mustansar Mahmood — Portfolio

Personal portfolio website for Mustansar Mahmood, Content Marketing Manager & Senior SEO Writer.

**Live site:** [your-vercel-url.vercel.app](https://your-vercel-url.vercel.app)

---

## Tech Stack

- Pure HTML, CSS, JavaScript — no framework, no build step
- Three.js (r128) — 3D hero animation (desktop only)
- Google Fonts — DM Serif Display + Plus Jakarta Sans
- Vercel — hosting & deployment

---

## Project Structure

```
mustansar-portfolio/
├── index.html                        # Home page
├── about.html                        # About page
├── services.html                     # Services page
├── portfolio.html                    # Portfolio page
├── guides.html                       # Guides page
├── cv.html                           # CV viewer page
├── contact.html                      # Contact page
├── mustansar-photo.jpg               # Profile photo
├── hero_image.jpg                    # Hero background
├── Mustansar_Mahmood_CV.pdf          # Downloadable CV
├── portfolio-saas-pdf-article.pdf    # SaaS writing sample
├── portfolio-email-sample.pdf        # Email copy sample
├── portfolio-puebla-travel-article.pdf  # Travel writing sample
├── portfolio-philodendron-article.pdf   # Non-technical sample
├── portfolio-chocolate-bark-article.pdf # Non-technical sample
├── portfolio-social-calendar.xlsx    # Social media calendar sample
├── vercel.json                       # Vercel routing config
└── .gitignore
```

---

## Deploy to Vercel (via GitHub)

### Step 1 — Push to GitHub

```bash
# Clone or init the repo
git init
git add .
git commit -m "Initial commit — Mustansar Mahmood portfolio"

# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/mustansar-portfolio.git
git branch -M main
git push -u origin main
```

### Step 2 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Import your `mustansar-portfolio` repository
4. Leave all settings as default — no build command, no output directory needed
5. Click **"Deploy"**

Your site will be live at `https://mustansar-portfolio.vercel.app` (or a custom domain).

### Step 3 — Auto-deploy on every push

Once connected, every `git push` to `main` will automatically redeploy your site on Vercel. No manual steps needed.

---

## Custom Domain (optional)

1. In Vercel dashboard → your project → **Settings → Domains**
2. Add your domain (e.g. `mustansarmahmood.com`)
3. Update your domain's DNS records as instructed by Vercel

---

## Making Updates

Edit any `.html` file locally, then:

```bash
git add .
git commit -m "Update: describe what you changed"
git push
```

Vercel redeploys automatically within ~30 seconds.
