-- Create external payment accounts table
CREATE TABLE public.external_payment_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL, -- 'paypal', 'cashapp', 'venmo', 'zelle'
  account_identifier TEXT NOT NULL, -- email, phone, username, etc.
  account_name TEXT, -- display name for the account
  is_verified BOOLEAN DEFAULT false,
  verification_status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'failed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.external_payment_accounts ENABLE ROW LEVEL SECURITY;

-- Users can view their own linked accounts
CREATE POLICY "Users view own external accounts"
ON public.external_payment_accounts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can add their own external accounts
CREATE POLICY "Users add own external accounts"
ON public.external_payment_accounts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own external accounts
CREATE POLICY "Users update own external accounts"
ON public.external_payment_accounts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own external accounts
CREATE POLICY "Users delete own external accounts"
ON public.external_payment_accounts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all external accounts
CREATE POLICY "Admins view all external accounts"
ON public.external_payment_accounts
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Admins can update verification status
CREATE POLICY "Admins update external accounts"
ON public.external_payment_accounts
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));