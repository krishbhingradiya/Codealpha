-- ============================================
-- ShortLink Pro — Email Existence Check
-- ============================================
-- This function allows the frontend to check if an email
-- is already registered before allowing signup.
-- Run this in Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.check_email_exists(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE email = lower(check_email)
  );
END;
$$;

-- Grant access so the frontend Supabase client can call it
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO authenticated;
