# AI Content Repurposing Tool — Deployment Guide

A single-page tool that takes a keyword, target audience, and optional instructions, then generates a full SEO blog post, a Facebook post, and an Instagram caption using GPT-4o via OpenRouter.

---

## How it works

- `content-repurposing-tool.html` — the frontend (pure HTML/CSS/JS, no frameworks)
- `api/generate.js` — a Vercel serverless function that holds your API key and proxies the OpenRouter call

The API key **never touches the browser**. The frontend sends your inputs to `/api/generate`, and the serverless function makes the actual OpenRouter request using the environment variable you set in Vercel.

---

## Step 1 — Add the file to your repo

The two files you need are already in your portfolio repo:

```
content-repurposing-tool.html
api/generate.js
```

Commit and push them:

```bash
git add content-repurposing-tool.html api/generate.js
git commit -m "feat: add AI content repurposing tool"
git push origin main
```

---

## Step 2 — Add your OpenRouter API key in Vercel

1. Go to [vercel.com](https://vercel.com) → open your portfolio project
2. Click **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name:** `OPENROUTER_API_KEY`
   - **Value:** your OpenRouter key (starts with `sk-or-v1-...`)
   - **Environments:** Production, Preview, Development ✓
4. Click **Save**

> Get a free OpenRouter key at [openrouter.ai/keys](https://openrouter.ai/keys). GPT-4o usage is pay-per-token — a typical generation costs ~$0.01–0.03.

---

## Step 3 — Redeploy

After saving the environment variable, trigger a redeploy so Vercel picks it up:

- Go to **Deployments** → click the latest deployment → **Redeploy**

Or just push any small change to trigger an automatic redeploy.

---

## Step 4 — Link it from your Tools page

Add a card to `tools.html` pointing to `/content-repurposing-tool.html`.

---

## Local development

To test locally with the serverless function:

```bash
npm i -g vercel
vercel dev
```

Then open `http://localhost:3000/content-repurposing-tool.html`.

Create a `.env.local` file in the project root for local testing:

```
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

> `.env.local` is already in `.gitignore` — never commit it.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `API key not configured on server` | Check the env var name is exactly `OPENROUTER_API_KEY` and redeploy |
| `API error 401` | Your OpenRouter key is invalid or expired |
| `API error 429` | You've hit OpenRouter's rate limit — wait a moment and retry |
| Blank outputs | The model returned an unexpected format — retry, it's rare |
| Tool works locally but not on Vercel | Make sure you redeployed *after* saving the env var |
