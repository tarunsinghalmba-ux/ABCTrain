/*
  # Create Learning Paths System

  ## Overview
  Adds learning path functionality to group multiple courses together and assign them to caregivers.

  ## 1. New Tables

  ### learning_paths
  - `id` (uuid, primary key) - Unique identifier
  - `organization` (text) - Organization name (matches profiles.organization)
  - `name` (text) - Learning path name
  - `description` (text) - Optional description of the path
  - `is_active` (boolean) - Whether path is currently active
  - `created_by` (uuid) - User who created the path
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### learning_path_courses
  - `id` (uuid, primary key) - Unique identifier
  - `learning_path_id` (uuid) - References learning_paths
  - `course_id` (uuid) - References courses
  - `sequence_order` (integer) - Order of courses in the path (0-indexed)
  - `created_at` (timestamptz) - Creation timestamp

  ### learning_path_assignments
  - `id` (uuid, primary key) - Unique identifier
  - `learning_path_id` (uuid) - References learning_paths
  - `caregiver_id` (uuid) - References profiles (caregiver)
  - `assigned_by` (uuid) - References profiles (admin/manager)
  - `assigned_at` (timestamptz) - Assignment timestamp
  - `due_date` (date) - Optional due date
  - `status` (text) - Assignment status (assigned, in_progress, completed)
  - `created_at` (timestamptz) - Creation timestamp

  ## 2. Security (Row Level Security)
  - Admins and managers can create, view, and manage learning paths in their organization
  - Caregivers can view learning paths assigned to them
  - All tables have RLS enabled with appropriate policies

  ## 3. Important Notes
  - Learning paths complement existing individual course assignments
  - Sequence order determines course display order in the path
  - Path assignments are separate from individual course enrollments
  - When a path is assigned, caregivers see all courses in the path
*/

-- Create learning_paths table
CREATE TABLE IF NOT EXISTS learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization text NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create learning_path_courses junction table
CREATE TABLE IF NOT EXISTS learning_path_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_path_id uuid NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  sequence_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(learning_path_id, course_id)
);

-- Create learning_path_assignments table
CREATE TABLE IF NOT EXISTS learning_path_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_path_id uuid NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  caregiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  due_date date,
  status text DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(learning_path_id, caregiver_id)
);

-- Enable RLS
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_assignments ENABLE ROW LEVEL SECURITY;

-- Policies for learning_paths
CREATE POLICY "Admins and managers can view organization learning paths"
  ON learning_paths FOR SELECT
  TO authenticated
  USING (
    organization = (SELECT organization FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Caregivers can view assigned learning paths"
  ON learning_paths FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT learning_path_id FROM learning_path_assignments 
      WHERE caregiver_id = auth.uid()
    )
  );

CREATE POLICY "Admins and managers can create learning paths"
  ON learning_paths FOR INSERT
  TO authenticated
  WITH CHECK (
    organization = (SELECT organization FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
    AND created_by = auth.uid()
  );

CREATE POLICY "Admins and managers can update organization learning paths"
  ON learning_paths FOR UPDATE
  TO authenticated
  USING (
    organization = (SELECT organization FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  )
  WITH CHECK (
    organization = (SELECT organization FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins and managers can delete organization learning paths"
  ON learning_paths FOR DELETE
  TO authenticated
  USING (
    organization = (SELECT organization FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

-- Policies for learning_path_courses
CREATE POLICY "Users can view courses in accessible paths"
  ON learning_path_courses FOR SELECT
  TO authenticated
  USING (
    learning_path_id IN (
      SELECT id FROM learning_paths 
      WHERE organization = (SELECT organization FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins and managers can add courses to paths"
  ON learning_path_courses FOR INSERT
  TO authenticated
  WITH CHECK (
    learning_path_id IN (
      SELECT id FROM learning_paths 
      WHERE organization = (SELECT organization FROM profiles WHERE id = auth.uid())
      AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins and managers can update path courses"
  ON learning_path_courses FOR UPDATE
  TO authenticated
  USING (
    learning_path_id IN (
      SELECT id FROM learning_paths 
      WHERE organization = (SELECT organization FROM profiles WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    learning_path_id IN (
      SELECT id FROM learning_paths 
      WHERE organization = (SELECT organization FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins and managers can remove courses from paths"
  ON learning_path_courses FOR DELETE
  TO authenticated
  USING (
    learning_path_id IN (
      SELECT id FROM learning_paths 
      WHERE organization = (SELECT organization FROM profiles WHERE id = auth.uid())
    )
  );

-- Policies for learning_path_assignments
CREATE POLICY "Admins and managers can view organization assignments"
  ON learning_path_assignments FOR SELECT
  TO authenticated
  USING (
    caregiver_id IN (
      SELECT id FROM profiles 
      WHERE organization = (SELECT organization FROM profiles WHERE id = auth.uid())
    )
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Caregivers can view their own assignments"
  ON learning_path_assignments FOR SELECT
  TO authenticated
  USING (caregiver_id = auth.uid());

CREATE POLICY "Admins and managers can assign learning paths"
  ON learning_path_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
    AND assigned_by = auth.uid()
    AND caregiver_id IN (
      SELECT id FROM profiles 
      WHERE organization = (SELECT organization FROM profiles WHERE id = auth.uid())
      AND role = 'caregiver'
    )
  );

CREATE POLICY "Admins and managers can update path assignments"
  ON learning_path_assignments FOR UPDATE
  TO authenticated
  USING (
    caregiver_id IN (
      SELECT id FROM profiles 
      WHERE organization = (SELECT organization FROM profiles WHERE id = auth.uid())
    )
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  )
  WITH CHECK (
    caregiver_id IN (
      SELECT id FROM profiles 
      WHERE organization = (SELECT organization FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins and managers can delete path assignments"
  ON learning_path_assignments FOR DELETE
  TO authenticated
  USING (
    caregiver_id IN (
      SELECT id FROM profiles 
      WHERE organization = (SELECT organization FROM profiles WHERE id = auth.uid())
    )
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_learning_paths_organization ON learning_paths(organization);
CREATE INDEX IF NOT EXISTS idx_learning_paths_created_by ON learning_paths(created_by);
CREATE INDEX IF NOT EXISTS idx_learning_path_courses_path ON learning_path_courses(learning_path_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_courses_course ON learning_path_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_assignments_path ON learning_path_assignments(learning_path_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_assignments_caregiver ON learning_path_assignments(caregiver_id);