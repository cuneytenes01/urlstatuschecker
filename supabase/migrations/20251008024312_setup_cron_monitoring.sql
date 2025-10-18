/*
  # Setup Cron Job for URL Monitoring
  
  1. Enable Extensions
    - Enable pg_cron extension for scheduled jobs
    - Enable pg_net extension for HTTP requests
  
  2. Create Cron Job
    - Schedule monitor-urls function to run every 2 minutes
    - Job will automatically check all active URLs
  
  3. Notes
    - Cron job runs in UTC timezone
    - Job ID will be stored for future reference
*/

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule the monitoring job to run every 2 minutes
SELECT cron.schedule(
  'monitor-urls-job',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/monitor-urls',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    )
  );
  $$
);
