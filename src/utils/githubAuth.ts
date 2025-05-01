import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// GitHub OAuth configuration
const REDIRECT_URI = `${window.location.origin}/github-callback`;

export const initiateGithubAuth = async () => {
  try {
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
    
    // Construct the GitHub authorization URL
    const authUrl = new URL("https://github.com/login/oauth/authorize");
    authUrl.searchParams.append("client_id", clientId);
    authUrl.searchParams.append("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.append("state", state);
    authUrl.searchParams.append("scope", "repo user");
    
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
  
  // Verify the state parameter to prevent CSRF attacks
  const storedState = sessionStorage.getItem("githubOAuthState");
  if (state !== storedState) {
    toast({
      variant: "destructive",
      title: "Authentication Error",
      description: "Invalid state parameter. Please try again.",
    });
    return null;
  }
  
  // Clean up the stored state
  sessionStorage.removeItem("githubOAuthState");
  
  try {
    // Exchange the authorization code for an access token
    const { data, error } = await supabase.functions.invoke('github-auth', {
      body: { code }
    });
    
    if (error) throw error;
    
    toast({
      title: "GitHub Connected",
      description: `Successfully connected to GitHub as ${data.user.login}`,
    });
    
    return data;
  } catch (error) {
    toast({
      variant: "destructive",
      title: "Connection Failed",
      description: error.message || "Failed to connect GitHub account",
    });
    return null;
  }
};

export const isGithubConnected = async (): Promise<boolean> => {
  try {
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
