-- Add a Supabase Storage RLS policy
CREATE POLICY "Authenticated users can upload to their own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'listings' AND (storage.foldername(name))[1] = auth.uid()::text);
