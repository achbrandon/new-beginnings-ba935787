-- Add avatar_url column to support_agents table for profile pictures
ALTER TABLE public.support_agents 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create a storage bucket for agent avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('agent-avatars', 'agent-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for agent avatars bucket
CREATE POLICY "Anyone can view agent avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'agent-avatars');

CREATE POLICY "Admins can upload agent avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'agent-avatars' 
  AND (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
);

CREATE POLICY "Admins can update agent avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'agent-avatars' 
  AND (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
);

CREATE POLICY "Admins can delete agent avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'agent-avatars' 
  AND (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
);