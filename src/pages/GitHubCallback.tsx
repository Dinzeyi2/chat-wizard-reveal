
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const GitHubCallback = () => {
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Detailed logging for debugging
      console.log("GitHub callback initiated");
      console.log("Full URL:", window.location.href);
      console.log("Current pathname:", location.pathname);
      console.log("Current search params:", location.search);
      
      // Check authentication status
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
      
      if (!data.session) {
        setError("You must be signed in to connect your GitHub account");
        toast({
          description: "You must be signed in to connect your GitHub account"
        });
        return;
      }
      
      const searchParams = new URLSearchParams(location.search);
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      
      if (!code) {
        console.error("No authorization code received from GitHub");
        setError("No authorization code received from GitHub");
        toast({
          description: "No authorization code received from GitHub"
        });
        return;
      }
      
      try {
        console.log("Processing GitHub callback with code:", code.substring(0, 5) + "...");
        
        // Call our Supabase edge function to exchange the code for a token
        const { data, error } = await supabase.functions.invoke('github-auth', {
          body: { 
            code,
            redirect_uri: `${window.location.origin}/callback/github`
          }
        });
        
        if (error) throw error;
        
        if (data) {
          // Successfully connected GitHub account
          console.log("GitHub connection successful");
          toast({
            title: "GitHub Connected",
            description: `Successfully connected to GitHub as ${data.user?.login || 'user'}`
          });
          
          // Add a small delay to ensure toast is shown
          setTimeout(() => {
            navigate("/");
          }, 1000);
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
  }, [location, navigate]);

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
