# Forex Trading Bot - Complete Setup Guide

## ✅ Step 1: Setup Database Tables

### Method A: Using Supabase Dashboard (EASIEST)

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project: **gewrbyiwjairnhehssje**
3. Click **SQL Editor** in the left sidebar
4. Click **New Query** button
5. Open the file `setup-database.sql` in this project
6. Copy ALL the SQL code from that file
7. Paste it into the Supabase SQL Editor
8. Click **RUN** button (or press Ctrl+Enter)
9. You should see: "Success. No rows returned"

### Method B: Using Supabase CLI (Advanced)

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Link to your project
supabase link --project-ref gewrbyiwjairnhehssje

# Run migrations
supabase db push
```

---

## ✅ Step 2: Setup Edge Functions

Your app has 2 Edge Functions that need API keys:

### A. Get Finnhub API Key (Free)

1. Go to [https://finnhub.io/register](https://finnhub.io/register)
2. Sign up for a free account
3. Copy your API key

### B. Set Environment Variables in Supabase

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project
3. Go to **Project Settings** (gear icon) → **Edge Functions**
4. Under "Environment Variables", add:
   - Name: `FINNHUB_API_KEY`
   - Value: `<your-finnhub-api-key>`
5. Click **Save**

### C. Deploy Edge Functions

Run these commands in your terminal:

```powershell
# Navigate to your project
cd "C:\Users\emman\Desktop\mybot\apex-forex-whisperer"

# Deploy fetch-forex-data function
supabase functions deploy fetch-forex-data

# Deploy ai-analysis function
supabase functions deploy ai-analysis
```

**Alternative: Deploy via Supabase Dashboard**

1. Go to **Edge Functions** in your Supabase dashboard
2. Click **Deploy new function**
3. Upload `supabase/functions/fetch-forex-data/index.ts`
4. Repeat for `ai-analysis`

---

## ✅ Step 3: Verify Setup

### Test Database

1. In Supabase Dashboard, go to **Table Editor**
2. You should see 4 tables:
   - `currency_pairs` (should have 8 rows)
   - `trading_signals` (should have 3 sample rows)
   - `notifications` (should have 1 welcome message)
   - `market_analysis` (empty for now)

### Test Edge Functions

In your browser console or via curl:

```javascript
// Test fetch-forex-data
fetch('https://gewrbyiwjairnhehssje.supabase.co/functions/v1/fetch-forex-data', {
  headers: { 'apikey': 'sb_publishable_ak1_2p5_R6JGOklWKHq9kg_Qy4tMl7J' }
})
```

---

## ✅ Step 4: Run Your App

```powershell
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

Your app should now:
- Load currency pairs from database ✅
- Show trading signals ✅
- Display notifications ✅
- Allow manual refresh that calls Edge Functions ✅

---

## 🎯 Quick Checklist

- [ ] Database tables created
- [ ] Sample data inserted
- [ ] Finnhub API key obtained
- [ ] Environment variables set in Supabase
- [ ] Edge Functions deployed
- [ ] App running without errors

---

## 🐛 Troubleshooting

### "No rows found" in currency_pairs table
- Make sure you ran the complete SQL including the INSERT statements

### Edge Functions not working
- Check that FINNHUB_API_KEY is set in Supabase Project Settings
- Verify functions are deployed in Edge Functions dashboard
- Check function logs in Supabase for errors

### Connection errors
- Verify your API key is correct in `src/integrations/supabase/client.ts`
- Check that Row Level Security policies allow public read access

---

Need help? Check the Supabase logs:
- **Edge Function Logs**: Supabase Dashboard → Edge Functions → Select function → Logs
- **Database Logs**: Supabase Dashboard → Logs → Database
