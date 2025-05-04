
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
    const { projectName, description, challenge, codeSamples } = await req.json();

    // Get the Gemini API key from environment variables
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      throw new Error("Gemini API key not configured");
    }
    
    console.log("Generating guidance for project:", projectName);
    
    // Call Gemini API to generate custom guidance
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
          temperature: 0.7,
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
    console.log("Guidance generated successfully");
    
    // Extract the guidance content
    if (!geminiData.candidates || geminiData.candidates.length === 0 || !geminiData.candidates[0].content) {
      throw new Error("Empty or invalid response from Gemini API");
    }

    const guidance = geminiData.candidates[0].content.parts[0].text;
    
    // Add a call to action at the end
    const fullGuidance = `${guidance.trim()}\n\nWhen you've completed this task, let me know and I'll guide you to the next step.`;

    return new Response(JSON.stringify({ guidance: fullGuidance }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error('Error generating guidance:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
