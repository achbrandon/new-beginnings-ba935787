-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS security_question TEXT,
ADD COLUMN IF NOT EXISTS security_answer TEXT;

-- Add missing column to account_applications table
ALTER TABLE public.account_applications 
ADD COLUMN IF NOT EXISTS qr_code_secret TEXT;

-- Add missing columns to user_sessions table
ALTER TABLE public.user_sessions 
ADD COLUMN IF NOT EXISTS session_id TEXT,
ADD COLUMN IF NOT EXISTS page_url TEXT,
ADD COLUMN IF NOT EXISTS page_title TEXT,
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create crypto_deposit_addresses table
CREATE TABLE IF NOT EXISTS public.crypto_deposit_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  currency TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  network TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create admin_settings table
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.crypto_deposit_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for crypto_deposit_addresses (public readable, admin manageable)
CREATE POLICY "Anyone can view active crypto addresses"
ON public.crypto_deposit_addresses
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins manage crypto addresses"
ON public.crypto_deposit_addresses
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policies for admin_settings (admin only)
CREATE POLICY "Admins view settings"
ON public.admin_settings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage settings"
ON public.admin_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));