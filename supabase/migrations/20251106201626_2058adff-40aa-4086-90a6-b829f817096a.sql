-- Add trigger to automatically generate account details when account is created
CREATE TRIGGER generate_account_details_trigger
AFTER INSERT ON public.accounts
FOR EACH ROW
EXECUTE FUNCTION public.generate_account_details();