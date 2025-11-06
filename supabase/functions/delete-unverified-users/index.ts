import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user is admin
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (!roles) {
      throw new Error('Unauthorized - Admin access required')
    }

    const { userIds, deleteAll } = await req.json()

    if (deleteAll) {
      // Get all unverified users
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email_verified', false)
        .eq('qr_verified', false)

      if (!profiles || profiles.length === 0) {
        return new Response(
          JSON.stringify({ success: true, deletedCount: 0, message: 'No unverified users found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      let successCount = 0
      let errorCount = 0

      for (const profile of profiles) {
        try {
          const { error } = await supabaseAdmin.auth.admin.deleteUser(profile.id)
          if (error) {
            console.error(`Failed to delete user ${profile.id}:`, error)
            errorCount++
          } else {
            successCount++
          }
        } catch (err) {
          console.error(`Error deleting user ${profile.id}:`, err)
          errorCount++
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          deletedCount: successCount,
          errorCount,
          message: `Deleted ${successCount} users${errorCount > 0 ? ` (${errorCount} failed)` : ''}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else if (userIds && Array.isArray(userIds)) {
      // Delete specific users
      let successCount = 0
      let errorCount = 0

      for (const userId of userIds) {
        try {
          const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
          if (error) {
            console.error(`Failed to delete user ${userId}:`, error)
            errorCount++
          } else {
            successCount++
          }
        } catch (err) {
          console.error(`Error deleting user ${userId}:`, err)
          errorCount++
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          deletedCount: successCount,
          errorCount,
          message: `Deleted ${successCount} user(s)${errorCount > 0 ? ` (${errorCount} failed)` : ''}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      throw new Error('Invalid request: provide either deleteAll or userIds')
    }

  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})