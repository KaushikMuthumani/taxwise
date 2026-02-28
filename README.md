# Taxwise — Final Complete Version

## The product

Taxwise is a year-round financial co-pilot for every earning Indian.
Not just a tax filing tool — a buddy that helps you save, invest smarter, and stay ahead.

**What makes it different from ClearTax:**
- AI Advisor that knows your full financial picture and answers any question
- Year-round tracking, not just April panic filing  
- 44ADA auto-detection for freelancers
- All 4 ITR forms in one tool (salaried, investor, business, freelancer)
- Tax health score updated monthly
- Investment nudges — tells you exactly what to invest before March 31

---

## Pages

| URL | Description |
|---|---|
| `/` → `/landing` | Public landing page + waitlist |
| `/demo` | Full investor demo, no login needed |
| `/auth/login` | Login (email + Google OAuth) |
| `/auth/signup` | Signup |
| `/dashboard` | Home — health score, tax liability, nudges |
| `/advisor` | AI financial buddy chat |
| `/income` | Add/view all income sources |
| `/deductions` | 80C, 80D, NPS, HRA, home loan |
| `/import` | Upload bank PDF or AIS |
| `/advance-tax` | Quarterly schedule + payment tracker |
| `/file-itr` | ITR wizard + summary download |
| `/settings` | Profile, PAN, regime, Pro upgrade |

---

## Deploy in 5 minutes

### 1. Push to GitHub
```bash
git init && git add . && git commit -m "Taxwise final"
gh repo create taxwise --private && git push origin main
```

### 2. Deploy on Vercel
1. vercel.com → Import Project → select repo
2. Add these environment variables:

| Variable | Where |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (service_role) |
| `GROQ_API_KEY` | console.groq.com → API Keys |
| `RESEND_API_KEY` | resend.com (optional, for emails) |

3. Click Deploy

### 3. Set up Supabase
1. Run `supabase-schema.sql` in Supabase SQL Editor (full schema)
2. Authentication → Settings → Disable email confirmations (for dev)
3. Authentication → Providers → Google → Enable + add Client ID/Secret
4. Authentication → URL Configuration → add your Vercel URL + `/auth/callback`

### 4. Fix Google OAuth redirect
In Supabase → Auth → URL Configuration, add:
```
https://your-domain.vercel.app/auth/callback
```

---

## Freemium model

**Free:**
- Manual income entry (up to 10)
- Basic tax calculation
- Advance tax schedule
- 3 AI Advisor questions/month

**Pro (₹999/yr):**
- Unlimited income entries + years
- AI Advisor (unlimited)
- Bank PDF import (unlimited)
- AIS + Form 16 import
- Investment planner
- Cashflow forecasting
- ITR summary download
- Advance tax reminders

---

## Post-launch (not built yet)
- Setu Account Aggregator — live bank sync, no PDF upload
- ERI registration — direct ITR filing to IT portal
- CA marketplace
- Mobile app

---

## Investor demo script

Send them: `yourdomain.com/demo`

1. Dashboard → "This is Arjun, freelance dev, ₹18.78L income"
2. 44ADA banner → "₹9.4L untaxed. ClearTax buries this, we surface it."
3. AI Advisor → type "How much should I invest in NPS?" → watch it calculate with real numbers
4. Deductions → show progress bars, remaining 80C limit  
5. `/landing` → "847 freelancers waiting. 9 crore gig workers, no good tool."

The AI Advisor is the killer demo moment — it knows the user's full financial context and gives specific, calculated answers.
