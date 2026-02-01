import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const testUsers = [
      { email: 'admin@test.com', password: 'admin123456', role: 'admin', name: 'Admin User' },
      { email: 'user@test.com', password: 'user123456', role: 'user', name: 'Regular User' },
    ]

    const results = []

    for (const testUser of testUsers) {
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find(u => u.email === testUser.email)

      if (existingUser) {
        results.push({ email: testUser.email, status: 'already exists', userId: existingUser.id })
        continue
      }

      // Create user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true,
        user_metadata: { full_name: testUser.name }
      })

      if (authError) {
        results.push({ email: testUser.email, status: 'error', error: authError.message })
        continue
      }

      // Update role if admin
      if (testUser.role === 'admin' && authData.user) {
        await supabaseAdmin
          .from('user_roles')
          .update({ role: 'admin' })
          .eq('user_id', authData.user.id)
      }

      results.push({ 
        email: testUser.email, 
        status: 'created', 
        userId: authData.user?.id,
        role: testUser.role 
      })
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
