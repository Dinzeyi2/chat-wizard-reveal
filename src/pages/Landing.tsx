
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";

const Landing = () => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a description for your application",
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
          <div className="font-bold text-xl">AppCreator</div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/auth")}>Sign In</Button>
            <Button>Get Started</Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-3xl w-full text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Create web applications with AI
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Simply describe what you want to build, and our AI will generate a complete application for you.
          </p>
          
          {/* Input bar */}
          <form onSubmit={handleSubmit} className="w-full">
            <div className="relative">
              <Input 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the application you want to build..."
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
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 AppCreator. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
