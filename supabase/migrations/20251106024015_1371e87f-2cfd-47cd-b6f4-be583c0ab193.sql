-- Add missing column to password_reset_requests
ALTER TABLE public.password_reset_requests 
ADD COLUMN IF NOT EXISTS security_answer TEXT;

-- Add missing column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Add missing columns to support_messages
ALTER TABLE public.support_messages 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- Add missing columns to support_tickets
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS agent_typing BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create card_applications table
CREATE TABLE IF NOT EXISTS public.card_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  card_type TEXT NOT NULL,
  application_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create email_logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sent_to TEXT NOT NULL,
  subject TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create manual_deposits table
CREATE TABLE IF NOT EXISTS public.manual_deposits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id UUID,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create admin_actions_log table
CREATE TABLE IF NOT EXISTS public.admin_actions_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  target_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ach_accounts table
CREATE TABLE IF NOT EXISTS public.ach_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_name TEXT NOT NULL,
  routing_number TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_type TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create account_details table
CREATE TABLE IF NOT EXISTS public.account_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL,
  user_id UUID NOT NULL,
  routing_number TEXT,
  iban TEXT,
  swift_code TEXT,
  branch_code TEXT,
  bank_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.card_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ach_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_details ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for card_applications
CREATE POLICY "Users view own card applications"
ON public.card_applications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins manage card applications"
ON public.card_applications
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policies for email_logs (admin only)
CREATE POLICY "Admins view email logs"
ON public.email_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policies for manual_deposits
CREATE POLICY "Users view own deposits"
ON public.manual_deposits
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins manage deposits"
ON public.manual_deposits
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policies for admin_actions_log (admin only)
CREATE POLICY "Admins view action logs"
ON public.admin_actions_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins create action logs"
ON public.admin_actions_log
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policies for ach_accounts
CREATE POLICY "Users view own ACH accounts"
ON public.ach_accounts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users manage own ACH accounts"
ON public.ach_accounts
FOR ALL
USING (auth.uid() = user_id);

-- Create RLS policies for account_details
CREATE POLICY "Users view own account details"
ON public.account_details
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins manage account details"
ON public.account_details
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));