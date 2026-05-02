# MOM AI — Instantly Campaign Dashboard

## Quick Deploy (2 minutes)

### Step 1: Get your Instantly API Key
1. Log into Instantly → Settings → Integrations → API Keys
2. Copy your API key

### Step 2: Deploy to Vercel
```bash
npm i -g vercel
vercel login
vercel deploy --prod
```
When prompted:
- Set up and deploy? → Y
- Which scope? → max77788s-projects
- Link to existing project? → N
- Project name → instantly-dashboard
- Directory? → ./

### Step 3: Add Environment Variable
In Vercel dashboard → Project → Settings → Environment Variables:
- Name: `INSTANTLY_API_KEY`
- Value: your Instantly API key
- Environment: Production ✓

### Step 4: Redeploy
```bash
vercel deploy --prod
```

Your dashboard will be live at: `https://instantly-dashboard.vercel.app`
