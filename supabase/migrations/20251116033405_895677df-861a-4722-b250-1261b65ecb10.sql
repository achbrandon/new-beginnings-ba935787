-- Add admin tracking to alerts table
ALTER TABLE public.alerts 
ADD COLUMN sent_by_admin_id uuid REFERENCES auth.users(id),
ADD COLUMN sent_at timestamp with time zone DEFAULT now();

-- Update RLS policies to allow admins to view all alerts for history
CREATE POLICY "Admins can view all alerts for history"
ON public.alerts
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));