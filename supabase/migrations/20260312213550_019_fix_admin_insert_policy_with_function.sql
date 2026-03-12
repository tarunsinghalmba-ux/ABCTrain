/*
  # Fix Admin/Manager Insert Policy with Security Definer Function

  1. Changes
    - Create a security definer function to check if a user is admin/manager
    - This function bypasses RLS to check the role
    - Replace the INSERT policy to use this function instead of a subquery
    - Drop the old policy first

  2. Security
    - Function is SECURITY DEFINER to bypass RLS for role checking only
    - Function only returns a boolean, no sensitive data exposed
    - Policy still restricts inserts to only authenticated admin/manager users
*/

-- Create a function to check if the current user is an admin or manager
-- SECURITY DEFINER allows it to bypass RLS
CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'manager')
  );
$$;

-- Drop the old policy
DROP POLICY IF EXISTS "Admins and managers can create caregiver profiles" ON profiles;

-- Create new policy using the security definer function
CREATE POLICY "Admins and managers can create caregiver profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_manager());
