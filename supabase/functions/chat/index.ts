
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
    const { message, projectId, lastModification, code } = await req.json()
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    
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

    if (!geminiApiKey) {
      throw new Error('Gemini API key is not configured')
    }

    // Check if this looks like a code generation request
    if (message.toLowerCase().includes('create') || 
        message.toLowerCase().includes('generate') || 
        message.toLowerCase().includes('make') ||
        message.toLowerCase().includes('build')) {
      
      const codeGenKeywords = [
        'app', 'application', 'website', 'component', 'form', 'button', 'card', 'navbar', 'dashboard',
        'ui', 'interface', 'page', 'screen', 'modal', 'dialog',
        'system', 'project', 'platform', 'clone'
      ];
      
      // Check if any code generation keyword is present
      const isCodeGenRequest = codeGenKeywords.some(keyword => 
        message.toLowerCase().includes(keyword)
      );
      
      if (isCodeGenRequest) {
        console.log("Detected code generation request:", message);
        
        try {
          // Initialize project with Gemini
          // Call the standard generate-challenge function but enhance it with project context tracking
          console.log("Calling generate-challenge function...");
          const challengeResponse = await fetch(`${supabaseUrl}/functions/v1/generate-challenge`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": authHeader || '',
              "apikey": supabaseKey
            },
            body: JSON.stringify({
              prompt: message,
              completionLevel: "intermediate", // Default to intermediate difficulty
              challengeType: "fullstack" // Default to fullstack apps
            })
          });
          
          if (!challengeResponse.ok) {
            throw new Error(`Error from generate-challenge: ${challengeResponse.status}`);
          }
          
          const challengeData = await challengeResponse.json();
          
          if (!challengeData.success) {
            throw new Error(challengeData.error || "Failed to generate code challenge");
          }
          
          // Save project context for this generated code
          console.log("Saving project context with Gemini...");
          await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": geminiApiKey
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Create a project context for this generated code challenge:
                  ${JSON.stringify(challengeData)}
                  
                  Format as a JSON object with these fields:
                  {
                    "projectName": "${challengeData.projectName}",
                    "description": "Detailed description",
                    "specification": "Original prompt that created this",
                    "components": [{"name": "ComponentName", "description": "Purpose"}],
                    "dependencies": ["dependencies used"],
                    "nextSteps": ["suggested next steps"]
                  }
                  `
                }]
              }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 2048
              }
            })
          });
          
          // Format a message that clearly explains this is an intentionally incomplete application
          let aiResponse = `I've created an **educational code challenge** based on your request for "${message}". \n\n`;
          aiResponse += `## Project: ${challengeData.projectName}\n\n`;
          aiResponse += `${challengeData.description}\n\n`;
          
          aiResponse += `### IMPORTANT: This is an intentionally incomplete application with ${challengeData.challenges.length} learning challenges!\n\n`;
          aiResponse += `I've created a starting point with some working code, but there are specific areas left incomplete as coding challenges for you to implement and learn from.\n\n`;
          
          aiResponse += `### Challenges to complete:\n`;
          challengeData.challenges.forEach((challenge, index) => {
            aiResponse += `${index + 1}. **${challenge.title}** (${challenge.difficulty})\n`;
            aiResponse += `   ${challenge.description}\n\n`;
          });
          
          aiResponse += `${challengeData.explanation}\n\n`;
          aiResponse += `Would you like me to help you get started with the first challenge? I can provide hints and guidance as you work through each task.`;
          
          // Store in user history if authenticated
          if (userId) {
            try {
              // Check if chat already exists for this project
              const { data: existingChats } = await supabase
                .from('chat_history')
                .select('id')
                .eq('user_id', userId)
                .eq('messages', JSON.stringify({ metadata: { projectId: challengeData.projectId } }), { substring: true })
                .limit(1);

              let chatId;
              
              if (existingChats && existingChats.length > 0) {
                // Update existing chat
                chatId = existingChats[0].id;
                await supabase
                  .from('chat_history')
                  .update({
                    last_message: `Code challenge: ${message.substring(0, 30)}...`,
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
                        metadata: { projectId: challengeData.projectId },
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
                    title: `Code Challenge: ${message.substring(0, 30)}...`,
                    last_message: `Generated challenge ${new Date().toLocaleString()}`,
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
                        metadata: { projectId: challengeData.projectId },
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
          
          return new Response(JSON.stringify({ 
            response: aiResponse, 
            projectId: challengeData.projectId 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (genError) {
          console.error("Error generating code challenge:", genError);
          
          return new Response(JSON.stringify({ 
            response: `I encountered an error while trying to generate the code challenge: ${genError.message}. Please try a simpler request or try again later.`
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // For project modification requests with context, use enhanced capabilities
    if (projectId && code) {
      try {
        console.log("Processing code analysis with Gemini for projectId:", projectId);
        
        // Get project context if available
        let projectContext = null;
        try {
          // Try to get the latest version from Supabase
          const { data: projects } = await supabase
            .from('app_projects')
            .select('*')
            .eq('id', projectId)
            .order('version', { ascending: false })
            .limit(1);
            
          if (projects && projects.length > 0) {
            projectContext = {
              projectId,
              projectName: projects[0].app_data?.projectName || "Unnamed Project",
              specification: message,
              description: projects[0].app_data?.description || "Project based on user specification",
            };
          }
        } catch (error) {
          console.error("Error fetching project context:", error);
        }
        
        if (!projectContext) {
          projectContext = {
            projectId,
            projectName: "Unnamed Project",
            specification: message,
            description: "Project based on user specification"
          };
        }
        
        // Call Gemini for code analysis and response
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": geminiApiKey
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `
                You are an AI code assistant helping a user build this project:
                
                Project Context: ${JSON.stringify(projectContext)}
                
                The user's current message is: "${message}"
                
                Current code:
                \`\`\`
                ${code}
                \`\`\`
                
                Analyze this code and the user's request to provide:
                1. A helpful response to their question
                2. Specific guidance based on their code
                3. Educational explanations rather than just solutions
                4. References to their code where relevant
                5. Suggestions for next steps
                
                Keep your response conversational and focused on helping them learn.
                `
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 4096
            }
          })
        });

        if (!response.ok) {
          throw new Error(`Error from Gemini API: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.candidates || data.candidates.length === 0) {
          throw new Error("Empty response from Gemini API");
        }
        
        const assistantResponse = data.candidates[0].content.parts[0].text;
        
        // If the message asks about implementing something, generate code suggestion
        let codeUpdate = null;
        if (message.toLowerCase().includes('implement') || 
            message.toLowerCase().includes('how do i') || 
            message.toLowerCase().includes('how to') || 
            message.toLowerCase().includes('fix')) {
            
          console.log("Generating code suggestion based on user request");
          
          // Generate code suggestion
          const suggestionResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": geminiApiKey
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `
                  You are an expert code assistant. Based on this request:
                  "${message}"
                  
                  And this current code:
                  \`\`\`
                  ${code}
                  \`\`\`
                  
                  Provide a code implementation that would help them progress.
                  Important:
                  1. Do NOT rewrite the entire codebase
                  2. Only update/add the specific parts needed to address their request
                  3. Preserve their existing implementation style
                  4. Include comments explaining your changes
                  
                  Provide ONLY the updated code with no explanations before or after.
                  `
                }]
              }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 4096
              }
            })
          });
          
          if (suggestionResponse.ok) {
            const suggestionData = await suggestionResponse.json();
            if (suggestionData.candidates && suggestionData.candidates.length > 0) {
              codeUpdate = suggestionData.candidates[0].content.parts[0].text;
            }
          }
        }
        
        // Include code suggestion if available
        const finalResponse = {
          response: assistantResponse,
          projectId: projectId,
          codeUpdate: codeUpdate
        };
        
        // Store in user history if authenticated
        if (userId) {
          try {
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
                    content: assistantResponse,
                    metadata: { projectId, codeUpdate },
                    timestamp: new Date().toISOString()
                  }
                ])
              });
          } catch (dbError) {
            console.error("Error storing chat history in Supabase:", dbError);
          }
        }
        
        return new Response(JSON.stringify(finalResponse), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error("Error in code analysis:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    // For regular chat messages, use standard Gemini
    try {
      console.log("Processing with Gemini API");
      let prompt = message;
      
      // If this is a project modification request, enhance the prompt
      if (projectId) {
        prompt = `The user is asking about a code challenge project with ID ${projectId}. They asked: "${message}". Provide helpful guidance for coding challenges, explaining concepts, or offering hints. Focus on making this an educational experience. Remember this is an intentionally incomplete project for learning purposes.`;
      }
      
      // Call Gemini API
      const geminiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiApiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096
          }
        })
      });

      if (!geminiResponse.ok) {
        throw new Error(`Error from Gemini API: ${geminiResponse.status}`);
      }

      const geminiData = await geminiResponse.json();
      
      if (!geminiData.candidates || geminiData.candidates.length === 0) {
        throw new Error("Empty response from Gemini API");
      }
      
      const aiResponse = geminiData.candidates[0].content.parts[0].text;

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
      });
    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
});
