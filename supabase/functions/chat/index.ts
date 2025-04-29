
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
                The AI made the following changes to their app: ${modifyResult.summary}.
                Explain what was changed in a friendly, helpful way. Don't be too technical. 
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
          `\n\nI've generated a full-stack application based on your modifications. Here's what I created:

\`\`\`json
${JSON.stringify(modifyResult.modifiedApp, null, 2)}
\`\`\`

You can explore the updated code using the "View code" button above.`;

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
