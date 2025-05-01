
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const githubClientId = Deno.env.get("GITHUB_CLIENT_ID")!;
const githubClientSecret = Deno.env.get("GITHUB_CLIENT_SECRET")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("GitHub auth edge function invoked");
    
    // Parse request body
    const { code } = await req.json();
    
    if (!code) {
      console.error("No code provided in request");
      return new Response(
        JSON.stringify({ error: "No code provided" }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Extract user ID from request headers
    const userId = req.headers.get("x-supabase-auth-user-id");
    
    if (!userId) {
      console.error("Not authenticated - missing user ID");
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    console.log(`Processing GitHub auth for user: ${userId}`);

    // Exchange code for access token
    console.log("Exchanging code for GitHub access token");
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: githubClientId,
          client_secret: githubClientSecret,
          code: code,
        }),
      }
    );

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error("Failed to get access token", tokenData);
      throw new Error("Failed to get access token");
    }
    
    console.log("Successfully obtained GitHub access token");

    // Get user data from GitHub
    console.log("Fetching user data from GitHub API");
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userData = await userResponse.json();
    console.log(`GitHub user data retrieved for: ${userData.login}`);

    // Store GitHub data in Supabase
    console.log("Storing GitHub connection data in Supabase");
    const { data, error } = await supabase.from("github_connections").upsert({
      user_id: userId,
      github_id: userData.id,
      github_username: userData.login,
      github_avatar: userData.avatar_url,
      github_name: userData.name,
      access_token: accessToken,
      connected_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error storing GitHub connection:", error);
      throw error;
    }
    
    console.log("GitHub connection successfully stored");

    return new Response(
      JSON.stringify({ success: true, user: userData }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("GitHub auth edge function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
