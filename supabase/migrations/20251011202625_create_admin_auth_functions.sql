/*
  # Create Admin Authentication Functions

  1. Functions
    - `verify_admin_login` - Verifies username and password
    - `update_admin_last_login` - Updates last login timestamp

  2. Security
    - Functions are accessible to public for login
    - Uses bcrypt for password verification
*/

CREATE OR REPLACE FUNCTION verify_admin_login(p_username text, p_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM admin_users 
    WHERE username = p_username 
    AND password_hash = crypt(p_password, password_hash)
  );
END;
$$;

CREATE OR REPLACE FUNCTION update_admin_last_login(p_username text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE admin_users 
  SET last_login_at = now() 
  WHERE username = p_username;
END;
$$;
