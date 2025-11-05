-- Add missing columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pin text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS security_question text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS security_answer text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_transact boolean DEFAULT false;

-- Add missing column to support_agents table
ALTER TABLE public.support_agents ADD COLUMN IF NOT EXISTS name text;

-- Add missing column to support_tickets table
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS chat_mode text DEFAULT 'bot';

-- Add missing column to accounts table
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS qr_code_secret text;

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  type text NOT NULL,
  description text,
  status text DEFAULT 'completed',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own transactions"
ON public.transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all transactions"
ON public.transactions
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create account_applications table
CREATE TABLE IF NOT EXISTS public.account_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  account_type text NOT NULL,
  status text DEFAULT 'pending',
  qr_code_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.account_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own applications"
ON public.account_applications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all applications"
ON public.account_applications
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage applications"
ON public.account_applications
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create loan_applications table
CREATE TABLE IF NOT EXISTS public.loan_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  loan_type text NOT NULL,
  amount numeric NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own loan applications"
ON public.loan_applications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all loan applications"
ON public.loan_applications
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create password_reset_requests table
CREATE TABLE IF NOT EXISTS public.password_reset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verified boolean DEFAULT false,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own reset requests"
ON public.password_reset_requests
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users manage own reset requests"
ON public.password_reset_requests
FOR ALL
USING (auth.uid() = user_id);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamp with time zone DEFAULT now(),
  ended_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own sessions"
ON public.user_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users manage own sessions"
ON public.user_sessions
FOR ALL
USING (auth.uid() = user_id);

-- Create user_activity table
CREATE TABLE IF NOT EXISTS public.user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  details text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own activity"
ON public.user_activity
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all activity"
ON public.user_activity
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create support_ratings table
CREATE TABLE IF NOT EXISTS public.support_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.support_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own ratings"
ON public.support_ratings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users create own ratings"
ON public.support_ratings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all ratings"
ON public.support_ratings
FOR SELECT
USING (has_role(auth.uid(), 'admin'));