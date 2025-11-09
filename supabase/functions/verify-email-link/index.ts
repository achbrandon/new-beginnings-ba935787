import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const userId = url.searchParams.get('userId');

    if (!token || !userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid verification link' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

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

    // Get the account application to verify the token
    const { data: application, error: appError } = await supabaseAdmin
      .from('account_applications')
      .select('qr_code_secret, user_id, email')
      .eq('user_id', userId)
      .maybeSingle();

    if (appError || !application) {
      console.error('Error fetching application:', appError);
      return new Response(
        JSON.stringify({ success: false, error: 'Application not found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Verify the token matches
    if (application.qr_code_secret !== token) {
      console.error('Token mismatch');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid verification token' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Update user's email confirmation status in Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { email_confirm: true }
    );

    if (authError) {
      console.error('Error confirming email in auth:', authError);
      throw authError;
    }

    // Update the profile to mark email as verified
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({ 
        id: userId,
        email_verified: true,
        qr_verified: true,
        can_transact: true
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      });

    if (profileError) {
      console.error('Error updating profile:', profileError);
    }

    // Update the account application
    const { error: appUpdateError } = await supabaseAdmin
      .from('account_applications')
      .update({ 
        qr_code_verified: true,
        status: 'approved'
      })
      .eq('user_id', userId);

    if (appUpdateError) {
      console.error('Error updating application:', appUpdateError);
    }

    console.log('✅ Email verified successfully for user:', userId);

    return new Response(
      JSON.stringify({ success: true, message: 'Email verified successfully' }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error("Error in verify-email-link function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
};

serve(handler);

