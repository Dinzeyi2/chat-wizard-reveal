
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface DesignRequest {
  prompt: string;
  action: "find" | "customize";
  designData?: any;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    const { prompt, action, designData } = requestData as DesignRequest;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Get API keys from environment
    const perplexityApiKey = Deno.env.get("PERPLEXITY_API_KEY");
    const claudeApiKey = Deno.env.get("CLAUDE_API_KEY");

    if (!perplexityApiKey && action === "find") {
      return new Response(JSON.stringify({ error: "Perplexity API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!claudeApiKey && action === "customize") {
      return new Response(JSON.stringify({ error: "Claude API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Direct Claude fallback if Perplexity is not available
    if (action === "find" && !perplexityApiKey && claudeApiKey) {
      // Call Claude API as a fallback
      const claudeResponse = await callClaudeAPI({
        success: true,
        requirements: {
          originalPrompt: prompt,
          componentType: "component",
          framework: "react",
          designSystem: "shadcn/ui",
          styles: ["beautiful"],
          isFullStack: false,
        },
        code: "// Claude will generate code based on the prompt",
        metadata: {
          query: prompt,
          designSystem: "shadcn/ui",
        }
      }, claudeApiKey);
      
      return new Response(JSON.stringify(claudeResponse), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (action === "find") {
      // Call Perplexity API to find design code
      const response = await callPerplexityAPI(prompt, perplexityApiKey!);
      
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } else if (action === "customize") {
      // Call Claude API to customize code
      if (!designData) {
        return new Response(JSON.stringify({ error: "Design data is required for customization" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      const response = await callClaudeAPI(designData, claudeApiKey!);
      
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  } catch (error) {
    console.error("Error in design-code function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

// Function to call Perplexity API
async function callPerplexityAPI(prompt: string, apiKey: string) {
  try {
    console.log("Calling Perplexity API with prompt:", prompt);
    
    // Parse the prompt to identify requirements
    const requirements = parseUserPrompt(prompt);
    
    // Generate search queries
    const searchQueries = generateSearchQueries(requirements);
    const topQuery = searchQueries[0]; // Just use the top query for simplicity
    
    // Call Perplexity API
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant for finding UI component code. Focus on finding complete, well-implemented components from high-quality design systems and UI libraries."
          },
          {
            role: "user",
            content: `Find the full implementation code for ${topQuery}. Include all necessary imports and CSS. Return the complete code with any explanations of how it works. Focus on production-quality implementations from official documentation or high-quality examples.`
          }
        ],
        max_tokens: 4000,
        temperature: 0.2,
        top_p: 0.9,
        frequency_penalty: 1,
        presence_penalty: 0
      })
    });
    
    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Extract code from the response
    const content = result.choices[0].message.content;
    const codeMatch = content.match(/```(?:jsx|js|javascript|tsx|ts|typescript|react)([\s\S]*?)```/);
    
    if (!codeMatch) {
      throw new Error("No code found in the API response");
    }
    
    const code = codeMatch[1].trim();
    
    // Determine component type and design system from the code
    let designSystem = "unknown";
    if (content.toLowerCase().includes("shadcn")) designSystem = "shadcn/ui";
    else if (content.toLowerCase().includes("tailwind")) designSystem = "tailwindcss";
    else if (content.toLowerCase().includes("material")) designSystem = "material-ui";
    else if (content.toLowerCase().includes("chakra")) designSystem = "chakra-ui";
    
    return {
      success: true,
      requirements,
      code,
      metadata: {
        designSystem,
        componentType: requirements.componentType,
        query: topQuery
      }
    };
  } catch (error: any) {
    console.error("Perplexity API error:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred"
    };
  }
}

// Function to call Claude API
async function callClaudeAPI(designData: any, apiKey: string) {
  try {
    console.log("Calling Claude API for code customization");
    
    // Create prompt for Claude based on the design data
    const prompt = createPromptForClaude(designData);
    
    // Call Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 4000
      })
    });
    
    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Process Claude response
    return processClaudeResponse(result, designData);
  } catch (error: any) {
    console.error("Claude API error:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred"
    };
  }
}

// Parse user prompt to identify requirements
function parseUserPrompt(prompt: string) {
  const promptLower = prompt.toLowerCase();
  
  // Component types to look for with their keywords
  const componentTypes = [
    { name: "dashboard", keywords: ["dashboard", "admin panel", "analytics dashboard", "stats dashboard", "admin dashboard"] },
    { name: "form", keywords: ["form", "input form", "contact form", "sign-up form", "login form", "registration form", "survey form"] },
    { name: "table", keywords: ["table", "data table", "data grid", "spreadsheet", "datatable", "data display"] },
    { name: "card", keywords: ["card", "product card", "pricing card", "info card", "profile card", "card component"] },
    { name: "navbar", keywords: ["navbar", "navigation", "header", "menu", "nav", "navigation bar", "top bar"] },
    // ... more component types could be added here
  ];
  
  // Frameworks to look for
  const frameworks = [
    { name: "react", keywords: ["react", "reactjs", "react.js", "react component"] },
    { name: "tailwind", keywords: ["tailwind", "tailwindcss", "tailwind css"] },
    // ... more frameworks could be added here
  ];
  
  // Design systems to look for
  const designSystems = [
    { name: "shadcn/ui", keywords: ["shadcn", "shadcn/ui", "shadcn ui"] },
    { name: "material-ui", keywords: ["mui", "material ui", "material-ui"] },
    // ... more design systems could be added here
  ];
  
  // Style preferences to look for
  const stylePreferences = [
    { name: "white", keywords: ["white", "light", "bright", "clean", "clear", "minimal white"] },
    { name: "dark", keywords: ["dark", "black", "night mode", "dark mode", "dark theme"] },
    { name: "beautiful", keywords: ["beautiful", "pretty", "elegant", "attractive", "stunning", "gorgeous"] },
    { name: "minimal", keywords: ["minimal", "minimalist", "simple", "clean", "sleek"] },
    // ... more style preferences could be added here
  ];
  
  // Find the best matching component type
  const componentType = findBestMatch(promptLower, componentTypes) || "component";
  
  // Find framework preference (if any)
  const framework = findBestMatch(promptLower, frameworks);
  
  // Find design system preference (if any)
  const designSystem = findBestMatch(promptLower, designSystems);
  
  // Find style preferences
  const styles = stylePreferences
    .filter(style => style.keywords.some(keyword => promptLower.includes(keyword)))
    .map(style => style.name);
  
  return {
    originalPrompt: prompt,
    componentType,
    framework,
    designSystem,
    styles,
    isFullStack: promptLower.includes("full stack") || 
                 promptLower.includes("fullstack") || 
                 promptLower.includes("full-stack")
  };
}

// Find the best matching category from a list
function findBestMatch(text: string, categories: { name: string; keywords: string[] }[]) {
  let bestMatch = null;
  let bestScore = 0;
  
  for (const category of categories) {
    // Count how many keywords match
    const matchingKeywords = category.keywords.filter(keyword => 
      text.includes(keyword.toLowerCase())
    );
    
    const score = matchingKeywords.length;
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = category.name;
    }
  }
  
  return bestScore > 0 ? bestMatch : null;
}

// Generate search queries based on requirements
function generateSearchQueries(requirements: any) {
  const queries = [];
  const { componentType, framework, designSystem, styles } = requirements;
  
  // Base query elements
  const styleTerms = styles.length > 0 ? styles.join(" ") : "";
  
  // Create specific queries
  if (framework && designSystem) {
    queries.push(`${framework} ${componentType} ${designSystem} component code example ${styleTerms}`);
  } else if (designSystem) {
    queries.push(`${designSystem} ${componentType} component code example ${styleTerms}`);
  } else if (framework) {
    queries.push(`${framework} ${componentType} component code example ${styleTerms}`);
  }
  
  // Add general queries
  queries.push(
    `best ${componentType} component designs with code ${styleTerms}`,
    `${componentType} component implementation code example ${styleTerms}`,
    `shadcn/ui ${componentType} component code example ${styleTerms}`,
    `react ${componentType} component implementation ${styleTerms}`
  );
  
  // Remove empty queries and return
  return queries.filter(q => q.trim() !== "");
}

// Create prompt for Claude based on the design data
function createPromptForClaude(designData: any) {
  const { requirements, code } = designData;
  const { componentType = "component", styles = [], isFullStack = false, originalPrompt = "" } = requirements || {};
  
  // Determine style preferences
  const isWhite = styles.includes('white');
  const isDark = styles.includes('dark');
  const isBeautiful = styles.includes('beautiful');
  const isMinimal = styles.includes('minimal');
  
  // Build the style instructions
  let styleInstructions = [];
  if (isWhite) styleInstructions.push("Use a clean white theme with light backgrounds");
  if (isDark) styleInstructions.push("Use a dark theme with dark backgrounds and appropriate contrast");
  if (isBeautiful) styleInstructions.push("Make the component beautiful with elegant styling and subtle animations");
  if (isMinimal) styleInstructions.push("Keep the component minimal and clean, focusing on essential elements");
  
  // Default to white and beautiful if no styles specified
  if (styleInstructions.length === 0) {
    styleInstructions.push("Use a clean white theme with light backgrounds");
    styleInstructions.push("Make the component beautiful with elegant styling and subtle animations");
  }
  
  return `
You are an expert UI developer specializing in creating beautiful React applications.

# TASK
I need you to ${code ? 'customize and enhance' : 'create'} ${code ? 'the provided' : 'a new'} ${componentType} component code based on specific requirements.

${code ? `
# ORIGINAL CODE
\`\`\`jsx
${code}
\`\`\`
` : ''}

# USER REQUIREMENTS
"${originalPrompt}"

# STYLE REQUIREMENTS
${styleInstructions.join("\n")}

# TECHNICAL REQUIREMENTS
- ${code ? 'Maintain the same general component structure' : 'Create a new component structure'}
- Make the component fully responsive
- Ensure the code is clean, well-organized, and follows best practices
${isFullStack ? "- Add a simple backend API endpoint code that would support this component" : ""}

# INSTRUCTIONS
1. ${code ? 'Customize the existing code to match the style requirements' : 'Create a new component based on the requirements'}
2. Enhance the component with better organization, responsiveness, and interactivity
3. ${code ? 'Do not remove existing functionality, only enhance and style it' : 'Implement all functionality described in the requirements'}
4. Return the complete, ${code ? 'customized' : 'new'} component code
${isFullStack ? `5. Include a separate code block with a simple backend implementation` : ""}

# EXPECTED RESPONSE FORMAT
Provide the ${code ? 'customized' : 'new'} code in the following format:

\`\`\`jsx
// Frontend code here...
\`\`\`

${isFullStack ? "Then provide the backend code (if required):\n\n```javascript\n// Backend code here...\n```" : ""}

Finally, provide a brief explanation of the ${code ? 'changes you made' : 'component you created'}.
`;
}

// Process Claude API response
function processClaudeResponse(response: any, designData: any) {
  try {
    // Extract content from Claude response
    const content = response.content?.[0]?.text || "";
    
    // Extract code blocks from the response
    const codeBlockRegex = /```(?:jsx|js|javascript|typescript|tsx|ts)([\s\S]*?)```/g;
    const matches = [...content.matchAll(codeBlockRegex)];
    
    if (matches.length === 0) {
      throw new Error("No code blocks found in Claude's response");
    }
    
    // Extract frontend code (first code block)
    const frontendCode = matches[0][1].trim();
    
    // Extract backend code if present (second code block)
    let backendCode = null;
    if (matches.length > 1) {
      backendCode = matches[1][1].trim();
    }
    
    // Extract explanation (text after the last code block)
    const lastCodeBlockEnd = matches[matches.length - 1].index! + matches[matches.length - 1][0].length;
    const explanation = content.substring(lastCodeBlockEnd).trim();
    
    return {
      success: true,
      originalDesign: designData,
      customizedCode: {
        frontend: frontendCode,
        backend: backendCode
      },
      explanation: explanation
    };
  } catch (error: any) {
    console.error("Error processing Claude response:", error);
    return {
      success: false,
      error: error.message || "Failed to process Claude's response"
    };
  }
}
