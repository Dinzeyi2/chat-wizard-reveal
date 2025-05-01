
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const githubClientId = Deno.env.get("GITHUB_CLIENT_ID")!;
const githubClientSecret = Deno.env.get("GITHUB_CLIENT_SECRET")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  console.log("github-auth function called");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    console.log("Parsing request body");
    const { code } = await req.json();
    
    if (!code) {
      console.error("No code provided");
      return new Response(
        JSON.stringify({ error: "No code provided" }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Extract user ID from request headers
    console.log("Extracting user ID from headers");
    const userId = req.headers.get("x-supabase-auth-user-id");
    
    if (!userId) {
      console.error("Not authenticated, no user ID in headers");
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Exchanging code for access token");
    // Exchange code for access token
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
    console.log("Token response received:", Object.keys(tokenData));
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error("Failed to get access token:", tokenData);
      throw new Error("Failed to get access token");
    }

    console.log("Getting user data from GitHub");
    // Get user data from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userData = await userResponse.json();
    console.log("GitHub user data retrieved:", Object.keys(userData));

    console.log("Storing GitHub data in Supabase");
    // Store GitHub data in Supabase
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
      console.error("Supabase error:", error);
      throw error;
    }

    console.log("GitHub auth successful");
    return new Response(
      JSON.stringify({ success: true, user: userData }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in github-auth function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
