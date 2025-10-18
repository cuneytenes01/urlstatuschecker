/*
  # Create Admin Users Table

  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `password_hash` (text)
      - `created_at` (timestamptz)
      - `last_login_at` (timestamptz, nullable)

  2. Security
    - Enable RLS on `admin_users` table
    - No public access to admin_users table
    - Only service role can access this table

  3. Notes
    - This table stores admin credentials
    - Passwords are stored as hashed values
    - Used for custom admin authentication
*/

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_login_at timestamptz
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to admin_users"
  ON admin_users
  FOR ALL
  TO public
  USING (false);

INSERT INTO admin_users (username, password_hash) 
VALUES 
  ('cuneytenes01', crypt('cun123456', gen_salt('bf'))),
  ('admin', crypt('adm123', gen_salt('bf')))
ON CONFLICT (username) DO NOTHING;
