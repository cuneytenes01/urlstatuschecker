-- URL Monitoring System - Database Tables
-- Copy this entire file and run it in Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/igrbhhrmqohbmhwekvtd/sql/new

-- Create tables
CREATE TABLE IF NOT EXISTS monitored_urls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  name text,
  check_interval_minutes integer DEFAULT 2 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  last_status_code integer,
  last_check_at timestamptz,
  last_response_time_ms integer,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS url_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monitored_url_id uuid REFERENCES monitored_urls(id) ON DELETE CASCADE NOT NULL,
  status_code integer NOT NULL,
  message text NOT NULL,
  screenshot_url text,
  response_time_ms integer,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS url_check_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monitored_url_id uuid REFERENCES monitored_urls(id) ON DELETE CASCADE NOT NULL,
  status_code integer NOT NULL,
  response_time_ms integer NOT NULL,
  checked_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_monitored_urls_is_active ON monitored_urls(is_active);
CREATE INDEX IF NOT EXISTS idx_monitored_urls_last_check_at ON monitored_urls(last_check_at);
CREATE INDEX IF NOT EXISTS idx_url_alerts_monitored_url_id ON url_alerts(monitored_url_id);
CREATE INDEX IF NOT EXISTS idx_url_alerts_created_at ON url_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_url_alerts_is_read ON url_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_url_check_history_monitored_url_id ON url_check_history(monitored_url_id);
CREATE INDEX IF NOT EXISTS idx_url_check_history_checked_at ON url_check_history(checked_at DESC);

-- Enable RLS
ALTER TABLE monitored_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE url_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE url_check_history ENABLE ROW LEVEL SECURITY;

-- Create policies (allow public access)
CREATE POLICY "Public access" ON monitored_urls FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON url_alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON url_check_history FOR ALL USING (true) WITH CHECK (true);

-- Create auto-update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_monitored_urls_updated_at ON monitored_urls;
CREATE TRIGGER update_monitored_urls_updated_at
  BEFORE UPDATE ON monitored_urls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
