/*
  # Fix Infinite Recursion in Profile Policies

  1. Changes
    - Drop the problematic "Admins and managers can view all profiles" policy
    - Drop the "Users can update own profile" policy (also has recursion)
    - Recreate policies without recursion
  
  2. Security
    - Users can view their own profile
    - All authenticated users can view profiles (simplified to avoid recursion)
    - Users can only update their own profile
*/

-- Drop problematic policies
DROP POLICY IF EXISTS "Admins and managers can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new SELECT policy for all authenticated users (avoids recursion)
CREATE POLICY "Authenticated users can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Recreate UPDATE policy without recursion
CREATE POLICY "Users can update own profile basic"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
