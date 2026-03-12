/*
  # Add Organization Settings Fields

  1. Changes
    - Add address, website, phone, contact name and email fields to agency_settings table
    - These fields allow agencies to store their complete organizational information
  
  2. New Fields
    - `address` (text) - Physical address of the organization
    - `website` (text) - Organization website URL
    - `phone` (text) - Organization phone number
    - `contact_name` (text) - Main contact person name
    - `contact_email` (text) - Main contact email address
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agency_settings' AND column_name = 'address'
  ) THEN
    ALTER TABLE agency_settings ADD COLUMN address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agency_settings' AND column_name = 'website'
  ) THEN
    ALTER TABLE agency_settings ADD COLUMN website text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agency_settings' AND column_name = 'phone'
  ) THEN
    ALTER TABLE agency_settings ADD COLUMN phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agency_settings' AND column_name = 'contact_name'
  ) THEN
    ALTER TABLE agency_settings ADD COLUMN contact_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agency_settings' AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE agency_settings ADD COLUMN contact_email text;
  END IF;
END $$;
