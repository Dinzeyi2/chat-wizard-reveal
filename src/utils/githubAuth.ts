
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Get the appropriate redirect URI
const getRedirectUri = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // For production domains, use the production URL without subdomain specification
  if (hostname === 'i-blue.dev' || hostname === 'www.i-blue.dev') {
    // Use exact match including subdomain if present
    return `${protocol}//${hostname}/callback/github`;
  }
  
  // For local development or other environments
  return `${protocol}//${hostname}${window.location.port ? `:${window.location.port}` : ''}/callback/github`;
};

export const initiateGithubAuth = async () => {
  try {
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      // User is not authenticated, redirect to login
      toast({
        description: "You must be logged in to connect GitHub"
      });
      window.location.href = '/auth';
      return;
    }
    
    // Get the client ID from Supabase secrets
    const { data, error } = await supabase.functions.invoke('get-env', {
      body: { key: "GITHUB_CLIENT_ID" }
    });
    
    if (error) throw error;
    
    const clientId = data.value;
    
    if (!clientId) {
      throw new Error("GitHub Client ID not configured");
    }
    
    // Generate a random state value for security
    const state = Math.random().toString(36).substring(2, 15);
    
    // Store the state in sessionStorage for verification after redirect
    sessionStorage.setItem("githubOAuthState", state);
    
    // Get the appropriate redirect URI
    const redirectUri = getRedirectUri();
    
    // Construct the GitHub authorization URL
    const authUrl = new URL("https://github.com/login/oauth/authorize");
    authUrl.searchParams.append("client_id", clientId);
    authUrl.searchParams.append("redirect_uri", redirectUri);
    authUrl.searchParams.append("state", state);
    authUrl.searchParams.append("scope", "repo user");
    
    console.log("Redirecting to GitHub with redirect URI:", redirectUri);
    
    // Redirect the user to GitHub's authorization page
    window.location.href = authUrl.toString();
  } catch (error) {
    console.error("Failed to initiate GitHub auth:", error);
    toast({
      variant: "destructive",
      description: "Failed to start GitHub authentication process. Please try again."
    });
  }
};

export const isGithubConnected = async (): Promise<boolean> => {
  try {
    // Check if user is authenticated first
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      return false;
    }
    
    // Access the github_connections table directly to check if current user has a connection
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) return false;
    
    const { data, error } = await supabase
      .from("github_connections")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
      
    if (error) return false;
    return !!data;
  } catch (error) {
    return false;
  }
};

export const disconnectGithub = async () => {
  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) throw new Error("Not authenticated");
    
    // Delete the connection directly from the github_connections table
    const { error } = await supabase
      .from("github_connections")
      .delete()
      .eq("user_id", user.id);
      
    if (error) throw error;
    
    toast({
      description: "Your GitHub account has been disconnected"
    });
    
    return true;
  } catch (error) {
    toast({
      description: "Failed to disconnect GitHub account"
    });
    return false;
  }
};

export const getGithubRepos = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('github-repos');
    
    if (error) throw error;
    
    return data.repos || [];
  } catch (error) {
    console.error("Failed to fetch GitHub repos:", error);
    toast({
      description: "Failed to fetch your GitHub repositories"
    });
    return [];
  }
};
