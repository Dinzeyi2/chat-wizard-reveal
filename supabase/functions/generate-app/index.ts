
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface AppGenerationRequest {
  prompt: string;
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
    
    const { prompt } = requestData as AppGenerationRequest;

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
    
    const projectName = `project-${Date.now()}`;

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      console.error("Anthropic API key not configured");
      return new Response(JSON.stringify({ error: "Anthropic API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // Generate architecture using Anthropic API with reduced token limit to ensure we stay within model limits
    console.log("Calling Anthropic API for architecture generation");
    let architectureResponse;
    try {
      architectureResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20240620",
          max_tokens: 3000, // Further reduced to ensure we stay well within limits
          temperature: 0.7,
          system: `You are an expert full stack developer specializing in modern web applications.
          When given a prompt for a web application, you will create a detailed architecture plan with:
          1. A list of all files needed (frontend, backend, configuration)
          2. Technologies to use (React, Next.js, Express, etc.)
          3. Project structure
          4. Component hierarchy
          5. Data models
          
          IMPORTANT: Keep your response concise and within 3000 tokens.
          Format your response as a valid, complete JSON object with the following structure only:
          {
            "projectName": "name-of-project",
            "description": "Brief description",
            "technologies": ["tech1", "tech2"],
            "fileStructure": {
              "frontend": ["file1", "file2"],
              "backend": ["file1", "file2"],
              "config": ["file1", "file2"]
            }
          }
          
          Make sure the JSON is complete and valid, with no trailing commas or syntax errors.
          Do not include any explanatory text outside the JSON object.`,
          messages: [
            {
              role: "user",
              content: processedPrompt
            }
          ]
        })
      });
    } catch (error) {
      console.error("Error making Anthropic API request:", error);
      return new Response(JSON.stringify({ error: `Failed to contact Anthropic API: ${error.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!architectureResponse.ok) {
      const errorText = await architectureResponse.text();
      console.error(`Anthropic API error (${architectureResponse.status}): ${errorText}`);
      return new Response(JSON.stringify({ error: `Anthropic API error (${architectureResponse.status})` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log("Architecture response received");
    const architectureData = await architectureResponse.json();
    
    if (!architectureData || !architectureData.content || architectureData.content.length === 0) {
      console.error("Empty or invalid response from Anthropic API");
      return new Response(JSON.stringify({ error: "Empty or invalid response from Anthropic API" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    const architectureContent = architectureData.content[0].text;
    console.log("Architecture content received:", architectureContent.substring(0, 200) + "...");
    
    let architecture;
    
    try {
      // Improved JSON parsing with better error handling
      // Try to clean the response before parsing if needed
      let jsonToParse = architectureContent;
      
      // Remove any markdown code block markers if present
      if (jsonToParse.includes("```json")) {
        jsonToParse = jsonToParse.replace(/```json\n?|\n?```/g, "");
      }
      
      // Clean the JSON string - remove any non-JSON content before or after
      const jsonStart = jsonToParse.indexOf('{');
      const jsonEnd = jsonToParse.lastIndexOf('}');
      
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        jsonToParse = jsonToParse.substring(jsonStart, jsonEnd + 1);
      }
      
      console.log("Cleaned JSON for parsing:", jsonToParse.substring(0, 100) + "...");
      architecture = JSON.parse(jsonToParse);
      console.log("Successfully parsed JSON");
    } catch (jsonError) {
      console.error("Failed to parse JSON response:", jsonError);
      
      // Return a more user-friendly error with instruction for retry
      return new Response(JSON.stringify({ 
        error: "Failed to generate application architecture. Please try again with a simpler prompt.",
        technicalDetails: `JSON parse error: ${jsonError.message}`,
        snippet: architectureContent.substring(0, 300) // Include part of the content for debugging
      }), {
        status: 400, // Changed from 502 to 400 to indicate a client-side retry might help
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Generate files based on architecture
    if (!architecture || !architecture.fileStructure) {
      console.error("Invalid architecture structure received");
      return new Response(JSON.stringify({ 
        error: "Invalid architecture structure", 
        architecture: architecture || "null" 
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    const files = [];
    
    // Flatten file structure
    const fileList = [];
    for (const section in architecture.fileStructure) {
      for (const file of architecture.fileStructure[section]) {
        fileList.push(file);
      }
    }

    // Get a smaller batch of files (reducing from 10 to 5 to minimize API calls)
    const batchSize = 5;
    const filesToGenerate = fileList.slice(0, batchSize);
    console.log(`Generating ${filesToGenerate.length} files`);
    
    for (const filePath of filesToGenerate) {
      try {
        console.log(`Generating file: ${filePath}`);
        const fileContent = await generateFileContent(filePath, architecture, processedPrompt);
        files.push({
          path: filePath,
          content: fileContent
        });
      } catch (fileError) {
        console.error(`Error generating file ${filePath}:`, fileError);
        files.push({
          path: filePath,
          content: `// Error generating content: ${fileError.message}`
        });
      }
    }

    // Create package.json
    try {
      console.log("Generating package.json");
      const packageJson = await generatePackageJson(architecture);
      files.push({
        path: "package.json",
        content: packageJson
      });
    } catch (packageError) {
      console.error("Error generating package.json:", packageError);
      // Use a simplified fallback package.json
      files.push({
        path: "package.json",
        content: `{ 
  "name": "${architecture.projectName || 'generated-app'}",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^13.4.0"
  }
}`
      });
    }

    // Generate explanation of the codebase
    let explanation;
    try {
      explanation = await generateExplanation(architecture, files);
    } catch (error) {
      console.error("Error generating explanation:", error);
      explanation = "Failed to generate explanation due to an error.";
    }

    console.log(`Successfully generated ${files.length} files`);
    return new Response(JSON.stringify({
      projectName: architecture.projectName,
      description: architecture.description,
      explanation: explanation,
      files: files
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Fatal error in generate-app function:", error);
    return new Response(JSON.stringify({ error: `${error.message}`, stack: error.stack }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

async function generateFileContent(filePath: string, architecture: any, originalPrompt: string): Promise<string> {
  const fileExtension = filePath.substring(filePath.lastIndexOf(".") || filePath.length);
  const fileName = filePath.substring(filePath.lastIndexOf("/") + 1 || 0);
  const relativeDir = filePath.substring(0, filePath.lastIndexOf("/") || 0);

  const fileTypeMap: Record<string, string> = {
    ".js": "JavaScript",
    ".jsx": "React JSX",
    ".ts": "TypeScript",
    ".tsx": "React TypeScript",
    ".css": "CSS",
    ".scss": "SCSS",
    ".html": "HTML",
    ".json": "JSON",
    ".md": "Markdown",
  };

  const fileType = fileTypeMap[fileExtension] || "Code";

  try {
    const fileResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") || "",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 3000, // Further reduced to ensure we stay within the model's limits
        temperature: 0.7,
        system: `You are an expert developer specializing in creating high-quality code files.
        Generate ONLY the complete code for this specific file.
        Do not include explanations or comments outside the code.
        Make sure the code is production-ready, follows best practices, and implements modern patterns.
        IMPORTANT: Keep your response within 3000 tokens.
        If generating React components with shadcn/ui, use the proper import syntax and components.`,
        messages: [
          {
            role: "user",
            content: `Generate code for the file "${fileName}" in the directory "${relativeDir}" for this project:
            
            Project Name: ${architecture.projectName}
            Project Description: ${architecture.description}
            Technologies: ${architecture.technologies.join(", ")}
            
            Original request: "${originalPrompt}"
            
            Generate the complete ${fileType} code for this file. Consider its role within the application architecture.
            Keep the implementation focused and within token limits.`
          }
        ]
      }),
    });

    if (!fileResponse.ok) {
      const errorText = await fileResponse.text();
      throw new Error(`Anthropic API error (${fileResponse.status}) when generating file: ${errorText}`);
    }

    const fileData = await fileResponse.json();
    
    if (!fileData || !fileData.content || fileData.content.length === 0) {
      throw new Error(`Empty or invalid response for file ${fileName}`);
    }
    
    const fileContent = fileData.content[0].text;
    
    // Clean up the code (remove markdown code blocks if present)
    let cleanedContent = fileContent;
    if (fileContent.includes("```")) {
      // More robust code block detection and removal
      const codeBlockRegex = /```(?:\w+)?\n([\s\S]+?)\n```/;
      const match = fileContent.match(codeBlockRegex);
      if (match && match[1]) {
        cleanedContent = match[1];
      } else {
        // Fallback if regex doesn't match but we still have code blocks
        cleanedContent = fileContent
          .replace(/^```(?:\w+)?/, "")
          .replace(/```$/, "")
          .trim();
      }
    }

    return cleanedContent;
  } catch (error) {
    console.error(`Error generating file ${filePath}:`, error);
    return `// Error generating content for ${filePath}: ${error.message}`;
  }
}

async function generatePackageJson(architecture: any): Promise<string> {
  try {
    const packageResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") || "",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 2000,
        temperature: 0.7,
        system: `You are an expert in JavaScript/Node.js development.
        Generate a complete package.json file for a project with the following specifications.
        The package.json should include all necessary dependencies, scripts, and configuration.
        Format your response as valid JSON only, without any code blocks or explanatory text.`,
        messages: [
          {
            role: "user",
            content: `Generate a complete package.json file for this project:
            
            Project Name: ${architecture.projectName}
            Technologies: ${architecture.technologies.join(", ")}
            
            Include all necessary dependencies for these technologies, appropriate scripts (dev, build, start, etc.),
            and any other configuration needed. If using shadcn/ui, include all required dependencies.`
          }
        ]
      })
    });

    if (!packageResponse.ok) {
      const errorText = await packageResponse.text();
      throw new Error(`Anthropic API error (${packageResponse.status}) when generating package.json: ${errorText}`);
    }

    const packageData = await packageResponse.json();
    
    if (!packageData || !packageData.content || packageData.content.length === 0) {
      throw new Error("Empty or invalid response for package.json");
    }
    
    const packageContent = packageData.content[0].text;
    
    // Clean up the JSON (remove markdown code blocks if present)
    let cleanedContent = packageContent;
    if (packageContent.includes("```")) {
      const jsonBlockRegex = /```(?:json)?\n([\s\S]+?)\n```/;
      const match = packageContent.match(jsonBlockRegex);
      if (match && match[1]) {
        cleanedContent = match[1];
      } else {
        cleanedContent = packageContent
          .replace(/^```(?:json)?/, "")
          .replace(/```$/, "")
          .trim();
      }
    }

    // Validate that we have valid JSON
    JSON.parse(cleanedContent); // This will throw if the JSON is invalid
    return cleanedContent;
  } catch (error) {
    console.error("Error generating package.json:", error);
    return `{ 
  "name": "${architecture.projectName || 'generated-app'}",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^13.4.0"
  }
}`;
  }
}

async function generateExplanation(architecture: any, files: any[]): Promise<string> {
  try {
    // Create a summary of the files
    const fileSummary = files.map(f => `${f.path}`).join('\n');
    
    const explanationResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert software developer explaining a codebase to a user. Provide a clear, concise explanation of the generated application, its architecture, and key features."
          },
          {
            role: "user",
            content: `This application "${architecture.projectName}" was generated with the following description: "${architecture.description}"
            
            Technologies: ${architecture.technologies.join(", ")}
            
            Generated files:
            ${fileSummary}
            
            Please provide a clear, concise explanation of:
            1. The overall architecture of the application
            2. The key components and their purposes
            3. The main features implemented
            4. How the technologies work together
            5. What would be needed to extend this application
            
            Keep your explanation technical but accessible to developers of all levels.`
          }
        ],
        max_tokens: 1000
      })
    });

    if (!explanationResponse.ok) {
      const errorText = await explanationResponse.text();
      throw new Error(`OpenAI API error (${explanationResponse.status}): ${errorText}`);
    }

    const data = await explanationResponse.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error generating explanation:", error);
    return "An explanation of this codebase could not be generated at this time.";
  }
}
