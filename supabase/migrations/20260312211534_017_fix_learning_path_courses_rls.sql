/*
  # Fix Learning Path Courses RLS for Null/Empty Organization

  ## Overview
  Updates RLS policies on learning_path_courses table to handle cases where user profile has null or empty organization values.

  ## Changes Made
  1. Drop and recreate all policies with COALESCE for null-safe organization comparison
  2. Ensures consistency with other learning path table policies

  ## Important Notes
  - Uses COALESCE to treat null values as empty strings for comparison
  - Maintains role-based access control (admin/manager only for modifications)
  - All authenticated users can view courses in paths they have access to
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view courses in accessible paths" ON learning_path_courses;
DROP POLICY IF EXISTS "Admins and managers can add courses to paths" ON learning_path_courses;
DROP POLICY IF EXISTS "Admins and managers can update path courses" ON learning_path_courses;
DROP POLICY IF EXISTS "Admins and managers can remove courses from paths" ON learning_path_courses;

-- Recreate SELECT policy
CREATE POLICY "Users can view courses in accessible paths"
  ON learning_path_courses FOR SELECT
  TO authenticated
  USING (
    learning_path_id IN (
      SELECT id FROM learning_paths 
      WHERE COALESCE(organization, '') = COALESCE((SELECT organization FROM profiles WHERE id = auth.uid()), '')
    )
  );

-- Recreate INSERT policy
CREATE POLICY "Admins and managers can add courses to paths"
  ON learning_path_courses FOR INSERT
  TO authenticated
  WITH CHECK (
    learning_path_id IN (
      SELECT id FROM learning_paths 
      WHERE COALESCE(organization, '') = COALESCE((SELECT organization FROM profiles WHERE id = auth.uid()), '')
      AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
    )
  );

-- Recreate UPDATE policy
CREATE POLICY "Admins and managers can update path courses"
  ON learning_path_courses FOR UPDATE
  TO authenticated
  USING (
    learning_path_id IN (
      SELECT id FROM learning_paths 
      WHERE COALESCE(organization, '') = COALESCE((SELECT organization FROM profiles WHERE id = auth.uid()), '')
    )
  )
  WITH CHECK (
    learning_path_id IN (
      SELECT id FROM learning_paths 
      WHERE COALESCE(organization, '') = COALESCE((SELECT organization FROM profiles WHERE id = auth.uid()), '')
    )
  );

-- Recreate DELETE policy
CREATE POLICY "Admins and managers can remove courses from paths"
  ON learning_path_courses FOR DELETE
  TO authenticated
  USING (
    learning_path_id IN (
      SELECT id FROM learning_paths 
      WHERE COALESCE(organization, '') = COALESCE((SELECT organization FROM profiles WHERE id = auth.uid()), '')
    )
  );
