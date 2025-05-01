
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GitHubConnection {
  github_username: string;
  github_avatar: string;
  id: string;
  user_id: string;
}

const Index = () => {
  const { user } = useAuth();
  const [githubConnection, setGithubConnection] = useState<GitHubConnection | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch GitHub connection for the current user
  useEffect(() => {
    const fetchGitHubConnection = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('github_connections')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching GitHub connection:', error);
          return;
        }

        setGithubConnection(data || null);
      } catch (error) {
        console.error('Error fetching GitHub connection:', error);
      }
    };

    fetchGitHubConnection();
  }, [user]);

  const connectGitHub = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/github-callback`,
          scopes: 'read:user user:email',
        },
      });

      if (error) throw error;

    } catch (error) {
      console.error('Error connecting GitHub:', error);
      toast.error('Failed to connect GitHub account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="container px-4 py-8 mx-auto flex-1">
        <h1 className="text-3xl font-bold mb-6">Welcome{user?.email ? `, ${user.email}` : ''}!</h1>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>Your account details and connected services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-sm">Email</h3>
                <p>{user?.email || 'No email address'}</p>
              </div>

              <div>
                <h3 className="font-medium text-sm mb-2">GitHub Connection</h3>
                {githubConnection ? (
                  <div className="flex items-center gap-2">
                    {githubConnection.github_avatar && (
                      <img 
                        src={githubConnection.github_avatar} 
                        alt="GitHub avatar" 
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span>{githubConnection.github_username} (Connected)</span>
                  </div>
                ) : (
                  <Button 
                    onClick={connectGitHub} 
                    disabled={loading}
                    size="sm"
                    variant="outline"
                  >
                    {loading ? (
                      <>
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Icons.gitHub className="mr-2 h-4 w-4" />
                        Connect GitHub
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>App Features</CardTitle>
              <CardDescription>Explore what you can do</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Your app content goes here...</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="bg-white dark:bg-gray-950 border-t py-4 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Your App. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
