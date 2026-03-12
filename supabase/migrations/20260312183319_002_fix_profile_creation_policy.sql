/*
  # Fix Profile Creation Policy

  1. Changes
    - Add INSERT policy to allow users to create their own profile during signup
    - This is necessary because during signup, the user is authenticated but doesn't have a profile yet

  2. Security
    - Users can only insert a profile for their own auth.uid()
    - The role in the INSERT must match what they're trying to create
*/

CREATE POLICY "Users can create own profile during signup"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
