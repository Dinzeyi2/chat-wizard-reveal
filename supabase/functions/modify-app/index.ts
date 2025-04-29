
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface ModifyAppRequest {
  prompt: string;
  projectId: string;
}

serve(async (req) => {
  console.log("Modify app function called");
  
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    console.log("Request data:", JSON.stringify(requestData));
    
    const { prompt, projectId } = requestData as ModifyAppRequest;

    if (!prompt || !projectId) {
      console.error("Missing prompt or projectId in request");
      return new Response(JSON.stringify({ error: "Prompt and projectId are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Get the latest version of the project from the database
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not configured");
    }

    // Fetch the latest version of the project
    const fetchProjectResponse = await fetch(`${supabaseUrl}/rest/v1/app_projects?id=eq.${projectId}&select=*&order=version.desc&limit=1`, {
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseServiceKey,
        "Authorization": `Bearer ${supabaseServiceKey}`
      }
    });

    if (!fetchProjectResponse.ok) {
      throw new Error(`Failed to fetch project: ${fetchProjectResponse.status}`);
    }

    const projects = await fetchProjectResponse.json();
    if (!projects || projects.length === 0) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    const latestProject = projects[0];
    console.log("Found latest project version:", latestProject.version);

    // Format prompt for Anthropic, including the existing project code
    const enhancedPrompt = `
The user has requested the following modification to their existing application:
"${prompt}"

Here is the current state of their application:
${JSON.stringify(latestProject.app_data, null, 2)}

Please modify ONLY the parts of the application that need to change based on the user's request.
Keep all functionality the same except for what the user specifically asked to modify.
Return the full updated application code as a complete, valid JSON structure with the same format.
`;

    // Call Anthropic API to modify the code
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      throw new Error("Anthropic API key not configured");
    }

    console.log("Calling Anthropic API for code modification");
    const modificationResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 4000,
        temperature: 0.5,
        system: `You are an expert software developer specializing in modifying web applications.
        When given a user request and existing code for an application, you will modify ONLY what the user requested.
        You will not change any functionality beyond what was explicitly requested.
        Return your response as a valid, complete JSON object with the same structure as the input application.
        Make sure your response includes all original files and components, with only the requested modifications applied.`,
        messages: [
          {
            role: "user",
            content: enhancedPrompt
          }
        ]
      })
    });

    if (!modificationResponse.ok) {
      const errorText = await modificationResponse.text();
      console.error(`Anthropic API error (${modificationResponse.status}): ${errorText}`);
      throw new Error(`Anthropic API error: ${modificationResponse.status}`);
    }

    const modificationData = await modificationResponse.json();
    
    if (!modificationData || !modificationData.content || modificationData.content.length === 0) {
      throw new Error("Empty or invalid response from Anthropic API");
    }
    
    const modifiedContent = modificationData.content[0].text;
    
    // Extract the modified app data from Anthropic's response
    let modifiedAppData;
    try {
      // Try to find and parse JSON in the response
      const jsonMatch = modifiedContent.match(/```json\n([\s\S]*?)\n```/) 
        || modifiedContent.match(/{[\s\S]*"projectName"[\s\S]*}/);
      
      if (jsonMatch) {
        const jsonContent = jsonMatch[1] || jsonMatch[0];
        modifiedAppData = JSON.parse(jsonContent);
      } else {
        // If no JSON found, try to parse the whole response
        modifiedAppData = JSON.parse(modifiedContent);
      }
    } catch (error) {
      console.error("Failed to parse modified app data:", error);
      throw new Error("Failed to parse the modified application code");
    }

    // Calculate new version number
    const newVersion = latestProject.version + 1;
    
    // Insert the new version into the database
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/app_projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseServiceKey,
        "Authorization": `Bearer ${supabaseServiceKey}`,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        user_id: latestProject.user_id,
        parent_id: projectId,
        version: newVersion,
        app_data: modifiedAppData,
        modification_prompt: prompt,
        created_at: new Date().toISOString()
      })
    });

    if (!insertResponse.ok) {
      console.error(`Failed to insert new version: ${insertResponse.status}`);
      throw new Error(`Failed to save modified application: ${insertResponse.status}`);
    }

    // Generate a summary of changes using OpenAI
    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    let changeSummary = "Your requested changes have been applied to the application.";
    
    if (openAiKey) {
      try {
        const summaryResponse = await fetch("https://api.openai.com/v1/chat/completions", {
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
                content: "You are a helpful assistant that summarizes code changes. Provide a brief, non-technical summary of the changes made based on the user request."
              },
              {
                role: "user",
                content: `
User requested this change: "${prompt}"

Modified application data: ${JSON.stringify(modifiedAppData)}
                `
              }
            ],
            max_tokens: 200
          })
        });

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          changeSummary = summaryData.choices[0].message.content;
        }
      } catch (error) {
        console.error("Error generating change summary:", error);
        // Continue with default summary if OpenAI call fails
      }
    }

    console.log("Successfully modified and saved application");
    return new Response(JSON.stringify({
      projectId: projectId,
      version: newVersion,
      summary: changeSummary,
      modifiedApp: modifiedAppData
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in modify-app function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
