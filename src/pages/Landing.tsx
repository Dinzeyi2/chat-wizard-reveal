
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, MessageSquare, Code, Wrench, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserProfileMenu } from "@/components/UserProfileMenu";

const Landing = () => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Check authentication status when component mounts
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    };
    
    checkAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a description for your learning project",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Store the prompt in localStorage to use it in the main interface
      localStorage.setItem("initialPrompt", prompt);
      
      // Redirect to the main interface
      navigate("/app");
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="font-bold text-xl flex items-center">
            <Code className="mr-2 h-5 w-5" />
            CodeLab
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <UserProfileMenu />
            ) : (
              <>
                <Button variant="outline" onClick={() => navigate("/auth")}>Sign In</Button>
                <Button>Get Started</Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-3xl w-full text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Code className="h-6 w-6 mr-2 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold">
              Learn coding by solving real challenges
            </h1>
            <Wrench className="h-6 w-6 ml-2 text-primary" />
          </div>
          <p className="text-xl text-muted-foreground mb-8">
            Request a project and get an intentionally incomplete version with real-world coding challenges to solve and learn from.
          </p>
          
          {/* Input bar */}
          <form onSubmit={handleSubmit} className="w-full">
            <div className="relative">
              <Input 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What would you like to build and learn from? e.g., 'Twitter clone'"
                className="pr-12 py-6 text-lg"
              />
              <Button 
                type="submit" 
                size="icon" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full"
                disabled={isLoading}
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </form>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-secondary/30 p-6 rounded-lg">
              <div className="flex items-center mb-2">
                <BookOpen className="h-5 w-5 text-primary mr-2" />
                <h3 className="text-lg font-medium">Learn By Doing</h3>
              </div>
              <p className="text-muted-foreground">Practice with real-world coding challenges designed to build practical skills.</p>
            </div>
            <div className="bg-secondary/30 p-6 rounded-lg">
              <div className="flex items-center mb-2">
                <Wrench className="h-5 w-5 text-primary mr-2" />
                <h3 className="text-lg font-medium">Fix Real Problems</h3>
              </div>
              <p className="text-muted-foreground">Solve intentionally incomplete code that mimics scenarios from actual development jobs.</p>
            </div>
            <div className="bg-secondary/30 p-6 rounded-lg">
              <div className="flex items-center mb-2">
                <Sparkles className="h-5 w-5 text-primary mr-2" />
                <h3 className="text-lg font-medium">AI Feedback</h3>
              </div>
              <p className="text-muted-foreground">Get instant feedback on your solutions to accelerate your learning progress.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 CodeLab. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
