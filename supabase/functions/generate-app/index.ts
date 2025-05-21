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

// Function to create a default app design when Perplexity fails
function createDefaultAppDesign(prompt: string): any {
  // Extract potential name from prompt
  const nameParts = prompt.split(' ').filter(word => word.length > 2);
  const projectName = nameParts.length > 0 
    ? `${nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1)}App`
    : "SimpleApp";
  
  return {
    projectName,
    description: `A simple application based on the prompt: "${prompt}"`,
    features: ["Basic user interface", "Core functionality"],
    techStack: ["React", "JavaScript", "CSS"],
    mainComponents: ["App", "HomePage"],
    dataStructure: "Simple state management with React hooks"
  };
}

// Function to get app design using Perplexity API
async function getDesignWithPerplexity(prompt: string): Promise<any> {
  // Get the Perplexity API key from environment variables
  const perplexityApiKey = Deno.env.get("PERPLEXITY_API_KEY");
  if (!perplexityApiKey) {
    console.error("Perplexity API key not configured");
    throw new Error("Perplexity API key not configured");
  }
  
  console.log("Calling Perplexity API to get application design");
  
  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${perplexityApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content: `You are an expert software architect who designs modern web applications. 
                    You create detailed, well-structured application designs based on user requests.
                    Focus on clarity, modern best practices, and a comprehensive understanding of the requirements.
                    IMPORTANT: You must respond ONLY with a valid JSON object containing the application design.`
          },
          {
            role: "user",
            content: `Design a modern web application based on this request: "${prompt}"
                    
                    Provide your response in the following JSON format (and ONLY this format, no other text):
                    {
                      "projectName": "name-of-project",
                      "description": "Detailed description of the application",
                      "features": ["Feature 1", "Feature 2", "..."],
                      "techStack": ["React", "Tailwind CSS", "..."],
                      "mainComponents": ["Component1", "Component2", "..."],
                      "dataStructure": "Description of how data should be structured"
                    }`
          }
        ],
        temperature: 0.6,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Perplexity API error (${response.status}): ${errorText}`);
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const designText = data.choices[0].message.content;
    
    console.log("Raw Perplexity response:", designText.substring(0, 100) + "...");
    
    // Extract JSON from response
    try {
      // First, try to directly parse the response as JSON
      try {
        return JSON.parse(designText);
      } catch (error) {
        console.log("Direct JSON parsing failed, attempting to extract JSON from text");
      }
      
      // Try to find JSON block in the response with regex
      const jsonMatch = designText.match(/{[\s\S]*}/);
      if (jsonMatch) {
        const jsonContent = jsonMatch[0];
        console.log("Extracted JSON:", jsonContent.substring(0, 100) + "...");
        return JSON.parse(jsonContent);
      }
      
      // If we can't extract JSON, return a default design
      console.log("Could not extract valid JSON, using default design");
      return createDefaultAppDesign(prompt);
      
    } catch (error) {
      console.error("Failed to parse Perplexity JSON response:", error);
      console.log("Using default app design as fallback");
      return createDefaultAppDesign(prompt);
    }
  } catch (error) {
    console.error("Error calling Perplexity API:", error);
    console.log("Using default app design as fallback");
    return createDefaultAppDesign(prompt);
  }
}

// Function to prepare first step guidance
function prepareFirstStepGuidance(appData: any): string {
  // Get the first challenge from the generated app
  if (!appData.challenges || appData.challenges.length === 0) {
    return "Let's start by exploring the generated code to understand the application structure.";
  }
  
  const firstChallenge = appData.challenges[0];
  
  let guidance = `
## Let's Start Building! Your First Task

I've created this application with some challenges for you to solve. Let's tackle them one by one!

### First Task: ${firstChallenge.title}

**What you need to do:**
${firstChallenge.description}

`;

  // Add file paths information if available
  if (firstChallenge.filesPaths && Array.isArray(firstChallenge.filesPaths) && firstChallenge.filesPaths.length > 0) {
    guidance += `**Files to examine:** ${firstChallenge.filesPaths.join(', ')}\n\n`;
  } else {
    guidance += `**Examine the project files** to understand the structure.\n\n`;
  }

  guidance += `Take a look at the code, find the issues marked with TODO comments, and make the necessary fixes.
When you've completed this task, let me know and I'll guide you to the next challenge.
  `;
  
  return guidance;
}

// Add a better fallback system for when Gemini API is rate limited
const generateAppWithFallback = async (prompt, completionLevel) => {
  console.log("Attempting to generate app with prompt:", prompt.substring(0, 100) + "...");
  
  // First try with Gemini API
  try {
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      console.log("Gemini API key not configured, skipping to OpenAI");
      throw new Error("Gemini API key not configured");
    }
    
    console.log("Calling Gemini API to generate application");
    
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
            Please create an intentionally incomplete application based on the following prompt: 
            
            "${prompt}"
            
            The application should have the following characteristics:
            - Completion Level: ${completionLevel}
            - It should be a React-based application using modern web technologies
            - Include 3-5 specific coding challenges/bugs for the user to fix
            - Each challenge should have clear error patterns that are educational to solve
            - IMPORTANT: Include comments that explain what needs to be fixed as TODOs
            
            Format your response as a valid JSON object (without any markdown formatting) with the following structure:
            {
              "projectName": "Name of the project",
              "description": "Description of the application",
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
      console.log(`Gemini API returned status: ${geminiResponse.status}`);
      if (geminiResponse.status === 429) {
        console.log("Gemini API rate limiting hit, trying OpenAI fallback");
        throw new Error("Rate limit reached");
      }
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }
    
    const geminiData = await geminiResponse.json();
    return { source: "gemini", data: geminiData };
    
  } catch (error) {
    console.log("Gemini API failed, trying OpenAI fallback", error.message);
    
    // Try OpenAI as fallback
    try {
      const openAiKey = Deno.env.get("OPENAI_API_KEY");
      if (!openAiKey) {
        console.error("OpenAI API key not configured for fallback");
        throw new Error("All AI providers unavailable");
      }
      
      console.log("Calling OpenAI API as fallback");
      
      const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openAiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // Using a smaller, more reliable model
          messages: [
            {
              role: "system",
              content: `You are an expert software engineer creating educational coding challenges for a learning platform.`
            },
            {
              role: "user", 
              content: `Create an intentionally incomplete React application based on this prompt: "${prompt}"
              
The application should have the following characteristics:
- Completion Level: ${completionLevel}
- It should be a React-based application using modern web technologies
- Include 3-5 specific coding challenges/bugs for the user to fix
- Each challenge should have clear error patterns that are educational to solve
- IMPORTANT: Include comments that explain what needs to be fixed as TODOs

Format your response as a valid JSON object (without any markdown formatting) with the following structure:
{
  "projectName": "Name of the project",
  "description": "Description of the application",
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
}`
            }
          ],
          temperature: 0.7,
          max_tokens: 4096
        })
      });
      
      if (!openAiResponse.ok) {
        throw new Error(`OpenAI API error: ${openAiResponse.status}`);
      }
      
      const openAiData = await openAiResponse.json();
      return { source: "openai", data: openAiData };
      
    } catch (openAiError) {
      console.error("Both Gemini and OpenAI failed:", openAiError);
      throw new Error("Application generation services temporarily unavailable. Please try again later.");
    }
  }
};

// Function to extract app data from AI response
const extractAppDataFromAIResponse = (response) => {
  if (response.source === "gemini") {
    const textContent = response.data.candidates[0].content.parts[0].text;
    // Extract JSON using regex pattern
    const jsonPattern = /\{[\s\S]*?\}(?=\s*$|\s*```)/;
    const jsonMatches = textContent.match(jsonPattern);
    
    if (jsonMatches && jsonMatches[0]) {
      const jsonContent = jsonMatches[0];
      try {
        return JSON.parse(jsonContent);
      } catch (error) {
        console.error("Error parsing Gemini JSON:", error);
        throw new Error("Could not parse generated application data");
      }
    } else {
      throw new Error("Could not extract application data from Gemini response");
    }
  } else if (response.source === "openai") {
    try {
      // Extract from OpenAI response
      const content = response.data.choices[0].message.content;
      // Try to find JSON in the content
      const jsonMatch = content.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not extract JSON from OpenAI response");
      }
    } catch (error) {
      console.error("Error parsing OpenAI JSON:", error);
      throw new Error("Could not parse generated application data");
    }
  } else {
    throw new Error("Unknown AI response format");
  }
};

serve(async (req) => {
  console.log("Generate app function called");
  
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    console.log("Request data:", JSON.stringify(requestData));
    
    const { prompt, completionLevel = 'intermediate' } = requestData;

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
    
    // Get application design with better error handling
    let appDesign;
    try {
      console.log("Getting app design");
      try {
        appDesign = await getDesignWithPerplexity(processedPrompt);
      } catch (perplexityError) {
        console.log("Perplexity failed, using fallback design");
        appDesign = createDefaultAppDesign(processedPrompt);
      }
      console.log("Successfully received app design:", appDesign.projectName);
    } catch (error) {
      console.error("All app design methods failed:", error);
      // Create a basic default design as absolute fallback
      appDesign = createDefaultAppDesign(processedPrompt);
    }

    const projectId = crypto.randomUUID();
    
    // Generate implementation with challenges using our fallback system
    let appData;
    try {
      console.log("Generating app implementation");
      
      // Use our enhanced fallback generator
      const aiResponse = await generateAppWithFallback(processedPrompt, completionLevel);
      appData = extractAppDataFromAIResponse(aiResponse);
      
      console.log("Successfully generated app implementation");
    } catch (error) {
      console.error("Error generating app:", error);
      
      // Create an absolute minimum fallback app if everything else fails
      console.log("Using minimal fallback app");
      appData = {
        projectName: appDesign.projectName || "Simple React App",
        description: `A simple app based on "${prompt}"`,
        fileStructure: {
          "src": {
            "App.jsx": `import React from 'react';\n\nfunction App() {\n  return (\n    <div className="App">\n      <header className="App-header">\n        <h1>${appDesign.projectName || "Simple React App"}</h1>\n        <p>${appDesign.description || "A simple React application"}</p>\n        {/* TODO: Add more components here */}\n      </header>\n    </div>\n  );\n}\n\nexport default App;`,
            "index.jsx": `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\n\nconst root = ReactDOM.createRoot(document.getElementById('root'));\nroot.render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);`
          }
        },
        challenges: [
          {
            id: "challenge-1",
            title: "Complete the App Component",
            description: "Add more components to make this application functional.",
            filesPaths: ["src/App.jsx"]
          }
        ],
        explanation: "This is a simple starter app with basic React components."
      };
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
    
    // Prepare first step guidance
    const firstStepGuidance = prepareFirstStepGuidance(appData);
    
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
      
      // Store project in database with both Perplexity design and Gemini implementation
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
            explanation: appData.explanation || "Learn by fixing the issues in this application",
            designInfo: {
              perplexityDesign: appDesign
            }
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

    // When returning the generated app data to the client, include files so they can be used for dynamic guidance
    return new Response(JSON.stringify({
      projectId,
      projectName: appData.projectName,
      description: appData.description,
      files: files,
      challenges: appData.challenges || [],
      explanation: appData.explanation || "Learn by fixing the issues in this application",
      designInfo: {
        perplexityDesign: appDesign
      },
      firstStepGuidance: firstStepGuidance
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error in generate-app function:", error);
    return new Response(JSON.stringify({ 
      error: "App generation temporarily unavailable. Please try with a simpler prompt or try again in a few minutes." 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
