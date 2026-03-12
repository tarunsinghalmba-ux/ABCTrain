/*
  # Add Missing Profile and Agency Settings Fields

  ## Overview
  Adds missing fields to support complete caregiver tracking and agency management.

  ## 1. Schema Updates

  ### profiles table
  - Add `hire_date` (date) - Caregiver hire date for tenure tracking
  - Add `phone` (text) - Contact phone number

  ### agency_settings table
  - Add `license_number` (text) - Agency license number for compliance documentation
  - Add `admin_email` (text) - Primary admin contact email
  - Add `ce_hours_required_annual` (integer) - Annual CE hours requirement (default 20 for Texas)

  ### course_completions table
  - Add `ce_hours_earned` (numeric) - CE hours earned for this completion

  ## 2. Important Notes
  - All fields are nullable to support existing data
  - Default CE hours requirement set to 20 (Texas HCSSA standard)
  - Phone format is flexible text to support various formats
*/

-- Add hire_date and phone to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'hire_date'
  ) THEN
    ALTER TABLE profiles ADD COLUMN hire_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone text;
  END IF;
END $$;

-- Add agency license and admin info to agency_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agency_settings' AND column_name = 'license_number'
  ) THEN
    ALTER TABLE agency_settings ADD COLUMN license_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agency_settings' AND column_name = 'admin_email'
  ) THEN
    ALTER TABLE agency_settings ADD COLUMN admin_email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agency_settings' AND column_name = 'ce_hours_required_annual'
  ) THEN
    ALTER TABLE agency_settings ADD COLUMN ce_hours_required_annual integer DEFAULT 20;
  END IF;
END $$;

-- Add ce_hours_earned to course_completions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_completions' AND column_name = 'ce_hours_earned'
  ) THEN
    ALTER TABLE course_completions ADD COLUMN ce_hours_earned numeric(5,2);
  END IF;
END $$;

-- Create index for hire_date for quick lookups
CREATE INDEX IF NOT EXISTS idx_profiles_hire_date ON profiles(hire_date);
