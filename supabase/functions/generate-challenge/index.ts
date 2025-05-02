
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Configuration, OpenAI } from "https://esm.sh/openai@4.0.0";
import { corsHeaders } from "../_shared/cors.ts";

interface ChallengeRequest {
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

interface ProjectFile {
  path: string;
  content: string;
  isComplete: boolean;
}

interface GeneratedProject {
  projectId: string;
  projectName: string;
  description: string;
  files: ProjectFile[];
  challenges: Challenge[];
  explanation: string;
}

serve(async (req) => {
  console.log("Generate code challenge function called");
  
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    console.log("Request data:", JSON.stringify(requestData));
    
    const { prompt, completionLevel = 'intermediate', challengeType = 'fullstack' } = requestData as ChallengeRequest;

    if (!prompt) {
      console.error("Missing prompt in request");
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Configure OpenAI client
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    
    if (!openaiApiKey) {
      throw new Error("OpenAI API key is required");
    }
    
    const configuration = new Configuration({
      apiKey: openaiApiKey,
    });
    const openai = new OpenAI({ apiKey: openaiApiKey });
    
    // Generate project structure with challenges
    const systemPrompt = `You are an expert software developer and educator specializing in creating educational coding projects.
    
Your task is to create an intentionally incomplete application with strategic gaps for learning purposes based on the user's prompt: "${prompt}".

The application should be mostly working but have specific challenges that the user needs to complete as part of their learning process.

For the skill level "${completionLevel}", create an appropriate number of challenges (3-6 challenges).

Each generated file should be syntactically correct and runnable, even if functionally incomplete.

Return a JSON object with the following structure:
{
  "projectId": "string", // A unique ID for the project
  "projectName": "string", // A descriptive name for the project
  "description": "string", // Brief description of what the project does
  "files": [ // Array of code files
    {
      "path": "string", // File path (e.g., "src/components/App.js")
      "content": "string", // Complete code content for the file
      "isComplete": boolean // Whether the file has missing implementations (false if it contains challenges)
    }
  ],
  "challenges": [ // Array of learning challenges
    {
      "id": "string", // Unique ID for the challenge
      "title": "string", // Short descriptive title
      "description": "string", // Detailed description of what needs to be implemented
      "difficulty": "easy|medium|hard", // Challenge difficulty
      "type": "implementation|bugfix|feature", // Type of challenge
      "filesPaths": ["string"] // Array of file paths related to this challenge
    }
  ],
  "explanation": "string" // Brief explanation of the project structure and learning goals
}

For the "challenges" field, create specialized learning tasks that require the user to implement missing functionalities.
Mark relevant code sections with TODO comments pointing to what needs to be implemented.
Ensure each challenge is clearly defined and has educational value.
`;

    console.log("Making API request to generate code challenge");
    
    // Call OpenAI to generate the project structure
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const generatedContent = completion.choices[0]?.message?.content || "";
    console.log("Generated code challenge response received");
    
    // Parse the generated content to extract the JSON
    try {
      // Find JSON in the response
      const jsonMatch = generatedContent.match(/```json\n([\s\S]*?)\n```/) || 
                         generatedContent.match(/```([\s\S]*?)```/) ||
                         generatedContent.match(/{[\s\S]*"projectId"[\s\S]*}/);
                         
      let jsonString = "";
      
      if (jsonMatch) {
        jsonString = jsonMatch[1] || jsonMatch[0];
      } else {
        jsonString = generatedContent;
      }
      
      // Clean up and parse the JSON
      jsonString = jsonString.replace(/```json/g, "").replace(/```/g, "").trim();
      const project = JSON.parse(jsonString) as GeneratedProject;
      
      console.log(`Successfully generated project "${project.projectName}" with ${project.challenges.length} challenges`);
      
      return new Response(JSON.stringify({
        ...project,
        success: true
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (parseError) {
      console.error("Error parsing generated content:", parseError);
      console.log("Generated content:", generatedContent);
      throw new Error("Failed to parse generated project structure");
    }

  } catch (error: any) {
    console.error("Error in generate-challenge function:", error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Unknown error occurred"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
