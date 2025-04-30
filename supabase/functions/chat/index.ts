
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { message, projectId, lastModification } = await req.json()
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY')

    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user ID from the JWT if available
    let userId = null
    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token)
        if (!error && user) {
          userId = user.id
        }
      } catch (error) {
        console.error("Error getting user from token:", error)
      }
    }

    if (!openAIApiKey) {
      throw new Error('OpenAI API key is not configured')
    }

    // Check if this looks like a code generation request
    if (message.toLowerCase().includes('create') || 
        message.toLowerCase().includes('generate') || 
        message.toLowerCase().includes('make') ||
        message.toLowerCase().includes('build')) {
      
      const codeGenKeywords = [
        'component', 'form', 'button', 'card', 'navbar', 'dashboard',
        'ui', 'interface', 'page', 'screen', 'modal', 'dialog',
        'shadcn', 'tailwind', 'react'
      ];
      
      // Check if any code generation keyword is present
      const isCodeGenRequest = codeGenKeywords.some(keyword => 
        message.toLowerCase().includes(keyword)
      );
      
      if (isCodeGenRequest) {
        console.log("Detected code generation request:", message);
        
        try {
          let generatedCode = null;
          let explanation = "";
          
          // Try using Claude if available
          if (claudeApiKey) {
            try {
              console.log("Generating code with Claude...");
              
              // Call Claude API for code generation
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
                      content: `
You are an expert UI developer specializing in creating beautiful React applications.

# TASK
I need you to create a new UI component based on specific requirements.

# USER REQUIREMENTS
"${message}"

# STYLE REQUIREMENTS
- Use a clean white theme with light backgrounds
- Make the component beautiful with elegant styling and subtle animations
- Use shadcn/ui components and Tailwind CSS

# TECHNICAL REQUIREMENTS
- Create a fully functional React component
- Make the component fully responsive
- Ensure the code is clean, well-organized, and follows best practices
- Use TypeScript for type safety

# INSTRUCTIONS
1. Create a new component based on the requirements
2. Make it responsive and accessible
3. Implement all functionality described in the requirements
4. Return the complete, new component code

# EXPECTED RESPONSE FORMAT
Provide the new code in the following format:

\`\`\`jsx
// Frontend code here...
\`\`\`

Finally, provide a brief explanation of the component you created.
`
                    }
                  ],
                  max_tokens: 4000
                })
              });
              
              if (claudeResponse.ok) {
                const claudeData = await claudeResponse.json();
                const content = claudeData.content?.[0]?.text || "";
                
                // Extract code and explanation
                const codeMatch = content.match(/```(?:jsx|js|tsx|ts)([\s\S]*?)```/);
                if (codeMatch) {
                  generatedCode = codeMatch[1].trim();
                  
                  // Extract explanation (text after the code block)
                  const codeEnd = content.indexOf("```", content.indexOf("```") + 3) + 3;
                  explanation = content.substring(codeEnd).trim();
                } else {
                  throw new Error("No code found in Claude's response");
                }
              } else {
                throw new Error(`Error from Claude API: ${claudeResponse.status}`);
              }
            } catch (claudeError) {
              console.error("Claude code generation failed:", claudeError);
              throw claudeError;
            }
          } else {
            // Fallback to OpenAI for code generation if Claude is not available
            const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
                    content: 'You are an expert React developer who specializes in creating UI components using shadcn/ui and Tailwind CSS. Create beautiful, responsive components with clean code.'
                  },
                  { role: 'user', content: message }
                ],
              }),
            });

            const data = await openAIResponse.json();
            generatedCode = data.choices[0].message.content;
            explanation = "Generated with OpenAI";
          }
          
          if (generatedCode) {
            let aiResponse = "I've created the UI component you requested:\n\n";
            
            // Check if the code is wrapped in a code block
            if (!generatedCode.includes("```")) {
              aiResponse += "```jsx\n" + generatedCode + "\n```\n\n";
            } else {
              aiResponse += generatedCode + "\n\n";
            }
            
            aiResponse += explanation;
            
            return new Response(JSON.stringify({ response: aiResponse }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        } catch (codeGenError) {
          console.error("Error in code generation:", codeGenError);
          
          // Return a friendly error message
          return new Response(JSON.stringify({ 
            response: `I encountered an error while trying to generate code: ${codeGenError.message}. Please try a simpler request or try again later.`
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }
    
    // Check if this is a modification request for an app
    if (projectId && message.toLowerCase().includes('change') || 
        message.toLowerCase().includes('modify') || 
        message.toLowerCase().includes('update') ||
        message.toLowerCase().includes('add') ||
        message.toLowerCase().includes('remove')) {
      
      // This looks like a code modification request
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

        // If user is authenticated, store the chat history
        if (userId) {
          try {
            // Check if chat already exists for this project
            const { data: existingChats } = await supabase
              .from('chat_history')
              .select('id')
              .eq('user_id', userId)
              .eq('messages', JSON.stringify({ metadata: { projectId: modifyResult.projectId } }), { substring: true })
              .limit(1);

            let chatId;
            
            if (existingChats && existingChats.length > 0) {
              // Update existing chat
              chatId = existingChats[0].id;
              await supabase
                .from('chat_history')
                .update({
                  last_message: `Modified project: ${message.substring(0, 30)}...`,
                  messages: JSON.stringify([
                    {
                      id: Date.now().toString(),
                      role: "user",
                      content: message,
                      timestamp: new Date().toISOString()
                    },
                    {
                      id: (Date.now() + 1).toString(),
                      role: "assistant",
                      content: aiResponse,
                      metadata: { projectId: modifyResult.projectId },
                      timestamp: new Date().toISOString()
                    }
                  ]),
                  updated_at: new Date().toISOString()
                })
                .eq('id', chatId);
            } else {
              // Create new chat
              const { data } = await supabase
                .from('chat_history')
                .insert({
                  user_id: userId,
                  title: `App Modification: ${message.substring(0, 30)}...`,
                  last_message: `Modified project ${new Date().toLocaleString()}`,
                  messages: JSON.stringify([
                    {
                      id: Date.now().toString(),
                      role: "user",
                      content: message,
                      timestamp: new Date().toISOString()
                    },
                    {
                      id: (Date.now() + 1).toString(),
                      role: "assistant",
                      content: aiResponse,
                      metadata: { projectId: modifyResult.projectId },
                      timestamp: new Date().toISOString()
                    }
                  ])
                })
                .select('id');
              
              if (data && data[0]) {
                chatId = data[0].id;
              }
            }
          } catch (dbError) {
            console.error("Error storing chat history in Supabase:", dbError);
          }
        }

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
    
    // Normal chat processing
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

    // If user is authenticated, store the chat history
    if (userId) {
      try {
        // Create new chat or update existing
        await supabase
          .from('chat_history')
          .insert({
            user_id: userId,
            title: message.length > 50 ? message.substring(0, 50) + '...' : message,
            last_message: 'Last message just now',
            messages: JSON.stringify([
              {
                id: Date.now().toString(),
                role: "user",
                content: message,
                timestamp: new Date().toISOString()
              },
              {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: aiResponse,
                timestamp: new Date().toISOString()
              }
            ])
          })
      } catch (dbError) {
        console.error("Error storing chat history in Supabase:", dbError);
      }
    }

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
