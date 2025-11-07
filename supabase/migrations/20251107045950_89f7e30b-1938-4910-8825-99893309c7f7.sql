-- Add file upload columns to support_messages table
ALTER TABLE public.support_messages
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT;