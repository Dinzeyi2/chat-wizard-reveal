import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Add a fallback mechanism when Gemini API has rate limiting issues
const processWithFallbackAI = async (prompt: string, retryWithOpenAI = true) => {
  try {
    console.log("Processing with Gemini API");
    // Try Gemini first
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': Deno.env.get('GEMINI_API_KEY') || ''
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      })
    });

    // If Gemini fails with rate limit or other error, try OpenAI as fallback
    if (!geminiResponse.ok) {
      if (geminiResponse.status === 429 && retryWithOpenAI) {
        console.log("Gemini API rate limit hit, using OpenAI fallback");
        return await processWithOpenAI(prompt);
      }
      throw new Error(`Error from Gemini API: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    return geminiData.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Error processing with Gemini:", error);
    if (retryWithOpenAI) {
      console.log("Using OpenAI as fallback");
      return await processWithOpenAI(prompt);
    }
    throw error;
  }
};

// Add OpenAI fallback function
const processWithOpenAI = async (prompt: string) => {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error("OpenAI API key not available for fallback");
  }
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful AI assistant that responds to user queries.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

serve(async (req) => {
  console.log("Chat function called");
  
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, projectId } = await req.json();

    if (!message) {
      console.error("Missing message in request");
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Process the message with the new fallback system
    let responseText;
    try {
      responseText = await processWithFallbackAI(message);
    } catch (error) {
      console.error("All processing attempts failed:", error);
      return new Response(JSON.stringify({ 
        error: "Processing service temporarily unavailable. Please try again in a few minutes." 
      }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      response: responseText,
      projectId
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error in chat function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
