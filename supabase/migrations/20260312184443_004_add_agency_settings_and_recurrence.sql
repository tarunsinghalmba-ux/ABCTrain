/*
  # Agency Settings and Course Recurrence

  ## Overview
  Adds agency settings table and recurrence tracking for courses that must be repeated periodically.

  ## 1. New Tables

  ### agency_settings
  - `id` (uuid, primary key) - Single row settings table
  - `agency_name` (text) - Agency name
  - `compliance_warning_days` (integer) - Days before due date to show warning
  - `notification_enabled` (boolean) - Enable/disable notifications
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## 2. Schema Updates

  ### courses table
  - Add `recurrence_months` (integer) - How often course must be repeated (null = one-time)

  ## 3. Security (Row Level Security)

  ### agency_settings
  - Admins and managers can view and update settings
  - Caregivers can view settings (read-only)

  ## 4. Important Notes
  - Default agency settings are inserted automatically
  - Recurrence_months null means one-time course, otherwise specifies repeat interval
*/

-- Add recurrence tracking to courses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'recurrence_months'
  ) THEN
    ALTER TABLE courses ADD COLUMN recurrence_months integer;
  END IF;
END $$;

-- Create agency_settings table (single row)
CREATE TABLE IF NOT EXISTS agency_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_name text DEFAULT 'Healthcare Agency',
  compliance_warning_days integer DEFAULT 30,
  notification_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default agency settings if table is empty
INSERT INTO agency_settings (agency_name, compliance_warning_days, notification_enabled)
SELECT 'Healthcare Agency', 30, true
WHERE NOT EXISTS (SELECT 1 FROM agency_settings);

-- Enable RLS on agency_settings
ALTER TABLE agency_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agency_settings table
CREATE POLICY "Admins and managers can view settings"
  ON agency_settings FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Caregivers can view settings"
  ON agency_settings FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'caregiver'
  );

CREATE POLICY "Admins and managers can update settings"
  ON agency_settings FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );