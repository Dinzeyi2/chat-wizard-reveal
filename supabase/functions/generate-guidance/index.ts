
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface GuidanceRequest {
  projectData: any;
  codeSamples: Array<{path: string; snippet: string}>;
  promptType: 'first-step' | 'next-step' | 'challenge-complete';
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    console.log("Generate guidance function called");
    
    const { projectData, codeSamples, promptType } = requestData as GuidanceRequest;

    // Get the Gemini API key from environment variables
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      console.error("Gemini API key not configured");
      return new Response(JSON.stringify({ error: "Gemini API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // Build the prompt based on the project data and code samples
    let prompt = "";
    
    if (promptType === 'first-step') {
      prompt = `You are an expert coding mentor guiding a user through completing an application. 
      Analyze the following application and generate personalized guidance for the user's first steps.
      
      Project name: ${projectData.projectName}
      Description: ${projectData.description}
      Number of files: ${projectData.fileCount}
      
      ${projectData.challenges && projectData.challenges.length > 0 ? 
        `Challenges to complete: 
        ${projectData.challenges.map((c: any, i: number) => 
          `${i+1}. ${c.title}: ${c.description}`
        ).join('\n')}` : 
        "No specific challenges defined."}
      
      Code samples:
      ${codeSamples.map((sample: any) => 
        `File: ${sample.path}\n\`\`\`\n${sample.snippet}\n\`\`\``
      ).join('\n\n')}
      
      Generate a specific, helpful first guidance message that:
      1. Welcomes the user to the project
      2. Explains the purpose and structure of the app
      3. Suggests a clear first action to take (specific file to examine or modify)
      4. Uses a friendly, encouraging tone
      5. Focuses on just ONE task to start with
      
      Format your response as markdown with headings and bullet points for readability.
      Keep your response under 400 words. Don't repeat code, just refer to it.`;
    } else if (promptType === 'next-step') {
      // Add logic for next step guidance
      prompt = `Generate the next step of guidance...`;
    } else {
      prompt = `Generate challenge completion guidance...`;
    }
    
    // Call Gemini API to generate personalized guidance
    console.log("Calling Gemini API to generate guidance");
    const geminiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiApiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error(`Gemini API error (${geminiResponse.status}): ${errorText}`);
      return new Response(JSON.stringify({ error: `Gemini API error: ${geminiResponse.status}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const geminiData = await geminiResponse.json();
    
    // Extract the generated guidance
    const guidance = geminiData.candidates[0].content.parts[0].text;
    
    return new Response(JSON.stringify({
      guidance: guidance
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in generate-guidance function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
