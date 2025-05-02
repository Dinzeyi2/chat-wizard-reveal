
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface ChallengeAppRequest {
  prompt: string;
}

// Function to estimate tokens in a string (rough approximation)
function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token on average
  return Math.ceil(text.length / 4);
}

serve(async (req) => {
  console.log("Generate challenge app function called");
  
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    console.log("Request data:", JSON.stringify(requestData));
    
    const { prompt } = requestData as ChallengeAppRequest;

    if (!prompt) {
      console.error("Missing prompt in request");
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
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
    
    // Generate app architecture with intentional gaps using Gemini API
    console.log("Calling Gemini API for challenge app generation");
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
              { 
                text: `You are an expert coding instructor who creates educational web application projects with intentional gaps.

TASK: Create a learning challenge based on this user request: "${prompt}"

The response should be a valid JSON structure with the following format:
{
  "projectName": "name-of-project",
  "description": "Description of the project, mentioning that it's an educational challenge",
  "challengeInfo": {
    "title": "Challenge Title",
    "description": "Detailed explanation of the coding challenges",
    "missingFeatures": ["Feature 1 needs implementation", "Feature 2 is incomplete", "etc"],
    "difficultyLevel": "beginner|intermediate|advanced"
  },
  "technologies": ["tech1", "tech2"],
  "files": [
    {
      "path": "file/path.ext", 
      "content": "code content with INTENTIONAL issues or incomplete parts",
      "language": "programming language"
    }
  ]
}

Important guidelines:
- All files should be properly structured but have INTENTIONAL gaps or issues that represent real-world coding challenges
- Include clear comments like "// TODO: Implement this feature" to mark where code is missing
- Make sure the issues are educational and realistic (authentication bugs, state management problems, etc)
- Keep the codebase approachable and well-commented for learning purposes
- Focus on modern React with Typescript and any necessary backend code
- Include a README.md with instructions for completing the challenge

Remember: The goal is to create a realistic but educational coding challenge that helps people improve their skills by implementing missing features.`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192
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

    console.log("Gemini response received");
    const geminiData = await geminiResponse.json();
    
    if (!geminiData || !geminiData.candidates || geminiData.candidates.length === 0) {
      console.error("Empty or invalid response from Gemini API");
      return new Response(JSON.stringify({ error: "Empty or invalid response from Gemini API" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    const responseContent = geminiData.candidates[0].content.parts[0].text;
    console.log("Gemini content received:", responseContent.substring(0, 200) + "...");
    
    let appData;
    
    try {
      // Extract JSON from the response
      const jsonMatch = responseContent.match(/```json\n([\s\S]*?)\n```/) || 
                         responseContent.match(/{[\s\S]*"projectName"[\s\S]*}/);
      
      let jsonContent;
      if (jsonMatch) {
        jsonContent = jsonMatch[1] || jsonMatch[0];
      } else {
        // Try to find the JSON portion in the raw text
        const startIndex = responseContent.indexOf('{');
        const endIndex = responseContent.lastIndexOf('}');
        if (startIndex >= 0 && endIndex > startIndex) {
          jsonContent = responseContent.substring(startIndex, endIndex + 1);
        } else {
          throw new Error("Could not extract JSON from response");
        }
      }
      
      appData = JSON.parse(jsonContent);
    } catch (jsonError) {
      console.error("Failed to parse JSON response:", jsonError);
      
      return new Response(JSON.stringify({ 
        error: "Failed to generate challenge application. Please try again with a simpler prompt.",
        technicalDetails: `JSON parse error: ${jsonError.message}`,
        snippet: responseContent.substring(0, 300)
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Store the generated challenge app in the database
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    let projectId = null;
    
    if (supabaseUrl && supabaseServiceKey) {
      try {
        // Get user_id from the JWT if available
        let userId = null;
        const authHeader = req.headers.get("authorization");
        
        if (authHeader && authHeader.startsWith("Bearer ")) {
          const token = authHeader.substring(7);
          try {
            // Simple JWT parsing to extract user_id
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            const payload = JSON.parse(jsonPayload);
            userId = payload.sub;
          } catch (e) {
            console.error("Error parsing JWT:", e);
          }
        }
        
        // If we couldn't get a user_id, use a placeholder
        if (!userId) {
          userId = "00000000-0000-0000-0000-000000000000"; // Anonymous user
        }
        
        // Create a new project record
        const projectResponse = await fetch(`${supabaseUrl}/rest/v1/app_projects`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": supabaseServiceKey,
            "Authorization": `Bearer ${supabaseServiceKey}`,
            "Prefer": "return=representation"
          },
          body: JSON.stringify({
            id: crypto.randomUUID(),
            user_id: userId,
            version: 1,
            app_data: appData,
            original_prompt: prompt,
            created_at: new Date().toISOString()
          })
        });
        
        if (projectResponse.ok) {
          const project = await projectResponse.json();
          projectId = project[0].id;
          console.log("Stored challenge app project with ID:", projectId);
        } else {
          console.error("Failed to store challenge app project:", await projectResponse.text());
        }
      } catch (dbError) {
        console.error("Database error when storing challenge app:", dbError);
      }
    } else {
      console.log("Supabase credentials not found, skipping database storage");
    }

    // Generate a learning-focused explanation
    let challengeExplanation = `# ${appData.projectName} - Coding Challenge\n\n`;
    challengeExplanation += `## Overview\n${appData.description}\n\n`;
    
    if (appData.challengeInfo && appData.challengeInfo.missingFeatures) {
      challengeExplanation += "## Missing Features to Implement\n";
      appData.challengeInfo.missingFeatures.forEach((feature: string) => {
        challengeExplanation += `- ${feature}\n`;
      });
    }
    
    challengeExplanation += "\n## Instructions\nExplore the code in the file explorer panel to find the TODOs and missing features. Complete the code to gain practical experience solving real-world problems.";

    console.log(`Successfully generated challenge app with ${appData.files ? appData.files.length : 0} files`);
    return new Response(JSON.stringify({
      projectId: projectId,
      projectName: appData.projectName,
      description: appData.description,
      challengeInfo: appData.challengeInfo || {},
      files: appData.files || [],
      explanation: challengeExplanation
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Fatal error in generate-challenge-app function:", error);
    return new Response(JSON.stringify({ error: `${error.message}`, stack: error.stack }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
