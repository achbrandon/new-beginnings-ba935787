-- Add unsettled_amount and statutory_review columns to compliance_cases
ALTER TABLE public.compliance_cases 
ADD COLUMN unsettled_amount NUMERIC DEFAULT 0,
ADD COLUMN statutory_review TEXT DEFAULT 'pending';