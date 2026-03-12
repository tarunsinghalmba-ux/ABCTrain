/*
  # Fix Learning Path Assignments RLS for Null/Empty Organization

  ## Overview
  Updates RLS policies on learning_path_assignments table to handle cases where user profile has null or empty organization values.

  ## Changes Made
  1. Drop and recreate INSERT policy with COALESCE for null-safe organization comparison
  2. Drop and recreate SELECT policy for admins/managers with COALESCE
  3. Drop and recreate UPDATE policy with COALESCE
  4. Drop and recreate DELETE policy with COALESCE

  ## Important Notes
  - Uses COALESCE to treat null values as empty strings for comparison
  - Ensures admins/managers with null organization can assign paths to caregivers
  - Maintains role-based access control (admin/manager only)
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins and managers can assign learning paths" ON learning_path_assignments;
DROP POLICY IF EXISTS "Admins and managers can view organization assignments" ON learning_path_assignments;
DROP POLICY IF EXISTS "Admins and managers can update path assignments" ON learning_path_assignments;
DROP POLICY IF EXISTS "Admins and managers can delete path assignments" ON learning_path_assignments;

-- Recreate INSERT policy with null-safe organization check
CREATE POLICY "Admins and managers can assign learning paths"
  ON learning_path_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
    AND assigned_by = auth.uid()
    AND caregiver_id IN (
      SELECT id FROM profiles 
      WHERE COALESCE(organization, '') = COALESCE((SELECT organization FROM profiles WHERE id = auth.uid()), '')
      AND role = 'caregiver'
    )
  );

-- Recreate SELECT policy with null-safe organization check
CREATE POLICY "Admins and managers can view organization assignments"
  ON learning_path_assignments FOR SELECT
  TO authenticated
  USING (
    caregiver_id IN (
      SELECT id FROM profiles 
      WHERE COALESCE(organization, '') = COALESCE((SELECT organization FROM profiles WHERE id = auth.uid()), '')
    )
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

-- Recreate UPDATE policy with null-safe organization check
CREATE POLICY "Admins and managers can update path assignments"
  ON learning_path_assignments FOR UPDATE
  TO authenticated
  USING (
    caregiver_id IN (
      SELECT id FROM profiles 
      WHERE COALESCE(organization, '') = COALESCE((SELECT organization FROM profiles WHERE id = auth.uid()), '')
    )
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  )
  WITH CHECK (
    caregiver_id IN (
      SELECT id FROM profiles 
      WHERE COALESCE(organization, '') = COALESCE((SELECT organization FROM profiles WHERE id = auth.uid()), '')
    )
  );

-- Recreate DELETE policy with null-safe organization check
CREATE POLICY "Admins and managers can delete path assignments"
  ON learning_path_assignments FOR DELETE
  TO authenticated
  USING (
    caregiver_id IN (
      SELECT id FROM profiles 
      WHERE COALESCE(organization, '') = COALESCE((SELECT organization FROM profiles WHERE id = auth.uid()), '')
    )
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );
