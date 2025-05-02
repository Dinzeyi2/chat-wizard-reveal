
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface GenerateChallengeRequest {
  prompt: string;
  completionLevel?: 'beginner' | 'intermediate' | 'advanced';
  challengeType?: 'frontend' | 'backend' | 'fullstack';
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  type: 'implementation' | 'bugfix' | 'feature';
  filesPaths: string[];
}

interface FileChallenge {
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hints: string[];
}

interface ProjectFile {
  path: string;
  content: string;
  isComplete: boolean;
  challenges?: FileChallenge[];
}

// Map for standardizing difficulty levels
const difficultyMapping = {
  'beginner': 'easy',
  'intermediate': 'medium',
  'advanced': 'hard',
  'easy': 'easy',
  'medium': 'medium',
  'hard': 'hard'
};

serve(async (req) => {
  console.log("Generate challenge function called");
  
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    console.log("Request data:", JSON.stringify(requestData));
    
    const { prompt, completionLevel, challengeType } = requestData as GenerateChallengeRequest;

    if (!prompt) {
      console.error("Missing prompt in request");
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Get the Gemini API key from environment variables
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      console.error("Gemini API key not configured");
      return new Response(JSON.stringify({ error: "Gemini API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // Call Gemini API to generate the code challenge
    console.log("Calling Gemini API to generate code challenge");
    const geminiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiApiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an expert software engineer creating coding challenges for a learning platform. 
            Please create an intentionally incomplete full-stack application based on the following prompt: "${prompt}".
            
            The application should have the following characteristics:
            - Completion Level: ${completionLevel || 'intermediate'}
            - Focus Area: ${challengeType || 'fullstack'}
            - It should be a React-based application using Tailwind CSS and shadcn/ui
            - Include 3-5 specific coding challenges for the user to complete
            - Each challenge should have clear instructions, hints, and education value
            - IMPORTANT: Make sure to create intentional gaps in the code that users need to fill in as part of the challenges
            
            Format your response as a JSON object with the following structure:
            {
              "projectName": "name-of-project",
              "description": "Brief description of the application",
              "files": [
                {
                  "path": "src/components/Example.tsx",
                  "content": "// Actual code content",
                  "isComplete": false,
                  "challenges": [
                    {
                      "description": "Challenge description",
                      "difficulty": "easy",
                      "hints": ["Hint 1", "Hint 2"]
                    }
                  ]
                }
              ],
              "challenges": [
                {
                  "id": "challenge-1",
                  "title": "Implement User Authentication",
                  "description": "Detailed description of the challenge",
                  "difficulty": "easy",
                  "type": "implementation",
                  "filesPaths": ["src/components/Auth.tsx"]
                }
              ],
              "explanation": "Overall explanation of the architecture and challenges"
            }
            
            Ensure the code is valid TypeScript/React, uses modern practices, and the incomplete parts are educational to implement.`
          }]
        }],
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

    const geminiData = await geminiResponse.json();
    console.log("Gemini response received");
    
    // Extract the generated content
    if (!geminiData.candidates || geminiData.candidates.length === 0 || !geminiData.candidates[0].content) {
      console.error("Empty or invalid response from Gemini API");
      return new Response(JSON.stringify({ error: "Empty or invalid response from Gemini API" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // Extract and parse JSON from Gemini response
    let challengeResult;
    try {
      const textContent = geminiData.candidates[0].content.parts[0].text;
      
      // Try to extract JSON from the response
      const jsonMatch = textContent.match(/```json\n([\s\S]*?)\n```/) || 
                        textContent.match(/{[\s\S]*"projectName"[\s\S]*}/);
      
      let jsonContent = textContent;
      if (jsonMatch) {
        jsonContent = jsonMatch[1] || jsonMatch[0];
      }
      
      challengeResult = JSON.parse(jsonContent.trim());
      console.log("Successfully parsed challenge data");
    } catch (jsonError) {
      console.error("Failed to parse JSON response:", jsonError);
      return new Response(JSON.stringify({ 
        error: "Failed to parse challenge data",
        technicalDetails: `JSON parse error: ${jsonError.message}`
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // Store the challenge data in the database
    const projectId = crypto.randomUUID();
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
      
      // Validate and normalize the challenges
      if (challengeResult.challenges && Array.isArray(challengeResult.challenges)) {
        challengeResult.challenges = challengeResult.challenges.map((challenge: Challenge, index: number) => {
          // Ensure challenge has a valid ID
          if (!challenge.id || challenge.id === "challenge-1") {
            challenge.id = `${projectId}-challenge-${index}`;
          }
          
          // Map difficulty levels to standardized format
          if (challenge.difficulty) {
            challenge.difficulty = difficultyMapping[challenge.difficulty] || 'medium';
          }
          
          return challenge;
        });
      }
      
      // Normalize file challenges
      if (challengeResult.files && Array.isArray(challengeResult.files)) {
        challengeResult.files = challengeResult.files.map((file: ProjectFile) => {
          if (file.challenges && Array.isArray(file.challenges)) {
            file.challenges = file.challenges.map((challenge: FileChallenge) => {
              // Map difficulty levels to standardized format
              if (challenge.difficulty) {
                challenge.difficulty = difficultyMapping[challenge.difficulty] || 'medium';
              }
              
              return challenge;
            });
          }
          
          return file;
        });
      }
      
      // Store project in database using service role
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (supabaseUrl && supabaseServiceKey) {
        await fetch(`${supabaseUrl}/rest/v1/code_challenges`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": supabaseServiceKey,
            "Authorization": `Bearer ${supabaseServiceKey}`,
            "Prefer": "return=minimal"
          },
          body: JSON.stringify({
            id: projectId,
            user_id: userId,
            prompt: prompt,
            challenge_data: challengeResult,
            completion_level: completionLevel || 'intermediate',
            challenge_type: challengeType || 'fullstack',
            created_at: new Date().toISOString()
          })
        });
      }
    } catch (dbError) {
      console.error("Database error when storing challenge:", dbError);
      // Continue even if storage fails - we'll return the data to the client
    }

    console.log(`Successfully generated code challenge`);
    return new Response(JSON.stringify({
      success: true,
      projectId: projectId,
      ...challengeResult
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in generate-challenge function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
