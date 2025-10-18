# Complete Setup Instructions for URL Monitor

## Current Status
The app is built but **database tables don't exist yet**. Follow these steps to get everything working.

---

## Step 1: Create Database Tables (CRITICAL - DO THIS FIRST!)

### Option A: Using Supabase Dashboard (Recommended)

1. Open this link in your browser:
   **https://supabase.com/dashboard/project/blkoznxdbjcibfxlcwrg/sql/new**

2. Copy the ENTIRE content from this file in your project:
   `supabase/migrations/20250608000000_create_url_monitoring_tables.sql`

3. Paste it into the SQL Editor

4. Click **RUN** (or press Ctrl+Enter)

5. You should see: "Success. No rows returned"

6. **Refresh your app preview** - it should now work!

### Option B: Using API (if you prefer curl)

```bash
# Get your service role key from:
# https://supabase.com/dashboard/project/blkoznxdbjcibfxlcwrg/settings/api

# Then run (replace YOUR_SERVICE_ROLE_KEY):
curl -X POST 'https://blkoznxdbjcibfxlcwrg.supabase.co/rest/v1/rpc/exec' \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT 1"}'
```

---

## Step 2: Deploy Edge Functions

### Deploy monitor-urls function

1. Go to: **https://supabase.com/dashboard/project/blkoznxdbjcibfxlcwrg/functions**

2. Click **"Create a new function"**

3. Name it: `monitor-urls`

4. Copy the content from: `supabase/functions/monitor-urls/index.ts`

5. Paste it into the editor

6. Click **"Deploy function"**

7. **Important:** Set "Verify JWT" to **OFF** (unchecked)

### Deploy check-url function

1. Stay on the Edge Functions page

2. Click **"Create a new function"** again

3. Name it: `check-url`

4. Copy the content from: `supabase/functions/check-url/index.ts`

5. Paste it into the editor

6. Click **"Deploy function"**

7. **Important:** Set "Verify JWT" to **OFF** (unchecked)

---

## Step 3: Set Up Automatic Monitoring (Cron Job)

1. Go to: **https://supabase.com/dashboard/project/blkoznxdbjcibfxlcwrg/database/cron-jobs**

2. Click **"Create a new cron job"**

3. Name: `monitor-urls-job`

4. Schedule: `*/2 * * * *` (every 2 minutes)

5. SQL Command (copy this):

```sql
SELECT
  net.http_post(
    url:='https://blkoznxdbjcibfxlcwrg.supabase.co/functions/v1/monitor-urls',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) AS request_id;
```

6. **Replace `YOUR_SERVICE_ROLE_KEY`** with your actual key from:
   https://supabase.com/dashboard/project/blkoznxdbjcibfxlcwrg/settings/api

7. Click **"Create cron job"**

---

## Step 4: Enable Required Extensions

Make sure these PostgreSQL extensions are enabled:

1. Go to: **https://supabase.com/dashboard/project/blkoznxdbjcibfxlcwrg/database/extensions**

2. Enable these if not already enabled:
   - `pg_cron` (for scheduled jobs)
   - `pg_net` (for HTTP requests)
   - `uuid-ossp` (for UUID generation)

---

## Testing Your Setup

### Test 1: Check if tables exist

Go to SQL Editor and run:

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

You should see:
- monitored_urls
- url_alerts
- url_check_history

### Test 2: Add a test URL

In your app, add this URL to monitor:
- URL: `https://httpstat.us/404`
- Name: `Test 404 Error`

### Test 3: Manually trigger monitoring

```bash
curl -X POST https://blkoznxdbjcibfxlcwrg.supabase.co/functions/v1/monitor-urls \
  -H "Content-Type: application/json"
```

### Test 4: Check if alert was created

In SQL Editor:

```sql
SELECT * FROM url_alerts ORDER BY created_at DESC LIMIT 5;
```

You should see an alert with screenshot_url!

---

## How It Works

1. **You add URLs** through the web interface
2. **Cron job runs every 2 minutes** and calls the `monitor-urls` function
3. **Function checks all active URLs** using HEAD requests
4. **If URL is down (not 2xx status)**, it:
   - Updates status in `monitored_urls`
   - Saves to `url_check_history`
   - Creates alert in `url_alerts`
   - **Captures full-page screenshot** with URL visible (1920x1080, 90% quality)
5. **UI updates automatically** via Supabase real-time

---

## Screenshot Features

When an error occurs, the system captures:
- **Full page screenshot** (not just viewport)
- **1920x1080 resolution** (desktop view)
- **90% JPEG quality** (high quality, readable)
- **2 second delay** (page loads completely)
- **No ad blocking** (shows actual error page)
- **URL visible** in browser address bar

This proves to your system team that errors happened!

---

## Troubleshooting

### App shows "Could not find table"
- Database migration not run yet
- Go back to Step 1

### URLs not being checked automatically
- Cron job not set up or not running
- Check: https://supabase.com/dashboard/project/blkoznxdbjcibfxlcwrg/database/cron-jobs
- Verify service role key is correct

### Edge function fails
- Check logs: https://supabase.com/dashboard/project/blkoznxdbjcibfxlcwrg/functions
- Verify "Verify JWT" is OFF
- Check CORS headers are present

### Screenshots not appearing
- Screenshot API has rate limits on demo key
- Screenshots generate when URL first goes down
- Click "View Screenshot" link in alerts

---

## Quick Links

- **SQL Editor**: https://supabase.com/dashboard/project/blkoznxdbjcibfxlcwrg/sql/new
- **Edge Functions**: https://supabase.com/dashboard/project/blkoznxdbjcibfxlcwrg/functions
- **Cron Jobs**: https://supabase.com/dashboard/project/blkoznxdbjcibfxlcwrg/database/cron-jobs
- **API Keys**: https://supabase.com/dashboard/project/blkoznxdbjcibfxlcwrg/settings/api
- **Extensions**: https://supabase.com/dashboard/project/blkoznxdbjcibfxlcwrg/database/extensions
- **Function Logs**: https://supabase.com/dashboard/project/blkoznxdbjcibfxlcwrg/logs/edge-functions

---

## Environment Variables (Already Set)

These are already in your `.env` file - no need to change:

```
VITE_SUPABASE_URL=https://blkoznxdbjcibfxlcwrg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

**Start with Step 1, then everything else will work!**
