
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface AppGenerationRequest {
  prompt: string;
  completionLevel?: 'beginner' | 'intermediate' | 'advanced';
}

// Function to estimate tokens in a string (rough approximation)
function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token on average
  return Math.ceil(text.length / 4);
}

// Function to summarize long inputs using OpenAI
async function summarizeWithOpenAI(text: string): Promise<string> {
  const openAiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openAiKey) {
    throw new Error("OpenAI API key not configured");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openAiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert at summarizing application requirements. Summarize the input while preserving all critical information about the desired application's functionality, features, and requirements. Keep your summary concise but comprehensive."
        },
        {
          role: "user",
          content: `Summarize this application request in 800 tokens or less while preserving all important details: ${text}`
        }
      ],
      max_tokens: 800
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`OpenAI API error (${response.status}): ${errorText}`);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Function to process input and ensure it's within token limits
async function processInput(prompt: string, maxTokens: number = 800): Promise<string> {
  const currentTokens = estimateTokens(prompt);
  
  // If within limits, return as is
  if (currentTokens <= maxTokens) {
    return prompt;
  }
  
  // If too long, use OpenAI to summarize
  console.log(`Input exceeds ${maxTokens} tokens, summarizing with OpenAI...`);
  return await summarizeWithOpenAI(prompt);
}

serve(async (req) => {
  console.log("Generate app function called");
  
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    console.log("Request data:", JSON.stringify(requestData));
    
    const { prompt, completionLevel = 'intermediate' } = requestData as AppGenerationRequest;

    if (!prompt) {
      console.error("Missing prompt in request");
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Process and potentially summarize input
    let processedPrompt;
    try {
      processedPrompt = await processInput(prompt);
      console.log("Processed prompt length (chars):", processedPrompt.length);
    } catch (error) {
      console.error("Error processing prompt:", error);
      return new Response(JSON.stringify({ error: `Error processing prompt: ${error.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    const projectId = crypto.randomUUID();

    // Get the Gemini API key from environment variables
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      console.error("Gemini API key not configured");
      return new Response(JSON.stringify({ error: "Gemini API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // Generate architecture using Gemini API instead of Claude
    console.log("Calling Gemini API to generate application with intentional challenges");
    
    const geminiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiApiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an expert software engineer creating educational coding challenges for a learning platform. 
            Please create an intentionally incomplete application based on the following prompt: "${processedPrompt}".
            
            The application should have the following characteristics:
            - Completion Level: ${completionLevel}
            - It should be a React-based application using modern web technologies
            - Include 3-5 specific coding challenges/bugs for the user to fix
            - Each challenge should have clear error patterns that are educational to solve
            - IMPORTANT: Include comments that explain what needs to be fixed as TODOs
            
            Format your response as a valid JSON object (without any markdown formatting) with the following structure:
            {
              "projectName": "name-of-project",
              "description": "Brief description of the application",
              "fileStructure": {
                "src": {
                  "components": {
                    "ComponentName.js": "// Component code with intentional issues"
                  },
                  "App.js": "// App code with some issues to fix"
                }
              },
              "challenges": [
                {
                  "id": "challenge-1",
                  "title": "Fix Component Rendering Issue",
                  "description": "There's a problem with how the component renders. Find and fix it.",
                  "filesPaths": ["src/components/ComponentName.js"]
                }
              ],
              "explanation": "Overall explanation of the challenges and what the user will learn"
            }
            
            Ensure the code has real, fixable errors that teach important programming concepts.`
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

    // Extract and parse content from Gemini response
    console.log("Processing Gemini response");
    let appData;
    try {
      const textContent = geminiData.candidates[0].content.parts[0].text;
      
      // Extract JSON content - improve the extraction by finding the JSON object more reliably
      let jsonContent = textContent;
      
      // Find the position of the first '{' and the last '}'
      const startPos = textContent.indexOf('{');
      const endPos = textContent.lastIndexOf('}');
      
      if (startPos !== -1 && endPos !== -1 && endPos > startPos) {
        jsonContent = textContent.substring(startPos, endPos + 1);
      }
      
      console.log("Cleaned JSON for parsing:", jsonContent.substring(0, 100) + "...");
      
      try {
        appData = JSON.parse(jsonContent.trim());
        console.log("Successfully parsed JSON");
      } catch (jsonError) {
        console.error("First JSON parse attempt failed:", jsonError);
        
        // Second attempt: Try to fix common JSON issues
        const fixedJson = jsonContent
          .replace(/`{3}json\n/g, '') // Remove markdown code block indicators
          .replace(/\n`{3}/g, '')
          .replace(/\\n/g, '\n')      // Fix escaped newlines
          .replace(/\\"/g, '"');      // Fix escaped quotes
          
        try {
          appData = JSON.parse(fixedJson.trim());
          console.log("Successfully parsed JSON after fixing");
        } catch (secondError) {
          throw new Error(`JSON parsing failed: ${secondError.message}`);
        }
      }
    } catch (jsonError) {
      console.error("Failed to parse JSON response:", jsonError);
      return new Response(JSON.stringify({ error: "Failed to parse application data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Convert file structure to actual files
    const files = [];
    
    function extractFilesFromStructure(structure, basePath = '') {
      for (const [key, value] of Object.entries(structure)) {
        const currentPath = basePath ? `${basePath}/${key}` : key;
        
        if (typeof value === 'object' && value !== null) {
          // It's a directory
          extractFilesFromStructure(value, currentPath);
        } else if (typeof value === 'string') {
          // It's a file
          files.push({
            path: currentPath,
            content: value
          });
        }
      }
    }
    
    if (appData.fileStructure) {
      console.log(`Generating ${Object.keys(appData.fileStructure).length} files`);
      extractFilesFromStructure(appData.fileStructure);
      
      // Generate files
      for (const file of files) {
        console.log(`Generating file: ${file.path}`);
      }
    }
    
    // Generate package.json if it doesn't exist
    if (!files.some(file => file.path === 'package.json')) {
      console.log("Generating package.json");
      files.push({
        path: 'package.json',
        content: JSON.stringify({
          name: appData.projectName,
          version: '0.1.0',
          private: true,
          dependencies: {
            "react": "^18.2.0",
            "react-dom": "^18.2.0",
            "react-scripts": "5.0.1"
          },
          scripts: {
            "start": "react-scripts start",
            "build": "react-scripts build",
            "test": "react-scripts test",
            "eject": "react-scripts eject"
          },
          eslintConfig: {
            "extends": [
              "react-app"
            ]
          },
          browserslist: {
            "production": [
              ">0.2%",
              "not dead",
              "not op_mini all"
            ],
            "development": [
              "last 1 chrome version",
              "last 1 firefox version",
              "last 1 safari version"
            ]
          }
        }, null, 2)
      });
    }
    
    // Store the app data in the database
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Supabase credentials not configured");
      }
      
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
      
      // Store project in database
      const response = await fetch(`${supabaseUrl}/rest/v1/app_projects`, {
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
          version: 1,
          app_data: {
            projectName: appData.projectName,
            description: appData.description,
            files: files,
            challenges: appData.challenges || [],
            explanation: appData.explanation || "Learn by fixing the issues in this application"
          },
          creation_prompt: prompt,
          created_at: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to store project: ${response.status}`);
      }
      console.log(`Stored app project with ID: ${projectId}`);
      console.log(`Successfully generated ${files.length} files`);
    } catch (dbError) {
      console.error("Database error when storing app data:", dbError);
    }

    // Return the generated app data to the client
    return new Response(JSON.stringify({
      projectId,
      projectName: appData.projectName,
      description: appData.description,
      files: files,
      challenges: appData.challenges || [],
      explanation: appData.explanation || "Learn by fixing the issues in this application"
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error in generate-app function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
