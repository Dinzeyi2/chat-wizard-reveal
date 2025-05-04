
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting guidance generation");
    
    const { projectName, description, challenge, codeSamples } = await req.json();
    console.log(`Generating guidance for project: ${projectName}, challenge: ${challenge.title}`);

    // Get the Gemini API key from environment variables
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      console.error("Gemini API key not configured");
      throw new Error("Gemini API key not configured");
    }
    
    // Call Gemini API to generate custom guidance
    console.log("Calling Gemini API for guidance generation");
    const geminiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiApiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an AI coding assistant helping users complete challenges in their app. 
            
            Project Information:
            - Name: ${projectName}
            - Description: ${description}
            
            Current Challenge:
            - Title: ${challenge.title}
            - Description: ${challenge.description}
            - Feature: ${challenge.featureName}
            - Difficulty: ${challenge.difficulty}
            - Relevant Files: ${challenge.filesPaths.join(", ")}
            
            Code Samples from the project:
            ${codeSamples}
            
            Based on this information, create a helpful guidance message for the user. The guidance should:
            1. Explain what needs to be done in simple terms
            2. Point them to the specific files they need to modify
            3. Mention any TODO comments or obvious issues in the code
            4. Provide a clear, direct explanation of the next steps they should take
            
            Keep your guidance under 400 words, make it conversational and encouraging, and focus on practical steps.`
          }]
        }],
        generationConfig: {
          temperature: 0.5,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error(`Gemini API error (${geminiResponse.status}): ${errorText}`);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    console.log("Gemini API response received");
    
    if (!geminiData.candidates || geminiData.candidates.length === 0 || !geminiData.candidates[0].content) {
      console.error("Empty or invalid response from Gemini API", geminiData);
      throw new Error("Empty or invalid response from Gemini API");
    }

    let guidance = "";
    try {
      guidance = geminiData.candidates[0].content.parts[0].text;
      console.log("Successfully extracted guidance text", guidance.substring(0, 100) + "...");
    } catch (error) {
      console.error("Error extracting guidance from Gemini response:", error);
      console.error("Response structure:", JSON.stringify(geminiData));
      throw new Error("Failed to extract guidance from response");
    }
    
    if (!guidance || guidance.trim() === "") {
      console.error("Empty guidance text extracted");
      throw new Error("Empty guidance returned from Gemini");
    }
    
    // Add a call to action at the end
    const fullGuidance = `${guidance.trim()}\n\nWhen you've completed this task, let me know and I'll guide you to the next step.`;

    console.log("Returning guidance successfully");
    return new Response(JSON.stringify({ guidance: fullGuidance, success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error('Error generating guidance:', error);
    // Return a proper error response so the client knows something went wrong
    return new Response(JSON.stringify({ 
      error: error.message, 
      success: false,
      // Include a fallback guidance message so the UI always has something to show
      guidance: "Let's work on this challenge together! Take a look at the code and see if you can identify where changes need to be made. I'm here to help if you get stuck."
    }), {
      status: 200, // Return 200 even on error so the app can still function with fallback guidance
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
