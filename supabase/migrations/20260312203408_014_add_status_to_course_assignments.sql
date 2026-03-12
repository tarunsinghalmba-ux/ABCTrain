/*
  # Add Status Field to Course Assignments

  1. Changes
    - Add `status` column to course_assignments table
    - Values: 'not_started', 'in_progress', 'completed'
    - Default to 'not_started' for new assignments
    - Update existing assignments based on completion_date
    
  2. Purpose
    - Track course progress through lifecycle
    - Allow caregivers to mark when they start a course
    - Only allow completion after course has been started
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_assignments' AND column_name = 'status'
  ) THEN
    ALTER TABLE course_assignments 
    ADD COLUMN status text CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started';
    
    UPDATE course_assignments 
    SET status = 'completed' 
    WHERE completion_date IS NOT NULL;
  END IF;
END $$;
