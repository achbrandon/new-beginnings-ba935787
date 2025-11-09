-- Fix admin_notifications table to have proper relationship with profiles
-- First, check if user_id column exists and add if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'admin_notifications' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.admin_notifications 
    ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update the foreign key constraint to ensure it references profiles correctly
ALTER TABLE public.admin_notifications 
DROP CONSTRAINT IF EXISTS admin_notifications_user_id_fkey;

ALTER TABLE public.admin_notifications 
ADD CONSTRAINT admin_notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;