
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// GitHub OAuth configuration
// Use the current origin to build the redirect URI dynamically
const getRedirectUri = () => {
  // Check if we're on the production domain
  const hostname = window.location.hostname;
  
  // For production domains, always use the format without www
  // This must match EXACTLY what's configured in the GitHub app settings
  if (hostname === 'i-blue.dev' || hostname === 'www.i-blue.dev') {
    return `https://i-blue.dev/github-callback`;
  }
  
  // For local development or other environments
  return `${window.location.origin}/github-callback`;
};

export const initiateGithubAuth = async () => {
  try {
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      // User is not authenticated, redirect to login
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
    const REDIRECT_URI = getRedirectUri();
    
    // Construct the GitHub authorization URL
    const authUrl = new URL("https://github.com/login/oauth/authorize");
    authUrl.searchParams.append("client_id", clientId);
    authUrl.searchParams.append("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.append("state", state);
    authUrl.searchParams.append("scope", "repo user");
    
    // Log the redirect URI for debugging
    console.log("GitHub Auth - Redirecting with redirect URI:", REDIRECT_URI);
    
    // Redirect the user to GitHub's authorization page
    window.location.href = authUrl.toString();
  } catch (error) {
    console.error("Failed to initiate GitHub auth:", error);
    const { toast } = useToast();
    toast({
      variant: "destructive",
      title: "Authentication Error",
      description: "Failed to start GitHub authentication process. Please try again.",
    });
  }
};

export const handleGithubCallback = async (code: string, state: string) => {
  const { toast } = useToast();
  
  try {
    // Verify the state parameter to prevent CSRF attacks
    const storedState = sessionStorage.getItem("githubOAuthState");
    if (state !== storedState) {
      console.error("State mismatch:", { received: state, stored: storedState });
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "Invalid state parameter. Please try again.",
      });
      return null;
    }
    
    // Clean up the stored state
    sessionStorage.removeItem("githubOAuthState");
    
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
      
    if (!sessionData.session) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be signed in to connect your GitHub account.",
      });
      return null;
    }
    
    try {
      // Get the appropriate redirect URI - must match the one used in initiateGithubAuth
      const REDIRECT_URI = getRedirectUri();
      console.log("Using callback URI for token exchange:", REDIRECT_URI);
      
      // Exchange the authorization code for an access token
      const { data, error } = await supabase.functions.invoke('github-auth', {
        body: { 
          code,
          redirect_uri: REDIRECT_URI
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "GitHub Connected",
        description: `Successfully connected to GitHub as ${data.user.login}`,
      });
      
      return data;
    } catch (error: any) {
      console.error("GitHub connection error:", error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error.message || "Failed to connect GitHub account",
      });
      return null;
    }
  } catch (error: any) {
    console.error("Error in GitHub callback handler:", error);
    toast({
      variant: "destructive",
      title: "Connection Failed",
      description: "An unexpected error occurred while connecting to GitHub",
    });
    return null;
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
      
    if (error) {
      console.error("Error checking GitHub connection:", error);
      return false;
    }
    return !!data;
  } catch (error) {
    console.error("Error in isGithubConnected:", error);
    return false;
  }
};

export const disconnectGithub = async () => {
  const { toast } = useToast();
  
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
      title: "GitHub Disconnected",
      description: "Your GitHub account has been disconnected",
    });
    
    return true;
  } catch (error) {
    toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to disconnect GitHub account",
    });
    return false;
  }
};
