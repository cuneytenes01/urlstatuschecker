# 24/7 URL Monitoring - Setup Guide

## Overview
This application uses Supabase for 24/7 URL monitoring that works even when your computer is off.

## CRITICAL: Why Preview Shows Errors

The database tables haven't been created yet. You MUST complete Step 1 below to fix this.

## Setup Steps

### 1. Run Database Migration (REQUIRED - DO THIS FIRST!)

The app won't work until you create the database tables:

1. Go to: https://supabase.com/dashboard/project/blkoznxdbjcibfxlcwrg/sql/new
2. Open the file: `supabase/migrations/20250608000000_create_url_monitoring_tables.sql` from this project
3. Copy the ENTIRE SQL content (all ~180 lines)
4. Paste it into the SQL Editor window
5. Click "RUN" button (or press Ctrl+Enter)
6. Wait for "Success. No rows returned" message
7. Refresh your app preview - it should now work!

This creates three tables:
- `monitored_urls` - Stores URLs to monitor
- `url_alerts` - Stores alerts when URLs go down (with screenshots!)
- `url_check_history` - Stores historical check data

### 2. Deploy the Monitor Edge Function

The monitoring edge function needs to be deployed:

```bash
# This will be done through the Supabase dashboard or CLI
```

**Important**: Since the Supabase CLI is not available in this environment, you'll need to manually deploy the edge function:

1. Go to your Supabase project dashboard
2. Navigate to Edge Functions
3. Create a new function called `monitor-urls`
4. Copy the content from `supabase/functions/monitor-urls/index.ts`
5. Deploy the function

### 3. Set Up Cron Job

To enable automatic monitoring every 2 minutes, you need to set up a cron job:

1. Go to your Supabase project dashboard
2. Navigate to Database → Cron Jobs (pg_cron extension)
3. Create a new cron job with this schedule:

```sql
-- Run every 2 minutes
SELECT cron.schedule(
  'monitor-urls-job',
  '*/2 * * * *',
  $$
  SELECT
    net.http_post(
      url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/monitor-urls',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
    ) AS request_id;
  $$
);
```

Replace:
- `YOUR_PROJECT_REF` with your Supabase project reference (e.g., `blkoznxdbjcibfxlcwrg`)
- `YOUR_SERVICE_ROLE_KEY` with your service role key from Project Settings → API

### 4. How It Works

1. **Adding URLs**: When you add a URL through the UI, it's saved to the Supabase database
2. **Background Monitoring**: Every 2 minutes, the cron job triggers the `monitor-urls` edge function
3. **Status Checks**: The edge function checks all active URLs and updates their status
4. **Alert Creation**: If a URL goes from healthy to unhealthy, an alert is created with a full-page screenshot
5. **Real-time Updates**: The UI automatically updates when data changes using Supabase real-time subscriptions

### 5. Screenshot Features

When a URL returns an error:
- **Full Page Screenshot**: Captures the entire error page (1920x1080)
- **URL Visible**: The browser address bar and URL are visible in the screenshot
- **High Quality**: 90% JPEG quality for clear error messages
- **2 Second Delay**: Waits for page to load before capturing
- **No Ad Blocking**: Shows the actual error page as-is

This helps you prove to your system team that errors occurred, even if they're fixed by the time they check!

### 6. Benefits

- **24/7 Monitoring**: Works even when your computer is off
- **No Token Cost**: Uses only HTTP requests, no AI/LLM tokens
- **Scalable**: Can monitor hundreds of URLs
- **Historical Data**: Keeps track of all checks for analytics
- **Real-time Alerts**: Instant notifications when URLs go down
- **Screenshot Proof**: Visual evidence of errors with timestamps

## Manual Testing

To manually trigger monitoring (for testing):

```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/monitor-urls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

## Troubleshooting

- If URLs aren't being checked, verify the cron job is running
- Check Edge Function logs in the Supabase dashboard
- Ensure RLS policies are correctly set up (migration handles this)
- Verify environment variables are set correctly
