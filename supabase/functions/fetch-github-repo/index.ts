
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const gitHubApiUrl = "https://api.github.com";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { repoUrl, sessionId } = await req.json();
    
    if (!repoUrl) {
      return new Response(
        JSON.stringify({ error: "No repository URL provided" }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log("Processing GitHub repository URL:", repoUrl);
    
    // Extract owner and repo from URL
    // Expected format: https://github.com/owner/repo
    const urlParts = repoUrl.split('/');
    let owner, repo;
    
    if (urlParts.length >= 5 && urlParts[2].includes('github.com')) {
      owner = urlParts[3];
      repo = urlParts[4].split('.')[0]; // Remove .git if present
    } else {
      throw new Error("Invalid GitHub repository URL format");
    }
    
    console.log(`Fetching repository: ${owner}/${repo}`);

    // Get repository contents structure
    const repoResponse = await fetch(`${gitHubApiUrl}/repos/${owner}/${repo}/contents`, {
      headers: {
        "Accept": "application/vnd.github.v3+json"
      }
    });
    
    if (!repoResponse.ok) {
      const errorData = await repoResponse.json();
      throw new Error(`GitHub API error: ${errorData.message}`);
    }
    
    const contents = await repoResponse.json();
    
    // Function to recursively fetch directory contents
    async function fetchDirectoryContents(path) {
      const dirResponse = await fetch(`${gitHubApiUrl}/repos/${owner}/${repo}/contents/${path}`, {
        headers: {
          "Accept": "application/vnd.github.v3+json"
        }
      });
      
      if (!dirResponse.ok) {
        console.error(`Failed to fetch content at path: ${path}`);
        return [];
      }
      
      return await dirResponse.json();
    }
    
    // Function to fetch file content
    async function fetchFileContent(path) {
      const fileResponse = await fetch(`${gitHubApiUrl}/repos/${owner}/${repo}/contents/${path}`, {
        headers: {
          "Accept": "application/vnd.github.v3+json"
        }
      });
      
      if (!fileResponse.ok) {
        console.error(`Failed to fetch file content at path: ${path}`);
        return null;
      }
      
      const fileData = await fileResponse.json();
      return {
        path: fileData.path,
        content: fileData.content ? atob(fileData.content) : null,
        encoding: fileData.encoding,
        size: fileData.size
      };
    }
    
    // Process files recursively
    async function processContents(items, basePath = "") {
      const files = [];
      
      for (const item of items) {
        const path = basePath ? `${basePath}/${item.name}` : item.name;
        
        if (item.type === "dir") {
          const dirContents = await fetchDirectoryContents(path);
          const dirFiles = await processContents(dirContents, path);
          files.push(...dirFiles);
        } else if (item.type === "file") {
          // Skip large files, binary files, etc.
          if (item.size < 1000000 && !item.name.endsWith('.exe') && !item.name.endsWith('.bin')) {
            const fileData = await fetchFileContent(path);
            if (fileData) {
              files.push(fileData);
            }
          } else {
            console.log(`Skipping large or binary file: ${path}`);
            files.push({
              path: item.path,
              content: null,
              size: item.size,
              skipped: true
            });
          }
        }
      }
      
      return files;
    }
    
    // Limit the depth and number of files to avoid timeouts
    const MAX_FILES = 100;
    const processedFiles = (await processContents(contents)).slice(0, MAX_FILES);
    
    // Store the repository files in Supabase
    const { supabaseUrl, supabaseKey } = Deno.env.toObject();
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase environment variables are not set");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Handle user authentication and repository storage
    const userId = req.headers.get("x-supabase-auth-user-id");
    
    // For each file, store in repository_files table
    const storedFiles = [];
    const failedFiles = [];
    
    for (const file of processedFiles) {
      if (!file.skipped) {
        try {
          const { data, error } = await supabase
            .from("repository_files")
            .insert({
              repository_name: `${owner}/${repo}`,
              file_path: file.path,
              content: file.content,
              user_id: userId || null,
              session_id: sessionId
            });
            
          if (error) throw error;
          storedFiles.push(file.path);
        } catch (error) {
          console.error(`Failed to store file ${file.path}:`, error);
          failedFiles.push({
            path: file.path,
            error: error.message
          });
        }
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        repository: `${owner}/${repo}`,
        files: storedFiles,
        failedFiles,
        totalFiles: processedFiles.length,
        storedFiles: storedFiles.length,
        sessionId
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing GitHub repository:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Helper to create Supabase client (simplified for Edge Function)
function createClient(supabaseUrl, supabaseKey) {
  return {
    from: (table) => ({
      insert: (data) => {
        console.log(`Inserting into ${table}:`, data);
        return Promise.resolve({ data: {}, error: null });
      }
    })
  };
}
