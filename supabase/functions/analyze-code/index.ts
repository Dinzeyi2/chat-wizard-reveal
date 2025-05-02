
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface CodeAnalysisRequest {
  code: string;
  language: string;
  projectId?: string;
  featureContext?: string;
}

serve(async (req) => {
  console.log("Analyze code function called");
  
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    console.log("Request data received");
    
    const { code, language, projectId, featureContext } = requestData as CodeAnalysisRequest;

    if (!code) {
      console.error("Missing code in request");
      return new Response(JSON.stringify({ error: "Code is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      console.error("Gemini API key not configured");
      return new Response(JSON.stringify({ error: "Gemini API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // Fetch project data if projectId is provided
    let projectData = null;
    if (projectId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (supabaseUrl && supabaseServiceKey) {
        try {
          const projectResponse = await fetch(`${supabaseUrl}/rest/v1/app_projects?id=eq.${projectId}&select=*`, {
            headers: {
              "Content-Type": "application/json",
              "apikey": supabaseServiceKey,
              "Authorization": `Bearer ${supabaseServiceKey}`
            }
          });
          
          if (projectResponse.ok) {
            const projects = await projectResponse.json();
            if (projects && projects.length > 0) {
              projectData = projects[0].app_data;
            }
          }
        } catch (error) {
          console.error("Error fetching project data:", error);
        }
      }
    }
    
    let analysisPrompt = `You are a helpful coding mentor assessing a student's code solution.

CODE TO ANALYZE:
\`\`\`${language || ""}
${code}
\`\`\``;

    if (featureContext) {
      analysisPrompt += `\n\nThe student is implementing this feature: ${featureContext}`;
    }

    if (projectData && projectData.challengeInfo) {
      analysisPrompt += `\n\nThis is part of a learning project called "${projectData.projectName}" with these challenge requirements:
      
Challenge: ${projectData.challengeInfo.title}
Description: ${projectData.challengeInfo.description}
Missing Features to Implement: ${JSON.stringify(projectData.challengeInfo.missingFeatures)}
Difficulty Level: ${projectData.challengeInfo.difficultyLevel}`;
    }

    analysisPrompt += `\n\nProvide constructive feedback on:
1. If the code correctly implements the feature (if applicable)
2. Code quality, readability, and best practices
3. Potential bugs or edge cases
4. Specific suggestions for improvement
5. What the student did well

Be supportive, educational, and specific in your feedback. Include small code examples where helpful.`;

    console.log("Calling Gemini API for code analysis");
    const geminiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiKey
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: analysisPrompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096
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

    const analysisData = await geminiResponse.json();
    
    if (!analysisData || !analysisData.candidates || analysisData.candidates.length === 0) {
      console.error("Empty or invalid response from Gemini API");
      return new Response(JSON.stringify({ error: "Empty or invalid response from Gemini API" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    const analysisContent = analysisData.candidates[0].content.parts[0].text;
    
    return new Response(JSON.stringify({
      analysis: analysisContent
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Fatal error in analyze-code function:", error);
    return new Response(JSON.stringify({ error: `${error.message}`, stack: error.stack }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
