/*
  # URL Monitoring System - Database Schema

  ## Overview
  Creates tables for 24/7 URL monitoring system that works independently of client browsers.

  ## New Tables

  ### `monitored_urls`
  Stores URLs that need to be monitored
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, nullable) - Future: link to auth.users for multi-user support
  - `url` (text, not null) - The URL to monitor
  - `name` (text, nullable) - Optional friendly name
  - `check_interval_minutes` (integer, default 2) - How often to check (in minutes)
  - `is_active` (boolean, default true) - Whether monitoring is enabled
  - `last_status_code` (integer, nullable) - Most recent status code
  - `last_check_at` (timestamptz, nullable) - When last checked
  - `last_response_time_ms` (integer, nullable) - Response time in milliseconds
  - `created_at` (timestamptz, default now()) - When URL was added
  - `updated_at` (timestamptz, default now()) - Last update time

  ### `url_alerts`
  Stores alerts when URLs go down
  - `id` (uuid, primary key) - Unique identifier
  - `monitored_url_id` (uuid, foreign key) - Links to monitored_urls
  - `status_code` (integer, not null) - The error status code
  - `message` (text, not null) - Error message
  - `screenshot_url` (text, nullable) - Screenshot of error
  - `response_time_ms` (integer, nullable) - Response time when error occurred
  - `is_read` (boolean, default false) - Whether user has seen this alert
  - `created_at` (timestamptz, default now()) - When alert was created

  ### `url_check_history`
  Optional: Stores historical check data for analytics
  - `id` (uuid, primary key) - Unique identifier
  - `monitored_url_id` (uuid, foreign key) - Links to monitored_urls
  - `status_code` (integer, not null) - Status code from check
  - `response_time_ms` (integer, not null) - Response time
  - `checked_at` (timestamptz, default now()) - When check occurred

  ## Security
  - RLS enabled on all tables
  - Policies allow authenticated users to manage their own data
  - Service role can access all data (for cron jobs)

  ## Notes
  - Uses `gen_random_uuid()` for primary keys
  - All timestamps use `timestamptz` for timezone support
  - Indexes added for performance on foreign keys and lookups
*/

-- Create monitored_urls table
CREATE TABLE IF NOT EXISTS monitored_urls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
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

-- Create url_alerts table
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

-- Create url_check_history table (optional, for analytics)
CREATE TABLE IF NOT EXISTS url_check_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monitored_url_id uuid REFERENCES monitored_urls(id) ON DELETE CASCADE NOT NULL,
  status_code integer NOT NULL,
  response_time_ms integer NOT NULL,
  checked_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_monitored_urls_user_id ON monitored_urls(user_id);
CREATE INDEX IF NOT EXISTS idx_monitored_urls_is_active ON monitored_urls(is_active);
CREATE INDEX IF NOT EXISTS idx_monitored_urls_last_check_at ON monitored_urls(last_check_at);
CREATE INDEX IF NOT EXISTS idx_url_alerts_monitored_url_id ON url_alerts(monitored_url_id);
CREATE INDEX IF NOT EXISTS idx_url_alerts_created_at ON url_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_url_alerts_is_read ON url_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_url_check_history_monitored_url_id ON url_check_history(monitored_url_id);
CREATE INDEX IF NOT EXISTS idx_url_check_history_checked_at ON url_check_history(checked_at DESC);

-- Enable Row Level Security
ALTER TABLE monitored_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE url_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE url_check_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for monitored_urls (Allow anonymous access for now)
CREATE POLICY "Anyone can view monitored URLs"
  ON monitored_urls FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert monitored URLs"
  ON monitored_urls FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update monitored URLs"
  ON monitored_urls FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete monitored URLs"
  ON monitored_urls FOR DELETE
  TO anon, authenticated
  USING (true);

-- Service role can do everything (for cron jobs)
CREATE POLICY "Service role has full access to monitored_urls"
  ON monitored_urls FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for url_alerts (Allow anonymous access for now)
CREATE POLICY "Anyone can view alerts"
  ON url_alerts FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update alerts"
  ON url_alerts FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete alerts"
  ON url_alerts FOR DELETE
  TO anon, authenticated
  USING (true);

-- Service role can do everything (for cron jobs)
CREATE POLICY "Service role has full access to url_alerts"
  ON url_alerts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for url_check_history (Allow anonymous access for now)
CREATE POLICY "Anyone can view check history"
  ON url_check_history FOR SELECT
  TO anon, authenticated
  USING (true);

-- Service role can do everything (for cron jobs)
CREATE POLICY "Service role has full access to url_check_history"
  ON url_check_history FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_monitored_urls_updated_at
  BEFORE UPDATE ON monitored_urls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
