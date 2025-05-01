
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { handleGithubCallback } from "@/utils/githubAuth";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const GitHubCallback = () => {
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
      
      if (!data.session) {
        setError("You must be signed in to connect your GitHub account");
        return false;
      }
      
      return true;
    };
    
    const handleOAuthCallback = async () => {
      try {
        console.log("GitHub callback started, processing OAuth response");
        const authStatus = await checkAuth();
        if (!authStatus) {
          console.log("Authentication check failed, user not logged in");
          return;
        }
        
        const searchParams = new URLSearchParams(location.search);
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        
        console.log("Received code:", !!code, "state:", !!state);
        
        if (!code) {
          console.error("No authorization code received from GitHub");
          setError("No authorization code received from GitHub");
          return;
        }
        
        console.log("Calling handleGithubCallback function with code");
        const result = await handleGithubCallback(code, state || "");
        console.log("GitHub callback result:", result);
        
        if (result) {
          toast({
            title: "GitHub Connected",
            description: "Your GitHub account has been successfully connected",
          });
          
          // Successfully connected GitHub account
          console.log("GitHub connection successful, redirecting to home");
          navigate("/");
        } else {
          console.error("Failed to connect GitHub account, no result returned");
          setError("Failed to connect GitHub account");
        }
      } catch (error: any) {
        console.error("Error in GitHub callback:", error);
        setError(error.message || "An unexpected error occurred");
      }
    };
    
    console.log("GitHubCallback component mounted with path:", location.pathname);
    handleOAuthCallback();
  }, [location, navigate, toast]);

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
