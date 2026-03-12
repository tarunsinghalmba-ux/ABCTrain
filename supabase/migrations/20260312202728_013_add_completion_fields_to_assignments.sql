/*
  # Add Completion Fields to Course Assignments

  1. Changes
    - Add `completion_date` to course_assignments table to track when assignment was completed
    - Add `certificate_url` to course_assignments table to store certificate location
    - Add `certificate_filename` to course_assignments table
    
  2. Purpose
    - Allow tracking completion directly on the assignment
    - Keep completion data accessible with assignments
    - Maintain backward compatibility with course_completions table
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_assignments' AND column_name = 'completion_date'
  ) THEN
    ALTER TABLE course_assignments ADD COLUMN completion_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_assignments' AND column_name = 'certificate_url'
  ) THEN
    ALTER TABLE course_assignments ADD COLUMN certificate_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_assignments' AND column_name = 'certificate_filename'
  ) THEN
    ALTER TABLE course_assignments ADD COLUMN certificate_filename text;
  END IF;
END $$;
