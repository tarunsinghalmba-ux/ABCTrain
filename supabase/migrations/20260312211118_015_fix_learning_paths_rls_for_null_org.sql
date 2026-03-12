/*
  # Fix Learning Paths RLS for Null/Empty Organization

  ## Overview
  Updates RLS policies on learning_paths table to handle cases where user profile has null or empty organization values.

  ## Changes Made
  1. Drop and recreate INSERT policy to use COALESCE for null-safe comparison
  2. Drop and recreate SELECT policy for admins/managers to use COALESCE
  3. Drop and recreate UPDATE policy to use COALESCE
  4. Drop and recreate DELETE policy to use COALESCE

  ## Important Notes
  - Uses COALESCE to treat null values as empty strings for comparison
  - Ensures users with null organization can still create and manage learning paths
  - Maintains role-based access control (admin/manager only)
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins and managers can create learning paths" ON learning_paths;
DROP POLICY IF EXISTS "Admins and managers can view organization learning paths" ON learning_paths;
DROP POLICY IF EXISTS "Admins and managers can update organization learning paths" ON learning_paths;
DROP POLICY IF EXISTS "Admins and managers can delete organization learning paths" ON learning_paths;

-- Recreate INSERT policy with null-safe organization check
CREATE POLICY "Admins and managers can create learning paths"
  ON learning_paths FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(organization, '') = COALESCE((SELECT organization FROM profiles WHERE id = auth.uid()), '')
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
    AND created_by = auth.uid()
  );

-- Recreate SELECT policy with null-safe organization check
CREATE POLICY "Admins and managers can view organization learning paths"
  ON learning_paths FOR SELECT
  TO authenticated
  USING (
    COALESCE(organization, '') = COALESCE((SELECT organization FROM profiles WHERE id = auth.uid()), '')
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

-- Recreate UPDATE policy with null-safe organization check
CREATE POLICY "Admins and managers can update organization learning paths"
  ON learning_paths FOR UPDATE
  TO authenticated
  USING (
    COALESCE(organization, '') = COALESCE((SELECT organization FROM profiles WHERE id = auth.uid()), '')
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  )
  WITH CHECK (
    COALESCE(organization, '') = COALESCE((SELECT organization FROM profiles WHERE id = auth.uid()), '')
  );

-- Recreate DELETE policy with null-safe organization check
CREATE POLICY "Admins and managers can delete organization learning paths"
  ON learning_paths FOR DELETE
  TO authenticated
  USING (
    COALESCE(organization, '') = COALESCE((SELECT organization FROM profiles WHERE id = auth.uid()), '')
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );
