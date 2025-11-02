-- Create storage bucket for account application documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('account-documents', 'account-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for account documents bucket
CREATE POLICY "Users can upload their own account documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'account-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own account documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'account-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add columns to account_applications table for document URLs
ALTER TABLE account_applications
ADD COLUMN IF NOT EXISTS id_front_url text,
ADD COLUMN IF NOT EXISTS id_back_url text,
ADD COLUMN IF NOT EXISTS selfie_url text,
ADD COLUMN IF NOT EXISTS address_proof_url text;