import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Version: 2.0 - Delete all non-admin users
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

    // Admin account to preserve
    const adminEmail = 'info@vaulteonline.com';
    
    console.log('🗑️ Starting deletion of all non-admin users...');

    // Get all users
    const { data: userData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      throw listError;
    }

    console.log('📊 Total users found:', userData?.users.length);

    const results = [];
    
    // Delete all users EXCEPT the admin
    if (userData?.users) {
      for (const user of userData.users) {
        // Skip admin account
        if (user.email === adminEmail) {
          console.log(`✅ Skipping admin account: ${adminEmail}`);
          results.push({ email: user.email, success: true, skipped: true, reason: 'Admin account' });
          continue;
        }
        
        console.log(`🗑️ Deleting user: ${user.email} (ID: ${user.id})`);
        const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        
        if (error) {
          console.error(`❌ Error deleting user ${user.email}:`, error);
          results.push({ email: user.email, success: false, error: error.message });
        } else {
          console.log(`✅ Successfully deleted user ${user.email}`);
          results.push({ email: user.email, success: true, deleted: true });
        }
      }
    }

    const deletedCount = results.filter(r => r.deleted).length;
    console.log(`🎉 Deletion complete! Deleted ${deletedCount} users, preserved admin account.`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Deleted ${deletedCount} users, preserved admin account`,
        results
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("❌ Error in delete-test-users:", error);
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
