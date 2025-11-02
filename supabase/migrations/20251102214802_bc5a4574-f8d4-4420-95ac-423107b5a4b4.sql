-- Add admin policies to view and manage all applications

-- Account Applications: Allow admins to view and update all account applications
CREATE POLICY "Admins can view all account applications"
ON public.account_applications
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update account applications"
ON public.account_applications
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Card Applications: Allow admins to view and update all card applications
CREATE POLICY "Admins can view all card applications"
ON public.card_applications
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update card applications"
ON public.card_applications
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Loan Applications: Allow admins to view and update all loan applications
CREATE POLICY "Admins can view all loan applications"
ON public.loan_applications
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update loan applications"
ON public.loan_applications
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));