
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/ui/icons";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast({
        title: "Sign in successful",
        description: "Welcome back!",
      });
      
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message || "Please check your credentials and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: window.location.origin + "/"
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "GitHub sign in failed",
        description: error.message || "There was a problem signing in with GitHub.",
      });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/"
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Google sign in failed",
        description: error.message || "There was a problem signing in with Google.",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full sm:w-96">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Welcome back! Please sign in to continue</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignIn}>
          <CardContent className="grid gap-y-4">
            <div className="grid grid-cols-2 gap-x-4">
              <Button 
                size="sm" 
                variant="outline" 
                type="button" 
                onClick={handleGithubSignIn}
              >
                <Icons.gitHub className="mr-2 h-4 w-4" />
                GitHub
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                type="button"
                onClick={handleGoogleSignIn}
              >
                <Icons.google className="mr-2 h-4 w-4" />
                Google
              </Button>
            </div>
            
            <p className="flex items-center gap-x-3 text-sm text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
              or
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input 
                id="email"
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password"
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </CardContent>
          
          <CardFooter>
            <div className="grid w-full gap-y-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
              <Button variant="link" size="sm" asChild>
                <Link to="/signup">
                  Don&apos;t have an account? Sign up
                </Link>
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default SignIn;
