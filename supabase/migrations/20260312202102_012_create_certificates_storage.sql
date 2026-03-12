/*
  # Create Certificates Storage Bucket

  1. Storage Setup
    - Create a storage bucket named 'certificates' for storing course completion certificates
    - Enable public access for viewing certificates
    - Set up RLS policies for secure access

  2. Security
    - Caregivers can upload certificates to their own folder
    - Admins and managers can view all certificates
    - Caregivers can view their own certificates
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificates',
  'certificates',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Caregivers can upload their own certificates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'certificates' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own certificates"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'certificates' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  )
);

CREATE POLICY "Admins can delete certificates"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'certificates' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);
