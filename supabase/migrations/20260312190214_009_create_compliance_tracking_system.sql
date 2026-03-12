/*
  # Create Compliance Tracking System

  ## Overview
  Implements comprehensive Texas HCSSA PAS compliance tracking per caregiver.

  ## 1. New Tables

  ### compliance_requirements
  Master table defining all Texas HCSSA PAS compliance requirements:
  - `id` (uuid, primary key)
  - `requirement_code` (text, unique) - Short identifier (e.g., 'PRESURVEY_CBT')
  - `requirement_name` (text) - Display name
  - `regulation_reference` (text) - Regulation citation (e.g., '26 TAC §558.13(a)')
  - `required_for_role` (text) - admin, caregiver, or both
  - `is_annual_requirement` (boolean) - Requires annual renewal
  - `required_ce_hours` (numeric) - CE hours required (if applicable)
  - `linked_course_ids` (uuid[]) - Array of course IDs that satisfy this requirement
  - `description` (text) - Detailed description
  - `is_active` (boolean)
  - `created_at`, `updated_at` (timestamptz)

  ### caregiver_compliance_status
  Tracks compliance status for each caregiver:
  - `id` (uuid, primary key)
  - `profile_id` (uuid, foreign key to profiles)
  - `requirement_id` (uuid, foreign key to compliance_requirements)
  - `is_complete` (boolean) - Current completion status
  - `completion_date` (timestamptz) - When requirement was satisfied
  - `expiration_date` (timestamptz) - For annual requirements
  - `ce_hours_earned` (numeric) - CE hours accumulated
  - `notes` (text) - Additional notes
  - `last_reviewed_date` (timestamptz)
  - `created_at`, `updated_at` (timestamptz)
  - Unique constraint on (profile_id, requirement_id)

  ### compliance_audit_log
  Audit trail for compliance changes:
  - `id` (uuid, primary key)
  - `profile_id` (uuid, foreign key to profiles)
  - `requirement_id` (uuid, foreign key to compliance_requirements)
  - `action` (text) - completed, expired, reviewed, etc.
  - `performed_by` (uuid, foreign key to profiles)
  - `notes` (text)
  - `created_at` (timestamptz)

  ## 2. Profile Table Updates
  Adds compliance summary fields to profiles table:
  - `orientation_complete` (boolean)
  - `ane_training_complete` (boolean)
  - `annual_ce_hours_current_year` (numeric)
  - `last_compliance_review_date` (timestamptz)
  - `compliance_status` (text) - compliant, in_progress, overdue

  ## 3. Security
  - Enable RLS on all compliance tables
  - Admins can view and manage all compliance records
  - Caregivers can view their own compliance status only
  - Audit logs are read-only for non-admins

  ## 4. Seed Data
  Populates compliance_requirements with Texas HCSSA PAS requirements
*/

-- Create compliance_requirements table
CREATE TABLE IF NOT EXISTS compliance_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_code text UNIQUE NOT NULL,
  requirement_name text NOT NULL,
  regulation_reference text NOT NULL,
  required_for_role text NOT NULL CHECK (required_for_role IN ('admin', 'caregiver', 'both')),
  is_annual_requirement boolean DEFAULT false,
  required_ce_hours numeric DEFAULT 0,
  linked_course_ids uuid[] DEFAULT '{}',
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create caregiver_compliance_status table
CREATE TABLE IF NOT EXISTS caregiver_compliance_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requirement_id uuid NOT NULL REFERENCES compliance_requirements(id) ON DELETE CASCADE,
  is_complete boolean DEFAULT false,
  completion_date timestamptz,
  expiration_date timestamptz,
  ce_hours_earned numeric DEFAULT 0,
  notes text,
  last_reviewed_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, requirement_id)
);

-- Create compliance_audit_log table
CREATE TABLE IF NOT EXISTS compliance_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requirement_id uuid REFERENCES compliance_requirements(id) ON DELETE SET NULL,
  action text NOT NULL,
  performed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Add compliance summary fields to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'orientation_complete'
  ) THEN
    ALTER TABLE profiles ADD COLUMN orientation_complete boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'ane_training_complete'
  ) THEN
    ALTER TABLE profiles ADD COLUMN ane_training_complete boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'annual_ce_hours_current_year'
  ) THEN
    ALTER TABLE profiles ADD COLUMN annual_ce_hours_current_year numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_compliance_review_date'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_compliance_review_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'compliance_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN compliance_status text DEFAULT 'in_progress' CHECK (compliance_status IN ('compliant', 'in_progress', 'overdue'));
  END IF;
END $$;

-- Enable RLS
ALTER TABLE compliance_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregiver_compliance_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audit_log ENABLE ROW LEVEL SECURITY;

-- Policies for compliance_requirements
CREATE POLICY "Anyone authenticated can view compliance requirements"
  ON compliance_requirements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage compliance requirements"
  ON compliance_requirements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policies for caregiver_compliance_status
CREATE POLICY "Admins can view all compliance status"
  ON caregiver_compliance_status FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Caregivers can view own compliance status"
  ON caregiver_compliance_status FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Admins can manage compliance status"
  ON caregiver_compliance_status FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update compliance status"
  ON caregiver_compliance_status FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete compliance status"
  ON caregiver_compliance_status FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policies for compliance_audit_log
CREATE POLICY "Admins can view all audit logs"
  ON compliance_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Caregivers can view own audit logs"
  ON compliance_audit_log FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Admins can create audit logs"
  ON compliance_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_caregiver_compliance_profile ON caregiver_compliance_status(profile_id);
CREATE INDEX IF NOT EXISTS idx_caregiver_compliance_requirement ON caregiver_compliance_status(requirement_id);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_profile ON compliance_audit_log(profile_id);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_performed_by ON compliance_audit_log(performed_by);

-- Seed Texas HCSSA PAS compliance requirements
INSERT INTO compliance_requirements (
  requirement_code,
  requirement_name,
  regulation_reference,
  required_for_role,
  is_annual_requirement,
  required_ce_hours,
  description
) VALUES
(
  'PRESURVEY_CBT',
  'Presurvey CBT (Admin only)',
  '26 TAC §558.13(a)',
  'admin',
  false,
  0,
  'Complete HCSSA Presurvey Computer-Based Training Modules 1-3. Required for administrators before agency operation.'
),
(
  'ANE_REPORTING',
  'ANE Reporting Training',
  '26 TAC §558.250',
  'both',
  false,
  0,
  'Abuse, Neglect, and Exploitation (ANE) reporting training. Required for all staff members.'
),
(
  'INFECTION_CONTROL',
  'Infection Control',
  '26 TAC §558',
  'caregiver',
  false,
  0,
  'Infection control practices, hand hygiene, PPE usage, and disease transmission prevention.'
),
(
  'ATTENDANT_ORIENTATION',
  'Attendant Orientation',
  '26 TAC §558.404',
  'caregiver',
  false,
  0,
  'Core skills orientation training for new caregivers including introduction to caregiving, ADL assistance, and personal care tasks.'
),
(
  'ANNUAL_CE_ADMIN',
  'Annual CE (Admin - 12 hrs)',
  '26 TAC §558.259–260',
  'admin',
  true,
  12,
  'Annual continuing education requirement for administrators. Minimum 12 CE hours per year.'
),
(
  'PERSON_CENTERED_CARE',
  'Person-Centered Care',
  '26 TAC §558',
  'both',
  false,
  0,
  'Trauma-informed, person-centered care approach training. Required for all staff.'
),
(
  'ADL_PERSONAL_CARE',
  'ADL / Personal Care Tasks',
  '26 TAC §558.404(f)',
  'caregiver',
  false,
  0,
  'Activities of Daily Living (ADL) assistance and personal care tasks including safe patient handling, lifting, and transferring.'
)
ON CONFLICT (requirement_code) DO NOTHING;
