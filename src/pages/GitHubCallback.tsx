
import { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const GitHubCallback = () => {
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Detailed logging for debugging
      console.log("GitHub callback initiated");
      console.log("Full URL:", window.location.href);
      console.log("Current pathname:", location.pathname);
      console.log("Current search params:", location.search);
      console.log("URL params from router:", params);
      
      try {
        // Check authentication status first
        const { data } = await supabase.auth.getSession();
        const isAuthed = !!data.session;
        setIsAuthenticated(isAuthed);
        
        if (!isAuthed) {
          setError("You must be signed in to connect your GitHub account");
          toast({
            description: "You must be signed in to connect your GitHub account"
          });
          return;
        }
        
        // Extract GitHub code from URL - handling multiple possible formats
        let code: string | null = null;
        
        // Method 1: Standard query parameter
        if (location.search) {
          const urlParams = new URLSearchParams(location.search);
          code = urlParams.get("code");
        }
        
        // Method 2: Path parameter (fallback)
        if (!code && params.params && params.params.includes("code=")) {
          const codeMatch = params.params.match(/code=([^&]+)/);
          if (codeMatch && codeMatch[1]) {
            code = codeMatch[1];
          }
        }
        
        // Method 3: Complete URL parsing fallback
        if (!code) {
          const fullUrl = window.location.href;
          const codeMatch = fullUrl.match(/code=([^&]+)/);
          if (codeMatch && codeMatch[1]) {
            code = codeMatch[1];
          }
        }
        
        // Log for debugging
        console.log("Extracted GitHub code:", code ? `${code.substring(0, 5)}...` : "null");
        
        if (!code) {
          console.error("No authorization code received from GitHub");
          setError("No authorization code received from GitHub");
          toast({
            description: "No authorization code received from GitHub"
          });
          return;
        }
        
        console.log("Processing GitHub callback with code:", code.substring(0, 5) + "...");
        
        // Get the appropriate redirect URI - must match what was sent to GitHub
        const redirectUri = (() => {
          const hostname = window.location.hostname;
          const protocol = window.location.protocol;
          
          if (hostname === 'i-blue.dev' || hostname === 'www.i-blue.dev') {
            return `https://${hostname}/callback/github`;
          }
          
          return `${protocol}//${hostname}${window.location.port ? `:${window.location.port}` : ''}/callback/github`;
        })();
        
        console.log("Using redirect URI:", redirectUri);
        
        // Call our Supabase edge function to exchange the code for a token
        const { data: authData, error: authError } = await supabase.functions.invoke('github-auth', {
          body: { 
            code,
            redirect_uri: redirectUri
          }
        });
        
        if (authError) throw authError;
        
        if (authData) {
          // Successfully connected GitHub account
          console.log("GitHub connection successful");
          toast({
            title: "GitHub Connected",
            description: `Successfully connected to GitHub as ${authData.user?.login || 'user'}`
          });
          
          // Add a small delay to ensure toast is shown
          setTimeout(() => {
            navigate("/");
          }, 1500);
        } else {
          console.error("Failed to connect GitHub account - null result returned");
          setError("Failed to connect GitHub account");
          toast({
            description: "Failed to connect GitHub account"
          });
        }
      } catch (error: any) {
        console.error("Error during GitHub callback:", error);
        setError(error.message || "An unexpected error occurred");
        toast({
          variant: "destructive",
          description: error.message || "An unexpected error occurred during GitHub callback"
        });
      }
    };
    
    handleOAuthCallback();
  }, [location, navigate, params]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md w-full">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Authentication Error</h2>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => navigate(isAuthenticated ? "/" : "/auth")}
            className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
          >
            {isAuthenticated ? "Return to Home" : "Sign In"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium">Connecting your GitHub account...</p>
        </div>
      )}
    </div>
  );
};

export default GitHubCallback;
