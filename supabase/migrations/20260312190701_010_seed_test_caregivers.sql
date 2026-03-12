/*
  # Seed Test Caregivers

  ## Overview
  Note: This migration adds test caregiver data directly to the profiles table.
  In production, these would be created through the signup flow which creates auth.users first.
  
  ## Test Data
  Creates 5 test caregivers with varying compliance statuses.
  These use special test UUIDs that won't conflict with real auth users.
*/

-- Note: Since profiles requires auth.users FK, we'll create a helper to allow test data
-- Temporarily disable the FK constraint for seeding
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Insert test caregivers with fixed test UUIDs
INSERT INTO profiles (
  id, email, first_name, last_name, role, organization, is_active,
  orientation_complete, ane_training_complete, annual_ce_hours_current_year,
  last_compliance_review_date, compliance_status
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'sarah.johnson+test@example.com',
    'Sarah',
    'Johnson',
    'caregiver',
    'Home Care Agency',
    true,
    true,
    true,
    8,
    now() - interval '5 days',
    'compliant'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'michael.chen+test@example.com',
    'Michael',
    'Chen',
    'caregiver',
    'Home Care Agency',
    true,
    true,
    false,
    0,
    now() - interval '2 days',
    'in_progress'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'emily.rodriguez+test@example.com',
    'Emily',
    'Rodriguez',
    'caregiver',
    'Home Care Agency',
    true,
    true,
    true,
    4,
    now() - interval '120 days',
    'overdue'
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'david.thompson+test@example.com',
    'David',
    'Thompson',
    'caregiver',
    'Home Care Agency',
    true,
    true,
    true,
    6,
    now() - interval '15 days',
    'in_progress'
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    'lisa.anderson+test@example.com',
    'Lisa',
    'Anderson',
    'caregiver',
    'Home Care Agency',
    true,
    false,
    false,
    0,
    now() - interval '1 day',
    'in_progress'
  )
ON CONFLICT (id) DO NOTHING;

-- Re-add the FK constraint but make it NOT VALID to allow existing test data
ALTER TABLE profiles
  ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
  NOT VALID;

-- Seed compliance status for test caregivers
DO $$
DECLARE
  orientation_req_id uuid;
  ane_req_id uuid;
  infection_req_id uuid;
  person_centered_req_id uuid;
  adl_req_id uuid;
BEGIN
  -- Get requirement IDs
  SELECT id INTO orientation_req_id FROM compliance_requirements WHERE requirement_code = 'ATTENDANT_ORIENTATION';
  SELECT id INTO ane_req_id FROM compliance_requirements WHERE requirement_code = 'ANE_REPORTING';
  SELECT id INTO infection_req_id FROM compliance_requirements WHERE requirement_code = 'INFECTION_CONTROL';
  SELECT id INTO person_centered_req_id FROM compliance_requirements WHERE requirement_code = 'PERSON_CENTERED_CARE';
  SELECT id INTO adl_req_id FROM compliance_requirements WHERE requirement_code = 'ADL_PERSONAL_CARE';

  -- Sarah Johnson (Fully Compliant) - all requirements complete
  INSERT INTO caregiver_compliance_status (profile_id, requirement_id, is_complete, completion_date, ce_hours_earned)
  VALUES
    ('00000000-0000-0000-0000-000000000001', orientation_req_id, true, now() - interval '90 days', 0),
    ('00000000-0000-0000-0000-000000000001', ane_req_id, true, now() - interval '85 days', 0),
    ('00000000-0000-0000-0000-000000000001', infection_req_id, true, now() - interval '80 days', 0),
    ('00000000-0000-0000-0000-000000000001', person_centered_req_id, true, now() - interval '75 days', 0),
    ('00000000-0000-0000-0000-000000000001', adl_req_id, true, now() - interval '70 days', 0)
  ON CONFLICT (profile_id, requirement_id) DO NOTHING;

  -- Michael Chen (In Progress) - orientation complete, rest pending
  INSERT INTO caregiver_compliance_status (profile_id, requirement_id, is_complete, completion_date, ce_hours_earned)
  VALUES
    ('00000000-0000-0000-0000-000000000002', orientation_req_id, true, now() - interval '7 days', 0),
    ('00000000-0000-0000-0000-000000000002', ane_req_id, false, null, 0),
    ('00000000-0000-0000-0000-000000000002', infection_req_id, false, null, 0),
    ('00000000-0000-0000-0000-000000000002', person_centered_req_id, false, null, 0),
    ('00000000-0000-0000-0000-000000000002', adl_req_id, false, null, 0)
  ON CONFLICT (profile_id, requirement_id) DO NOTHING;

  -- Emily Rodriguez (Overdue) - one requirement has expired
  INSERT INTO caregiver_compliance_status (profile_id, requirement_id, is_complete, completion_date, expiration_date, ce_hours_earned)
  VALUES
    ('00000000-0000-0000-0000-000000000003', orientation_req_id, true, now() - interval '365 days', null, 0),
    ('00000000-0000-0000-0000-000000000003', ane_req_id, true, now() - interval '360 days', null, 0),
    ('00000000-0000-0000-0000-000000000003', infection_req_id, true, now() - interval '180 days', now() - interval '10 days', 0),
    ('00000000-0000-0000-0000-000000000003', person_centered_req_id, true, now() - interval '350 days', null, 0),
    ('00000000-0000-0000-0000-000000000003', adl_req_id, true, now() - interval '340 days', null, 0)
  ON CONFLICT (profile_id, requirement_id) DO NOTHING;

  -- David Thompson (Partially Complete) - some requirements done
  INSERT INTO caregiver_compliance_status (profile_id, requirement_id, is_complete, completion_date, ce_hours_earned)
  VALUES
    ('00000000-0000-0000-0000-000000000004', orientation_req_id, true, now() - interval '60 days', 0),
    ('00000000-0000-0000-0000-000000000004', ane_req_id, true, now() - interval '55 days', 0),
    ('00000000-0000-0000-0000-000000000004', infection_req_id, true, now() - interval '50 days', 0),
    ('00000000-0000-0000-0000-000000000004', person_centered_req_id, false, null, 0),
    ('00000000-0000-0000-0000-000000000004', adl_req_id, false, null, 0)
  ON CONFLICT (profile_id, requirement_id) DO NOTHING;

  -- Lisa Anderson (Just Started) - all requirements pending
  INSERT INTO caregiver_compliance_status (profile_id, requirement_id, is_complete, completion_date, ce_hours_earned)
  VALUES
    ('00000000-0000-0000-0000-000000000005', orientation_req_id, false, null, 0),
    ('00000000-0000-0000-0000-000000000005', ane_req_id, false, null, 0),
    ('00000000-0000-0000-0000-000000000005', infection_req_id, false, null, 0),
    ('00000000-0000-0000-0000-000000000005', person_centered_req_id, false, null, 0),
    ('00000000-0000-0000-0000-000000000005', adl_req_id, false, null, 0)
  ON CONFLICT (profile_id, requirement_id) DO NOTHING;

END $$;
