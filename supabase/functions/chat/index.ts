
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Function to safely handle API calls with retries and better error handling
async function callWithRetries(apiCall: () => Promise<any>, maxRetries = 3, backoffMs = 1000): Promise<any> {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      lastError = error;
      
      // Check if this is a rate limit error (429) or other temporary error
      const isTemporaryError = error.message && 
        (error.message.includes('429') || 
         error.message.includes('timeout') ||
         error.message.includes('non-2xx') ||
         error.message.includes('quota'));
      
      if (isTemporaryError && attempt < maxRetries - 1) {
        // Wait longer for rate limit errors before retry
        const waitTime = backoffMs * Math.pow(2, attempt);
        console.log(`Temporary error detected. Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else if (!isTemporaryError) {
        // If not a temporary error, don't retry
        break;
      }
    }
  }
  throw lastError;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, projectId, code } = await req.json();
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Processing with Gemini API");
    
    // Get the API key from environment
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      throw new Error("Gemini API key not configured");
    }

    // Try to process with Gemini first with robust retries
    try {
      // Process the user query with the Gemini API
      const response = await callWithRetries(async () => {
        let promptContext = "You are a helpful AI assistant. ";
        
        if (projectId && code) {
          promptContext += `The user is working on a project with ID: ${projectId}. Here is the code context: ${code.substring(0, 5000)}...`;
        }
        
        const geminiResponse = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": geminiApiKey
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: `${promptContext}\n\nUser message: ${message}` }]
                }
              ],
              generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 8000
              }
            })
          }
        );

        if (!geminiResponse.ok) {
          const errorText = await geminiResponse.text();
          console.error(`Gemini API error (${geminiResponse.status}):`, errorText);
          
          if (geminiResponse.status === 429) {
            throw new Error("Rate limit exceeded. Please try again in a few moments.");
          }
          
          throw new Error(`Error from Gemini API: ${geminiResponse.status}`);
        }

        return await geminiResponse.json();
      }, 3, 2000);

      if (!response.candidates || !response.candidates[0]?.content?.parts?.length) {
        throw new Error("Invalid response from Gemini API");
      }

      // Extract AI response from Gemini response
      const aiResponse = response.candidates[0].content.parts[0].text;
      
      // Create response object
      const responseObj = {
        response: aiResponse,
        projectId: projectId || null,
        codeUpdate: null
      };
      
      // Return successful response
      return new Response(
        JSON.stringify(responseObj),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (error) {
      // If Gemini fails with rate limit, try to use fallback model if available
      console.error("Gemini API failed:", error);
      
      // Get OpenAI API key as a fallback
      const openAiApiKey = Deno.env.get("OPENAI_API_KEY");
      
      if (openAiApiKey) {
        console.log("Trying OpenAI fallback...");
        
        const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${openAiApiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { 
                role: "system", 
                content: "You are a helpful AI assistant. Respond concisely and accurately to user queries."
              },
              {
                role: "user",
                content: message
              }
            ],
            max_tokens: 1000
          })
        });
        
        if (openAiResponse.ok) {
          const data = await openAiResponse.json();
          const fallbackResponse = data.choices[0].message.content;
          
          return new Response(
            JSON.stringify({
              response: `${fallbackResponse}\n\n(Note: This response was provided by a fallback AI system due to temporary issues with the primary system.)`,
              projectId: projectId || null,
              codeUpdate: null,
              usedFallback: true
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      
      // If we get here, both Gemini and OpenAI failed or OpenAI wasn't available
      throw new Error("AI service is temporarily unavailable due to high demand. Please try again in a few minutes with a simpler prompt.");
    }
  } catch (error) {
    console.error("Error:", error);
    
    // Create user-friendly error message based on error type
    let userFriendlyMessage = error.message || "An unexpected error occurred";
    let statusCode = 500;
    
    if (error.message && (error.message.includes("Rate limit") || error.message.includes("quota"))) {
      userFriendlyMessage = "The AI service is currently experiencing high demand. Please try again in a few minutes with a simpler prompt.";
      statusCode = 429;
    }
    
    // Improved error response
    return new Response(
      JSON.stringify({ 
        error: userFriendlyMessage,
        details: error.stack || "No additional details available",
        suggestion: "You can try using a shorter prompt, or try again in a few minutes."
      }),
      { status: statusCode, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
