/*
  # Add admin update policy for profiles

  1. Changes
    - Add policy allowing admins and managers to update any profile
    - This enables user management functionality where admins can activate/deactivate users

  2. Security
    - Only authenticated users with admin or manager role can update profiles
    - Uses existing is_admin_or_manager() function for authorization
*/

CREATE POLICY "Admins and managers can update profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());
