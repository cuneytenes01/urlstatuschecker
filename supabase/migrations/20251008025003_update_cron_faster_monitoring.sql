/*
  # Update Cron Job for Faster URL Monitoring
  
  1. Changes
    - Update cron schedule from every 2 minutes to every 30 seconds
    - This will scan all URLs much faster
    - With 607 URLs and 50 per batch: ~13 batches × 30 seconds = ~6.5 minutes for full scan
  
  2. Notes
    - More frequent checks ensure all URLs are monitored
    - Better alert coverage
*/

-- Schedule the monitoring job to run every 30 seconds
SELECT cron.schedule(
  'monitor-urls-job',
  '*/30 * * * * *',
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
