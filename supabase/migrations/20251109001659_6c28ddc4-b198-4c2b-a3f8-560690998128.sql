-- Add INSERT policy for profiles table to allow users to create their own profile during verification
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);