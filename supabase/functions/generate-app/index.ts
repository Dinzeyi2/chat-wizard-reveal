
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
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json() as AppGenerationRequest;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Process and potentially summarize input
    const processedPrompt = await processInput(prompt);
    console.log("Processed prompt length (chars):", processedPrompt.length);
    
    const projectName = `project-${Date.now()}`;
    
    // Generate architecture using Anthropic API with enforced output token limit
    const architectureResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") || "",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 5000,
        temperature: 0.7,
        system: `You are an expert full stack developer specializing in modern web applications.
        When given a prompt for a web application, you will create a detailed architecture plan with:
        1. A list of all files needed (frontend, backend, configuration)
        2. Technologies to use (React, Next.js, Express, etc.)
        3. Project structure
        4. Component hierarchy
        5. Data models
        
        IMPORTANT: Keep your response concise and within 5000 tokens.
        
        Format your response as JSON with the following structure:
        {
          "projectName": "name-of-project",
          "description": "Brief description",
          "technologies": ["tech1", "tech2"],
          "fileStructure": {
            "frontend": ["file1", "file2"],
            "backend": ["file1", "file2"],
            "config": ["file1", "file2"]
          }
        }`,
        messages: [
          {
            role: "user",
            content: processedPrompt
          }
        ]
      })
    });

    const architectureData = await architectureResponse.json();
    const architectureContent = architectureData.content[0].text;
    let architecture;
    
    try {
      architecture = JSON.parse(architectureContent);
    } catch (error) {
      // Handle case where response isn't valid JSON
      const jsonStart = architectureContent.indexOf('{');
      const jsonEnd = architectureContent.lastIndexOf('}');
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        const jsonPart = architectureContent.substring(jsonStart, jsonEnd + 1);
        architecture = JSON.parse(jsonPart);
      } else {
        throw new Error("Failed to parse architecture JSON");
      }
    }

    // Generate files based on architecture
    const files = [];
    
    // Flatten file structure
    const fileList = [];
    for (const section in architecture.fileStructure) {
      for (const file of architecture.fileStructure[section]) {
        fileList.push(file);
      }
    }

    // Get a batch of files (limit to 10 for demo purposes)
    const batchSize = 10;
    const filesToGenerate = fileList.slice(0, batchSize);
    
    for (const filePath of filesToGenerate) {
      const fileContent = await generateFileContent(filePath, architecture, truncatedPrompt);
      files.push({
        path: filePath,
        content: fileContent
      });
    }

    // Create package.json
    const packageJson = await generatePackageJson(architecture);
    files.push({
      path: "package.json",
      content: packageJson
    });

    return new Response(JSON.stringify({
      projectName: architecture.projectName,
      description: architecture.description,
      files: files
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
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

  const fileResponse = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") || "",
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-3-sonnet-20240229",
      max_tokens: 5000, // Enforcing 5000 token limit for output
      temperature: 0.7,
      system: `You are an expert developer specializing in creating high-quality code files.
      Generate ONLY the complete code for this specific file.
      Do not include explanations or comments outside the code.
      Make sure the code is production-ready, follows best practices, and implements modern patterns.
      IMPORTANT: Keep your response within 5000 tokens.
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
    })
  });

  const fileData = await fileResponse.json();
  const fileContent = fileData.content[0].text;
  
  // Clean up the code (remove markdown code blocks if present)
  let cleanedContent = fileContent;
  if (fileContent.startsWith("```") && fileContent.endsWith("```")) {
    cleanedContent = fileContent
      .replace(/^```(\w+)?/, "")
      .replace(/```$/, "")
      .trim();
  }

  return cleanedContent;
}

async function generatePackageJson(architecture: any): Promise<string> {
  const packageResponse = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") || "",
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-3-opus-20240229",
      max_tokens: 2000,
      temperature: 0.7,
      system: `You are an expert in JavaScript/Node.js development.
      Generate a complete package.json file for a project with the following specifications.
      The package.json should include all necessary dependencies, scripts, and configuration.
      Format your response as valid JSON only.`,
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

  const packageData = await packageResponse.json();
  const packageContent = packageData.content[0].text;
  
  // Clean up the JSON (remove markdown code blocks if present)
  let cleanedContent = packageContent;
  if (packageContent.startsWith("```") && packageContent.endsWith("```")) {
    cleanedContent = packageContent
      .replace(/^```(\w+)?/, "")
      .replace(/```$/, "")
      .trim();
  }

  return cleanedContent;
}
