-- Allow admins to insert alerts for any user
CREATE POLICY "Admins can create alerts for users"
ON public.alerts
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));