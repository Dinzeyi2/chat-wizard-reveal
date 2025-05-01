
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.1'
import { corsHeaders } from '../_shared/cors.ts'

console.log('GitHub linking function started')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { code, user_id } = body

    // Validate the required parameters
    if (!code) {
      return new Response(
        JSON.stringify({ error: 'GitHub code is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get GitHub secrets from environment
    const GITHUB_CLIENT_ID = Deno.env.get('GITHUB_CLIENT_ID')
    const GITHUB_CLIENT_SECRET = Deno.env.get('GITHUB_CLIENT_SECRET')

    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({ error: 'GitHub client credentials are not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Create Supabase client
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: 'Supabase credentials are not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Exchange GitHub code for an access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      return new Response(
        JSON.stringify({ error: 'Failed to exchange code for token', details: tokenData.error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const access_token = tokenData.access_token

    // Get GitHub user data
    const githubUserResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${access_token}`,
        'User-Agent': 'Supabase Edge Function',
      },
    })

    const githubUser = await githubUserResponse.json()

    if (!githubUser || !githubUser.id) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch GitHub user data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Store GitHub connection in the database
    const { data, error } = await supabase
      .from('github_connections')
      .upsert({
        user_id,
        github_id: githubUser.id.toString(),
        github_username: githubUser.login,
        github_name: githubUser.name,
        github_avatar: githubUser.avatar_url,
        access_token,
      })
      .select()

    if (error) {
      console.error('Error storing GitHub connection:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to store GitHub connection' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        github_user: {
          id: githubUser.id,
          username: githubUser.login,
          name: githubUser.name,
          avatar_url: githubUser.avatar_url
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Unexpected error occurred', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
