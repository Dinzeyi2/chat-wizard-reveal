
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const GitHubCallback = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const handleGitHubCallback = async () => {
      setIsLoading(true);

      try {
        // Get the code from the URL query parameters
        const queryParams = new URLSearchParams(location.search);
        const code = queryParams.get('code');

        if (!code) {
          setError('No GitHub authorization code found');
          toast.error('GitHub authorization failed: No code provided');
          return;
        }

        if (!user) {
          setError('User not authenticated');
          toast.error('You must be logged in to connect your GitHub account');
          setTimeout(() => navigate('/signin'), 2000);
          return;
        }

        // Pass the code to our edge function to exchange for token and store connection
        const response = await fetch(`https://vcywiyvbfrylffwfzsny.supabase.co/functions/v1/github-link`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabase.auth.getSession()}`
          },
          body: JSON.stringify({ 
            code, 
            user_id: user.id
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to connect GitHub account');
        }

        toast.success('GitHub account connected successfully!');
        setTimeout(() => navigate('/'), 1500);
      } catch (err) {
        console.error('GitHub callback error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        toast.error(`Failed to connect GitHub account: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    handleGitHubCallback();
  }, [location, navigate, user]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            <Icons.gitHub className="h-6 w-6" />
            Connecting GitHub Account
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <Icons.spinner className="h-8 w-8 animate-spin" />
              <p>Connecting your GitHub account...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-4 text-destructive">
              <p>Error: {error}</p>
              <p className="text-sm">You will be redirected shortly...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-green-600">
              <p>GitHub account connected successfully!</p>
              <p className="text-sm">You will be redirected shortly...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GitHubCallback;
