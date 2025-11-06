-- Add RLS policy to allow users to insert their own account details
CREATE POLICY "Users can insert own account details"
ON public.account_details
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);