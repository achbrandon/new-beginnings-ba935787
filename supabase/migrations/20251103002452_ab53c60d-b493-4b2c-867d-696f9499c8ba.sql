-- Allow admins to view all account documents
CREATE POLICY "Admins can view all account documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'account-documents' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow admins to download account documents
CREATE POLICY "Admins can download all account documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'account-documents'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);