-- Add favorite_transactions table for users to mark transactions as favorites
CREATE TABLE IF NOT EXISTS public.favorite_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, transaction_id)
);

-- Enable RLS
ALTER TABLE public.favorite_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own favorites
CREATE POLICY "Users can view own favorites"
  ON public.favorite_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add their own favorites
CREATE POLICY "Users can add own favorites"
  ON public.favorite_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their own favorites
CREATE POLICY "Users can remove own favorites"
  ON public.favorite_transactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_favorite_transactions_user_id ON public.favorite_transactions(user_id);
CREATE INDEX idx_favorite_transactions_transaction_id ON public.favorite_transactions(transaction_id);