
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface RestoreVersionRequest {
  projectId: string;
}

serve(async (req) => {
  console.log("Restore version function called");
  
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    console.log("Request data:", JSON.stringify(requestData));
    
    const { projectId } = requestData as RestoreVersionRequest;

    if (!projectId) {
      console.error("Missing projectId in request");
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Get the version to restore from the database
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not configured");
    }

    // Fetch the version to restore
    const fetchVersionResponse = await fetch(`${supabaseUrl}/rest/v1/app_projects?id=eq.${projectId}&select=*`, {
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseServiceKey,
        "Authorization": `Bearer ${supabaseServiceKey}`
      }
    });

    if (!fetchVersionResponse.ok) {
      throw new Error(`Failed to fetch version: ${fetchVersionResponse.status}`);
    }

    const versions = await fetchVersionResponse.json();
    if (!versions || versions.length === 0) {
      throw new Error(`Version with ID ${projectId} not found`);
    }

    const versionToRestore = versions[0];
    console.log("Found version to restore:", versionToRestore.version);

    // Calculate new version number - we need to find the highest version number in the chain
    // First check if this is a parent or a child
    const fetchProjectHierarchyResponse = await fetch(`${supabaseUrl}/rest/v1/app_projects?or=(id.eq.${projectId},parent_id.eq.${projectId})&select=*&order=version.desc&limit=1`, {
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseServiceKey,
        "Authorization": `Bearer ${supabaseServiceKey}`
      }
    });

    if (!fetchProjectHierarchyResponse.ok) {
      throw new Error(`Failed to fetch project hierarchy: ${fetchProjectHierarchyResponse.status}`);
    }

    const projectHierarchy = await fetchProjectHierarchyResponse.json();
    const highestVersion = projectHierarchy.length > 0 ? projectHierarchy[0].version : versionToRestore.version;
    
    const newVersion = highestVersion + 1;
    
    // Get the root ID (either this project's ID or its parent_id)
    const rootId = versionToRestore.parent_id || versionToRestore.id;
    
    // Create a new version based on the one to restore
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
        user_id: versionToRestore.user_id,
        parent_id: rootId,
        version: newVersion,
        app_data: versionToRestore.app_data,
        modification_prompt: `Restored to version ${versionToRestore.version}`,
        created_at: new Date().toISOString()
      })
    });

    if (!insertResponse.ok) {
      console.error(`Failed to insert new version: ${insertResponse.status}`);
      throw new Error(`Failed to restore version: ${insertResponse.status}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully restored to version ${versionToRestore.version}`,
      version: newVersion
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in restore-version function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
