
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { message, projectId, lastModification } = await req.json()
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    const claudeApiKey = Deno.env.get('ANTHROPIC_API_KEY')

    if (!openAIApiKey) {
      console.error('OpenAI API key is not configured')
      return new Response(JSON.stringify({ 
        error: 'Missing API key',
        response: 'I need an OpenAI API key to work properly. Please configure it in your Supabase project settings.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if this is a code generation request
    const isCodeGenerationRequest = 
      message.toLowerCase().includes('create') || 
      message.toLowerCase().includes('generate') ||
      message.toLowerCase().includes('build') || 
      message.toLowerCase().includes('implement') ||
      message.toLowerCase().includes('develop') ||
      message.toLowerCase().includes('design') ||
      message.toLowerCase().includes('code') ||
      message.toLowerCase().includes('make a') ||
      message.toLowerCase().includes('make me') ||
      message.toLowerCase().includes('write') ||
      message.toLowerCase().includes('component') ||
      message.toLowerCase().includes('function') ||
      message.toLowerCase().includes('class') ||
      message.toLowerCase().includes('module') ||
      message.toLowerCase().includes('interface') ||
      message.toLowerCase().includes('feature');

    // Check if this is a modification request for an existing app
    const isModificationRequest = 
      projectId && (
        message.toLowerCase().includes('change') || 
        message.toLowerCase().includes('modify') || 
        message.toLowerCase().includes('update') ||
        message.toLowerCase().includes('add') ||
        message.toLowerCase().includes('remove') ||
        message.toLowerCase().includes('fix') ||
        message.toLowerCase().includes('enhance') ||
        message.toLowerCase().includes('improve')
      );
    
    // If this is a code generation request that isn't for app modification,
    // use the direct Claude implementation instead of the design-code function
    if (isCodeGenerationRequest && !isModificationRequest) {
      console.log("Detected code generation request. Using direct Claude implementation");
      
      // Check if Claude API key is available - MUST be available
      if (!claudeApiKey) {
        console.error('Claude API key is not configured');
        return new Response(JSON.stringify({ 
          error: 'Missing API key',
          response: 'I need a Claude API key to generate code. Please configure it in your Supabase project settings.'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        // Extract requirements from the prompt
        const componentType = extractComponentType(message);
        const designSystem = extractDesignSystem(message);
        const styles = extractStyles(message);
        const isFullStack = isFullStackRequest(message);
        
        console.log(`Generating ${componentType} using ${designSystem}`);
        
        // Generate code directly with Claude
        const claudePrompt = createClaudePrompt(message, componentType, designSystem, styles, isFullStack);
        
        // Call Claude API directly
        const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": claudeApiKey,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "claude-3-5-sonnet-20240620",
            messages: [
              {
                role: "user",
                content: claudePrompt
              }
            ],
            max_tokens: 4000
          })
        });
        
        if (!claudeResponse.ok) {
          const errorData = await claudeResponse.text();
          console.error(`Claude API error: ${claudeResponse.status}`, errorData);
          throw new Error(`Claude API error: ${claudeResponse.status} - ${errorData}`);
        }
        
        const claudeResult = await claudeResponse.json();
        const content = claudeResult.content?.[0]?.text || "";
        
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
        
        // Format the final response
        let finalResponse = `# Here's the code for your ${componentType}

\`\`\`jsx
${frontendCode}
\`\`\`

${backendCode ? `\`\`\`javascript\n${backendCode}\n\`\`\`\n\n` : ''}

${explanation}`;
        
        return new Response(JSON.stringify({ response: finalResponse }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (codeGenError) {
        console.error("Error in direct code generation:", codeGenError);
        
        // Report the actual error to the user
        return new Response(JSON.stringify({ 
          response: `I encountered an error while generating code: ${codeGenError.message}. Please try again with a different request or check that your Claude API key is correctly configured.`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    // Handle app modification requests
    if (isModificationRequest) {
      console.log("Detected app modification request for project:", projectId);
      
      try {
        // Extract the URL from the request
        const url = new URL(req.url);
        const baseUrl = `${url.protocol}//${url.host}`;
        
        // Call the modify-app function
        const modifyResponse = await fetch(`${baseUrl}/modify-app`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('Authorization') || '',
          },
          body: JSON.stringify({ 
            prompt: message,
            projectId: projectId,
            lastModification: lastModification
          }),
        });
        
        if (!modifyResponse.ok) {
          const errorText = await modifyResponse.text();
          throw new Error(`Error modifying app: ${modifyResponse.status} - ${errorText}`);
        }
        
        const modifyResult = await modifyResponse.json();
        
        // Generate a user-friendly response about the modifications
        const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { 
                role: 'system', 
                content: 'You are a helpful coding assistant that explains changes made to code. Be concise but informative.' 
              },
              { 
                role: 'user', 
                content: `The user requested: "${message}". 
                The AI made the following changes to their existing app: ${modifyResult.summary}.
                Explain what was modified in a friendly, helpful way. Start with "I've updated your app with the requested changes."
                Don't be too technical. Make it clear that these changes were applied to their EXISTING app, not a new app.
                Mention that they can view the updated code by clicking the "View code" button.` 
              }
            ],
          }),
        });

        if (!summaryResponse.ok) {
          throw new Error(`Error generating response: ${summaryResponse.status}`);
        }

        const summaryData = await summaryResponse.json();
        const aiResponse = summaryData.choices[0].message.content + 
          `\n\nYour app has been updated with these modifications. You can explore the updated code using the "View code" button above.`;

        return new Response(JSON.stringify({ response: aiResponse, projectId: modifyResult.projectId }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (modifyError) {
        console.error("Error in app modification:", modifyError);
        
        // Return a friendly error message
        return new Response(JSON.stringify({ 
          response: `I'm sorry, but I encountered an error while trying to modify the app: ${modifyError.message}. Please try a simpler modification or try again later.`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    // Normal chat processing (non-code requests) with OpenAI
    console.log("Processing as normal chat request with OpenAI");
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a friendly and helpful AI assistant.' },
          { role: 'user', content: message }
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json()
    const aiResponse = data.choices[0].message.content

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      response: `I encountered an error while processing your request: ${error.message}. Please try again with a different request.`
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// Helper functions for detecting code request types
function extractComponentType(prompt: string): string {
  const promptLower = prompt.toLowerCase();
  
  const componentTypes = [
    { name: "dashboard", keywords: ["dashboard", "admin panel", "analytics dashboard", "stats dashboard"] },
    { name: "form", keywords: ["form", "input form", "contact form", "sign-up form", "login form", "signup form"] },
    { name: "table", keywords: ["table", "data table", "data grid", "spreadsheet", "datatable"] },
    { name: "card", keywords: ["card", "product card", "pricing card", "info card", "profile card"] },
    { name: "navbar", keywords: ["navbar", "navigation", "header", "menu", "nav", "navigation bar"] },
    { name: "button", keywords: ["button", "buttons", "action button", "submit button"] },
    { name: "modal", keywords: ["modal", "dialog", "popup", "overlay"] },
    { name: "alert", keywords: ["alert", "notification", "toast", "message"] },
    { name: "sidebar", keywords: ["sidebar", "side navigation", "drawer"] }
  ];
  
  for (const type of componentTypes) {
    if (type.keywords.some(keyword => promptLower.includes(keyword))) {
      return type.name;
    }
  }
  
  return "component";
}

function extractDesignSystem(prompt: string): string {
  const promptLower = prompt.toLowerCase();
  
  if (promptLower.includes("shadcn") || promptLower.includes("shadcn/ui")) return "shadcn/ui";
  if (promptLower.includes("tailwind")) return "tailwind";
  if (promptLower.includes("chakra")) return "chakra-ui";
  if (promptLower.includes("material")) return "material-ui";
  if (promptLower.includes("bootstrap")) return "bootstrap";
  
  // Default to shadcn/ui
  return "shadcn/ui";
}

function extractStyles(prompt: string): string[] {
  const promptLower = prompt.toLowerCase();
  const styles = [];
  
  if (promptLower.includes("white") || promptLower.includes("light")) styles.push("white");
  if (promptLower.includes("dark") || promptLower.includes("black")) styles.push("dark");
  if (promptLower.includes("beautiful") || promptLower.includes("elegant")) styles.push("beautiful");
  if (promptLower.includes("minimal") || promptLower.includes("simple")) styles.push("minimal");
  
  // Default to beautiful if no style specified
  if (styles.length === 0) styles.push("beautiful");
  
  return styles;
}

function isFullStackRequest(prompt: string): boolean {
  const promptLower = prompt.toLowerCase();
  
  return promptLower.includes("full stack") || 
         promptLower.includes("fullstack") || 
         promptLower.includes("full-stack") ||
         promptLower.includes("backend") ||
         promptLower.includes("database") ||
         promptLower.includes("api");
}

// Create a prompt for Claude to generate code
function createClaudePrompt(originalPrompt: string, componentType: string, designSystem: string, styles: string[], isFullStack: boolean): string {
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
I need you to create a ${componentType} based on my requirements.

# USER REQUIREMENTS
"${originalPrompt}"

# DESIGN SYSTEM
You should use ${designSystem} for this component.

# STYLE REQUIREMENTS
${styleInstructions.join("\n")}

# TECHNICAL REQUIREMENTS
- Create a React component that fulfills the user's requirements
- Use ${designSystem} components and styling
- Use TypeScript with proper type definitions
- Make the component fully responsive and accessible
- Ensure the code is clean, well-organized, and follows best practices
- Add appropriate TypeScript types and comments
${isFullStack ? "- Add a simple backend API endpoint code that would support this component" : ""}

# INSTRUCTIONS
1. Create a component that fulfills the user requirements
2. Style it according to the ${designSystem} design system
3. Make it responsive and accessible
4. Add comments to explain any complex logic
5. Include any necessary imports

# EXPECTED RESPONSE FORMAT
Provide the code in the following format:

\`\`\`jsx
// Frontend code here...
\`\`\`

${isFullStack ? "Then provide the backend code (if required):\n\n```javascript\n// Backend code here (if needed)...\n```" : ""}

Finally, provide a brief explanation of the component and how to use it.
`;
}
