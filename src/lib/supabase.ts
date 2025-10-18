import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface MonitoredUrlDB {
  id: string;
  user_id: string | null;
  url: string;
  name: string | null;
  check_interval_minutes: number;
  is_active: boolean;
  last_status_code: number | null;
  last_check_at: string | null;
  last_response_time_ms: number | null;
  created_at: string;
  updated_at: string;
}

export interface UrlAlertDB {
  id: string;
  monitored_url_id: string;
  status_code: number;
  message: string;
  screenshot_url: string | null;
  response_time_ms: number | null;
  is_read: boolean;
  created_at: string;
}

export interface UrlCheckHistoryDB {
  id: string;
  monitored_url_id: string;
  status_code: number;
  response_time_ms: number;
  checked_at: string;
}
