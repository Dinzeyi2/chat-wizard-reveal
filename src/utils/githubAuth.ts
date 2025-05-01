
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// GitHub OAuth configuration
const GITHUB_CLIENT_ID = "YOUR_GITHUB_CLIENT_ID"; // This should be configured in your environment
const REDIRECT_URI = `${window.location.origin}/github-callback`;

export const initiateGithubAuth = () => {
  // Generate a random state value for security
  const state = Math.random().toString(36).substring(2, 15);
  
  // Store the state in sessionStorage for verification after redirect
  sessionStorage.setItem("githubOAuthState", state);
  
  // Construct the GitHub authorization URL
  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.append("client_id", GITHUB_CLIENT_ID);
  authUrl.searchParams.append("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.append("state", state);
  authUrl.searchParams.append("scope", "repo user");
  
  // Redirect the user to GitHub's authorization page
  window.location.href = authUrl.toString();
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
    const { data, error } = await supabase
      .from('github_connections')
      .select('*')
      .single();
      
    if (error) return false;
    return !!data;
  } catch (error) {
    return false;
  }
};

export const disconnectGithub = async () => {
  const { toast } = useToast();
  
  try {
    const { error } = await supabase
      .from('github_connections')
      .delete()
      .eq('user_id', supabase.auth.getUser());
      
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
