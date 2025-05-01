
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { handleGithubCallback } from "@/utils/githubAuth";
import { Loader2 } from "lucide-react";

const GitHubCallback = () => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const searchParams = new URLSearchParams(location.search);
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      
      if (!code) {
        setError("No authorization code received from GitHub");
        return;
      }
      
      try {
        const result = await handleGithubCallback(code, state || "");
        if (result) {
          // Successfully connected GitHub account
          navigate("/");
        } else {
          setError("Failed to connect GitHub account");
        }
      } catch (error) {
        setError(error.message || "An unexpected error occurred");
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
            onClick={() => navigate("/")}
            className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
          >
            Return to Home
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
