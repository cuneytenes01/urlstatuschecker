import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://blkoznxdbjcibfxlcwrg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlncmJoaHJtcW9oYm1od2VrdnRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTg2NjY5MCwiZXhwIjoyMDc1NDQyNjkwfQ.YNf5CJy1KvIqb_qE0D64OIjvW3I8SJjPEhL5eNwxO3o';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  db: { schema: 'public' }
});

const sql = `
-- Create monitored_urls table
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

-- Create url_check_history table
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

-- Enable Row Level Security
ALTER TABLE monitored_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE url_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE url_check_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Public can view monitored URLs" ON monitored_urls;
  DROP POLICY IF EXISTS "Public can insert monitored URLs" ON monitored_urls;
  DROP POLICY IF EXISTS "Public can update monitored URLs" ON monitored_urls;
  DROP POLICY IF EXISTS "Public can delete monitored URLs" ON monitored_urls;
  DROP POLICY IF EXISTS "Public can view alerts" ON url_alerts;
  DROP POLICY IF EXISTS "Public can insert alerts" ON url_alerts;
  DROP POLICY IF EXISTS "Public can update alerts" ON url_alerts;
  DROP POLICY IF EXISTS "Public can delete alerts" ON url_alerts;
  DROP POLICY IF EXISTS "Public can view check history" ON url_check_history;
  DROP POLICY IF EXISTS "Public can insert check history" ON url_check_history;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- RLS Policies (public access for demo)
CREATE POLICY "Public can view monitored URLs"
  ON monitored_urls FOR SELECT
  USING (true);

CREATE POLICY "Public can insert monitored URLs"
  ON monitored_urls FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update monitored URLs"
  ON monitored_urls FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete monitored URLs"
  ON monitored_urls FOR DELETE
  USING (true);

CREATE POLICY "Public can view alerts"
  ON url_alerts FOR SELECT
  USING (true);

CREATE POLICY "Public can insert alerts"
  ON url_alerts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update alerts"
  ON url_alerts FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete alerts"
  ON url_alerts FOR DELETE
  USING (true);

CREATE POLICY "Public can view check history"
  ON url_check_history FOR SELECT
  USING (true);

CREATE POLICY "Public can insert check history"
  ON url_check_history FOR INSERT
  WITH CHECK (true);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $func$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_monitored_urls_updated_at ON monitored_urls;
CREATE TRIGGER update_monitored_urls_updated_at
  BEFORE UPDATE ON monitored_urls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`;

async function runMigration() {
  console.log('🚀 Starting database migration...');
  
  try {
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ';';
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: stmt });
      
      if (error) {
        console.error(`❌ Error on statement ${i + 1}:`, error.message);
      }
    }
    
    console.log('✅ Migration completed!');
    console.log('🔍 Verifying tables...');
    
    const { data, error } = await supabase
      .from('monitored_urls')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('⚠️  Tables may not be accessible yet:', error.message);
    } else {
      console.log('✅ Tables are working!');
    }
    
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  }
}

runMigration();
