/*
  # PAS Training Management System - Core Tables

  1. New Tables
    - `profiles`: User profiles with role information (admin/manager/caregiver)
    - `courses`: Course catalog with compliance tags and metadata
    - `course_assignments`: Track which courses are assigned to caregivers
    - `course_completions`: Track caregiver progress and completion status
    - `compliance_records`: Audit trail for compliance reporting

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Ensure caregivers can only access their own data
    - Admins/managers can access all data related to their organization

  3. Notable Design Decisions
    - Roles stored in profiles table for flexible access control
    - Course completion tracks certificate uploads and dates
    - Compliance records maintained as audit trail for HHSC requirements
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'caregiver')),
  organization text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins and managers can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL,
  estimated_duration_minutes integer,
  delivery_format text NOT NULL CHECK (delivery_format IN ('external_link', 'embedded_video', 'pdf')),
  source_provider text,
  external_url text,
  compliance_tag text,
  regulation_reference text,
  is_required boolean DEFAULT false,
  ce_hours numeric(5,2),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view active courses"
  ON courses FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins and managers can manage courses"
  ON courses FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE TABLE IF NOT EXISTS course_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses ON DELETE CASCADE,
  caregiver_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  assigned_by_id uuid NOT NULL REFERENCES profiles ON DELETE SET NULL,
  due_date date NOT NULL,
  assignment_type text CHECK (assignment_type IN ('individual', 'group')) DEFAULT 'individual',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(course_id, caregiver_id)
);

ALTER TABLE course_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Caregivers can view their own assignments"
  ON course_assignments FOR SELECT
  TO authenticated
  USING (
    caregiver_id = auth.uid() OR
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Admins and managers can manage assignments"
  ON course_assignments FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE TABLE IF NOT EXISTS course_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES course_assignments ON DELETE CASCADE,
  caregiver_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses ON DELETE CASCADE,
  completion_date date,
  certificate_url text,
  certificate_filename text,
  is_verified boolean DEFAULT false,
  verified_by_id uuid REFERENCES profiles ON DELETE SET NULL,
  verification_date timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE course_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Caregivers can view their own completions"
  ON course_completions FOR SELECT
  TO authenticated
  USING (
    caregiver_id = auth.uid() OR
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Caregivers can create and update own completions"
  ON course_completions FOR INSERT
  TO authenticated
  WITH CHECK (caregiver_id = auth.uid());

CREATE POLICY "Caregivers can update own completions"
  ON course_completions FOR UPDATE
  TO authenticated
  USING (caregiver_id = auth.uid())
  WITH CHECK (caregiver_id = auth.uid());

CREATE POLICY "Admins and managers can verify completions"
  ON course_completions FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE TABLE IF NOT EXISTS compliance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  record_type text NOT NULL CHECK (record_type IN ('completion', 'overdue', 'verification', 'export')),
  course_id uuid REFERENCES courses ON DELETE SET NULL,
  action_by_id uuid REFERENCES profiles ON DELETE SET NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE compliance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and managers can view compliance records"
  ON compliance_records FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Admins and managers can create compliance records"
  ON compliance_records FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_courses_is_active ON courses(is_active);
CREATE INDEX idx_course_assignments_caregiver ON course_assignments(caregiver_id);
CREATE INDEX idx_course_assignments_due_date ON course_assignments(due_date);
CREATE INDEX idx_course_completions_caregiver ON course_completions(caregiver_id);
CREATE INDEX idx_compliance_records_caregiver ON compliance_records(caregiver_id);
