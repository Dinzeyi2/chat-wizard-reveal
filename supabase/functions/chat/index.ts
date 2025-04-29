
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

    if (!openAIApiKey) {
      throw new Error('OpenAI API key is not configured')
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
    // use the UI code generator with Perplexity+Claude
    if (isCodeGenerationRequest && !isModificationRequest) {
      console.log("Detected code generation request. Using Perplexity+Claude system");
      
      try {
        // Call the design-code function
        const designResponse = await fetch(`${req.url.replace('/chat', '/design-code')}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('Authorization') || '',
          },
          body: JSON.stringify({ 
            prompt: message,
            action: "find"
          }),
        });
        
        if (!designResponse.ok) {
          const errorText = await designResponse.text();
          throw new Error(`Error finding design code: ${designResponse.status} - ${errorText}`);
        }
        
        const designResult = await designResponse.json();
        
        let finalResponse;
        if (designResult.success) {
          // If Perplexity found a design, customize it with Claude
          console.log("Design code found. Customizing with Claude.");
          const customizeResponse = await fetch(`${req.url.replace('/chat', '/design-code')}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': req.headers.get('Authorization') || '',
            },
            body: JSON.stringify({ 
              prompt: message,
              action: "customize",
              designData: designResult
            }),
          });
          
          if (!customizeResponse.ok) {
            throw new Error(`Error customizing code: ${customizeResponse.status}`);
          }
          
          const customizeResult = await customizeResponse.json();
          
          if (customizeResult.success) {
            // Combine code and explanation
            let frontendCode = customizeResult.customizedCode?.frontend || "";
            let backendCode = customizeResult.customizedCode?.backend || "";
            let explanation = customizeResult.explanation || "";
            
            finalResponse = `# Here's the code for ${designResult.requirements?.componentType || 'your request'}

\`\`\`jsx
${frontendCode}
\`\`\`

${backendCode ? `\`\`\`javascript\n${backendCode}\n\`\`\`\n\n` : ''}

${explanation}`;
          } else {
            throw new Error(customizeResult.error || "Code customization failed");
          }
        } else {
          // If Perplexity search failed, use Claude fallback
          console.log("Design search failed. Using Claude fallback.");
          
          // Call the design-code function with fallback mode
          const fallbackResponse = await fetch(`${req.url.replace('/chat', '/design-code')}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': req.headers.get('Authorization') || '',
            },
            body: JSON.stringify({ 
              prompt: message,
              action: "customize", // Reuse customize endpoint for fallback
              designData: {
                requirements: {
                  originalPrompt: message,
                  componentType: extractComponentType(message),
                  framework: "react",
                  designSystem: extractDesignSystem(message),
                  styles: extractStyles(message),
                  isFullStack: isFullStackRequest(message)
                },
                code: "// Placeholder for Claude fallback",
                metadata: {
                  query: message,
                  designSystem: extractDesignSystem(message)
                },
                success: true
              }
            }),
          });
          
          if (!fallbackResponse.ok) {
            throw new Error(`Error in Claude fallback: ${fallbackResponse.status}`);
          }
          
          const fallbackResult = await fallbackResponse.json();
          
          if (fallbackResult.success) {
            let frontendCode = fallbackResult.customizedCode?.frontend || "";
            let backendCode = fallbackResult.customizedCode?.backend || "";
            let explanation = fallbackResult.explanation || "";
            
            finalResponse = `# Here's the code for your request

\`\`\`jsx
${frontendCode}
\`\`\`

${backendCode ? `\`\`\`javascript\n${backendCode}\n\`\`\`\n\n` : ''}

${explanation}`;
          } else {
            throw new Error(fallbackResult.error || "Claude fallback failed");
          }
        }
        
        return new Response(JSON.stringify({ response: finalResponse }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (codeGenError) {
        console.error("Error in code generation:", codeGenError);
        
        // Return a friendly error message
        return new Response(JSON.stringify({ 
          response: `I'm sorry, but I encountered an error while generating code: ${codeGenError.message}. Please try a simpler request or try again later.`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    // Handle app modification requests
    if (isModificationRequest) {
      console.log("Detected app modification request for project:", projectId);
      
      try {
        // Call the modify-app function
        const modifyResponse = await fetch(`${req.url.replace('/chat', '/modify-app')}`, {
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

    const data = await response.json()
    const aiResponse = data.choices[0].message.content

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
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
    { name: "form", keywords: ["form", "input form", "contact form", "sign-up form", "login form"] },
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
