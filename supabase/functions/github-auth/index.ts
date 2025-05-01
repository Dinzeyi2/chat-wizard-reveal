
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const githubClientId = Deno.env.get("GITHUB_CLIENT_ID")!;
const githubClientSecret = Deno.env.get("GITHUB_CLIENT_SECRET")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  
  if (!code) {
    return new Response(JSON.stringify({ error: "No code provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
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

    // Store GitHub data in Supabase
    const { data, error } = await supabase.from("github_connections").upsert({
      user_id: req.headers.get("x-supabase-auth-user-id"),
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
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
