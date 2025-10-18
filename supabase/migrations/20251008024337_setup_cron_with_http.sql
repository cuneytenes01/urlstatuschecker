/*
  # Setup Cron Job for URL Monitoring with HTTP Extension
  
  1. Enable Extensions
    - Enable http extension for making HTTP requests
  
  2. Create Cron Job
    - Schedule monitor-urls function to run every 2 minutes using http extension
    - Calls the edge function directly
  
  3. Notes
    - Cron job runs in UTC timezone
    - Uses http extension to call the edge function
*/

-- Enable http extension if not already enabled
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Schedule the monitoring job to run every 2 minutes
SELECT cron.schedule(
  'monitor-urls-job',
  '*/2 * * * *',
  $$
  SELECT extensions.http_post(
    'https://hqtzvbxqsjzjxwkwnfan.supabase.co/functions/v1/monitor-urls',
    '{}',
    'application/json',
    ARRAY[
      extensions.http_header('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxdHp2Ynhxc2p6anh3a3duZmFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NjI2OTIsImV4cCI6MjA3NTQzODY5Mn0.GuX3vb-4M2W6g0l3QM7Dhp8PVkjv2amgilb-_TXyEog')
    ]
  );
  $$
);
