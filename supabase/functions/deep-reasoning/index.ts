
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { message } = await req.json()
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')

    if (!openAIApiKey) {
      throw new Error('OpenAI API key is not configured')
    }

    // First, we enhance the user's question with deep reasoning prompts
    const promptEnhancementResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are an expert prompt engineer. Your task is to transform a simple user question into a comprehensive and detailed prompt that will guide an AI to provide a deeply reasoned, nuanced, and thorough response.

The enhanced prompt should:
1. Identify the key concepts and underlying assumptions in the original question
2. Add context and specify what aspects should be explored in depth
3. Request multiple perspectives and counter-arguments
4. Ask for practical examples and real-world applications
5. Request limitations and edge cases to be addressed
6. Encourage step-by-step reasoning and structured analysis
7. Maintain the original intent of the user's question

Format the enhanced prompt in a clear structure with sections for:
- Core question (reformulated for clarity)
- Context considerations
- Analysis requirements
- Perspective requirements
- Examples and applications needed
- Limitations to address

Your output should be the enhanced prompt only, ready to be sent to an AI system.`
          },
          {
            role: 'user',
            content: `Transform this simple question into a comprehensive prompt for deep reasoning: "${message}"`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      }),
    })

    const enhancementData = await promptEnhancementResponse.json()
    const enhancedPrompt = enhancementData.choices[0].message.content

    // Now, use the enhanced prompt to get a deeply reasoned response
    const deepResponseResult = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are an AI assistant capable of deep analytical reasoning, nuanced understanding, and comprehensive explanations. Approach this question with careful, step-by-step thinking. Consider multiple perspectives, provide real-world examples, acknowledge limitations, and present a balanced view. Your goal is to provide extraordinary depth and insight that goes beyond surface-level analysis.`
          },
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      }),
    })

    const deepResponseData = await deepResponseResult.json()
    const deepResponse = deepResponseData.choices[0].message.content

    console.log("Original question:", message);
    console.log("Enhanced prompt generated");
    console.log("Deep response generated");

    return new Response(JSON.stringify({ response: deepResponse }), {
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
