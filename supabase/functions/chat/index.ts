
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
    const { message, projectId, code, editorContent } = await req.json();
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Processing chat request");
    if (editorContent) {
      console.log("Editor content provided, length:", editorContent.length);
    }
    
    // Get the API key from environment
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    // Try to process with OpenAI with robust retries
    try {
      // Process the user query with the OpenAI API
      const response = await callWithRetries(async () => {
        let promptContext = "You are a helpful AI assistant specialized in helping with code. ";
        
        // Always include editor content if it exists
        if (editorContent) {
          console.log("Including editor content in prompt");
          promptContext += `I can see the following code in your editor:
\`\`\`
${editorContent}
\`\`\`
The code above is what's currently in your editor. `;
        }
        else if (projectId && code) {
          promptContext += `The user is working on a project with ID: ${projectId}. Here is the code context: ${code.substring(0, 5000)}...`;
        }
        
        console.log("Calling OpenAI API...");
        
        const openaiResponse = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${openaiApiKey}`
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                { 
                  role: "system", 
                  content: promptContext
                },
                {
                  role: "user",
                  content: message
                }
              ],
              temperature: 0.7,
              max_tokens: 8000
            })
          }
        );

        if (!openaiResponse.ok) {
          const errorText = await openaiResponse.text();
          console.error(`OpenAI API error (${openaiResponse.status}):`, errorText);
          
          if (openaiResponse.status === 429) {
            throw new Error("Rate limit exceeded. Please try again in a few moments.");
          }
          
          throw new Error(`Error from OpenAI API: ${openaiResponse.status}`);
        }

        console.log("OpenAI API response received");
        return await openaiResponse.json();
      }, 3, 2000);

      if (!response.choices || !response.choices[0]?.message?.content) {
        throw new Error("Invalid response from OpenAI API");
      }

      // Extract AI response from OpenAI response
      const aiResponse = response.choices[0].message.content;
      
      // Create response object
      const responseObj = {
        response: aiResponse,
        projectId: projectId || null,
        codeUpdate: null,
        editorContent: editorContent || null  // Pass back editor content for context
      };
      
      console.log("Returning successful response");
      
      // Return successful response
      return new Response(
        JSON.stringify(responseObj),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("OpenAI API failed:", error);
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
