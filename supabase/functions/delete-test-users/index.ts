import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteUsersRequest {
  userIds: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Delete test Gmail accounts
    const testEmails = ['ultimateambahe@gmail.com', 'ultimateambaheu@gmail.com', 'ambaheu@gmail.com'];
    
    console.log('Deleting test Gmail accounts:', testEmails);

    const results = [];
    
    // Get all users
    const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
    
    for (const email of testEmails) {
      const user = userData?.users.find(u => u.email === email);
      
      if (user) {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        
        if (error) {
          console.error(`Error deleting user ${email}:`, error);
          results.push({ email, success: false, error: error.message });
        } else {
          console.log(`Successfully deleted user ${email}`);
          results.push({ email, success: true });
        }
      } else {
        console.log(`User ${email} not found`);
        results.push({ email, success: true, message: 'User not found' });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        results
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in delete-test-users:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
