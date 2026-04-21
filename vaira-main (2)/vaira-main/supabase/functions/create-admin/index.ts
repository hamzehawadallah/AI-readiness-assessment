import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Verify the bootstrap secret from environment variable
  const url = new URL(req.url)
  const secret = url.searchParams.get('secret')
  const expectedSecret = Deno.env.get('ADMIN_BOOTSTRAP_SECRET')
  
  if (!expectedSecret) {
    console.error('ADMIN_BOOTSTRAP_SECRET environment variable is not set')
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
  
  if (secret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    // Parse request body for email and password - no more hardcoded credentials
    const body = await req.json().catch(() => ({}))
    const { email, password } = body
    
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Validate password strength
    if (password.length < 12) {
      return new Response(JSON.stringify({ error: 'Password must be at least 12 characters long' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Create admin user with provided credentials
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (userError) {
      // User might already exist
      if (userError.message.includes('already been registered')) {
        // Get existing user and ensure they have admin role
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
        const adminUser = existingUsers?.users?.find(u => u.email === email)
        
        if (adminUser) {
          // Add admin role if not exists
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .upsert({ user_id: adminUser.id, role: 'admin' }, { onConflict: 'user_id,role' })
          
          if (roleError) throw roleError
          
          return new Response(JSON.stringify({ success: true, message: 'Admin user already exists, role confirmed' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      }
      throw userError
    }

    // Add admin role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: userData.user.id, role: 'admin' })

    if (roleError) throw roleError

    console.log('Admin user created successfully for email:', email)

    return new Response(JSON.stringify({ success: true, message: 'Admin user created successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error creating admin user:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
