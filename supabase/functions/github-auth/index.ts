
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
    // Parse request body
    const requestData = await req.json();
    const code = requestData.code;
    const redirect_uri = requestData.redirect_uri;
    
    console.log("GitHub auth function called with:");
    console.log("- Code:", code ? `${code.substring(0, 5)}...` : "undefined");
    console.log("- Redirect URI:", redirect_uri || "undefined");
    
    if (!code) {
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
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Exchanging GitHub code for access token with redirect URI:", redirect_uri || "No redirect URI provided");

    // Exchange code for access token - NOTE: We only include redirect_uri if it's provided
    // This is key to making OAuth work across different environments
    const tokenRequestBody: any = {
      client_id: githubClientId,
      client_secret: githubClientSecret,
      code: code
    };
    
    // Only include redirect_uri if provided
    if (redirect_uri) {
      tokenRequestBody.redirect_uri = redirect_uri;
      console.log("Including redirect_uri in token request:", redirect_uri);
    }

    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(tokenRequestBody),
      }
    );

    const tokenData = await tokenResponse.json();
    console.log("GitHub token response status:", tokenResponse.status);
    console.log("GitHub token response type:", tokenData.token_type || "No token type");
    console.log("GitHub error (if any):", tokenData.error || "No error");
    
    if (tokenData.error) {
      console.error("GitHub token error:", tokenData);
      throw new Error(`GitHub API error: ${tokenData.error_description || tokenData.error}`);
    }
    
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error("Failed to get access token");
    }

    // Get user data from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userData = await userResponse.json();
    console.log("GitHub user data retrieved:", userData.login);

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

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, user: userData }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing GitHub auth:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
