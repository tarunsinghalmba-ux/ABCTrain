/*
  # Allow Admins and Managers to Create Caregiver Profiles

  1. Changes
    - Add INSERT policy to allow admins and managers to create caregiver profiles
    - This enables the admin interface to create new caregivers without authentication conflicts

  2. Security
    - Only users with 'admin' or 'manager' roles can create new profiles
    - This policy works alongside the existing self-signup policy for users
*/

CREATE POLICY "Admins and managers can create caregiver profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );
