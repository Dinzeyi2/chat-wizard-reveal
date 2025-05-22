
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to handle CORS preflight requests
function handleCors(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Get the Gemini API key from environment variables
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY is not set in environment variables' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the request body
    const { content, prompt, userQuestion } = await req.json();
    
    if (!content) {
      return new Response(
        JSON.stringify({ error: 'No content provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Processing code content with Gemini API, length:", content.length);
    console.log("User question:", userQuestion || "None provided");

    // Prepare the request to Gemini API
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent';
    
    // Create a more intelligent prompt based on user's question
    let effectivePrompt = prompt || 'Analyze this code and provide feedback:';
    
    // If we have a user question, format a more specific prompt
    if (userQuestion) {
      effectivePrompt = `The user is asking: "${userQuestion}" about the following code. 
      Please provide a detailed response addressing their question specifically. 
      Explain any relevant parts of the code that answer their question, and if appropriate, 
      suggest improvements or point out issues in the code.`;
    }
    
    // Build the request payload
    const payload = {
      contents: [
        {
          parts: [
            {
              text: `${effectivePrompt}\n\n\`\`\`\n${content}\n\`\`\``
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    };

    // Call the Gemini API
    const response = await fetch(`${apiUrl}?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Process the response
    const data = await response.json();
    
    // Extract the generated text from the response
    let generatedText = '';
    if (data.candidates && data.candidates.length > 0 && 
        data.candidates[0].content && 
        data.candidates[0].content.parts && 
        data.candidates[0].content.parts.length > 0) {
      generatedText = data.candidates[0].content.parts[0].text;
      console.log("Successfully received Gemini response");
    } else if (data.error) {
      console.error("Gemini API error:", data.error);
      throw new Error(data.error.message || 'Error from Gemini API');
    } else {
      console.error("Unexpected response format:", data);
      throw new Error('Unexpected response format from Gemini API');
    }

    // Return the analyzed content
    return new Response(
      JSON.stringify({ 
        analysis: generatedText,
        timestamp: new Date().toISOString(),
        userQuestion: userQuestion || null,
        contentPreview: content.substring(0, 50) + '...' // Include a preview of what was analyzed
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in gemini-vision function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
