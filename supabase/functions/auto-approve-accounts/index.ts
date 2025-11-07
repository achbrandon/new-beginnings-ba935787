import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find pending account requests older than 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const { data: pendingRequests, error: fetchError } = await supabase
      .from('account_requests')
      .select('*')
      .eq('status', 'pending')
      .lt('created_at', thirtyMinutesAgo);

    if (fetchError) {
      console.error('Error fetching pending requests:', fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!pendingRequests || pendingRequests.length === 0) {
      return new Response(JSON.stringify({ message: 'No pending requests to process' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const processedAccounts = [];

    for (const request of pendingRequests) {
      try {
        // Check if account already exists for this user and type
        const { data: existingAccount } = await supabase
          .from('accounts')
          .select('id, account_number')
          .eq('user_id', request.user_id)
          .eq('account_type', request.account_type)
          .maybeSingle();

        let newAccount;
        let accountNumber;

        if (existingAccount) {
          // Account already exists, use it instead of creating a new one
          newAccount = existingAccount;
          accountNumber = existingAccount.account_number;
          console.log(`Account already exists for request ${request.id}, using existing account:`, existingAccount.id);
        } else {
          // Generate account number
          accountNumber = Math.floor(100000000000 + Math.random() * 900000000000).toString();

          // Create the account
          const { data: createdAccount, error: accountError } = await supabase
            .from('accounts')
            .insert({
              user_id: request.user_id,
              account_type: request.account_type,
              account_number: accountNumber,
              balance: 0,
              status: 'active'
            })
            .select()
            .single();

          if (accountError) {
            console.error(`Error creating account for request ${request.id}:`, accountError);
            continue;
          }

          newAccount = createdAccount;
        }

        // Update the request status
        await supabase
          .from('account_requests')
          .update({
            status: 'approved'
          })
          .eq('id', request.id);

        // Create notification for admin
        await supabase
          .from('admin_notifications')
          .insert({
            message: `Auto-approved ${request.account_type} account for user ${request.user_id}`
          });

        processedAccounts.push({
          request_id: request.id,
          account_id: newAccount.id,
          account_type: request.account_type
        });

      } catch (error) {
        console.error(`Error processing request ${request.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Auto-approval process completed',
        processed: processedAccounts.length,
        accounts: processedAccounts
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in auto-approve-accounts function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
