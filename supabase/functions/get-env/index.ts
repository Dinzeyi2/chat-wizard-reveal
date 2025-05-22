
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { key } = await req.json();
    
    if (!key) {
      return new Response(
        JSON.stringify({ error: "No key provided" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Only allow specific environment variables to be accessed
    const allowedKeys = [
      "GITHUB_CLIENT_ID",
      "GEMINI_API_KEY",  // Added Gemini API key to allowed keys
      "OPENAI_API_KEY"   // Added OpenAI API key for fallback
    ];
    
    if (!allowedKeys.includes(key)) {
      return new Response(
        JSON.stringify({ error: "Access to this environment variable is not allowed" }),
        { 
          status: 403, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    const value = Deno.env.get(key);
    
    return new Response(
      JSON.stringify({ value }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
