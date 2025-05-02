
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
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load chat history when component mounts
  useEffect(() => {
    const fetchChatHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const { data: session } = await supabase.auth.getSession();
        
        if (session.session) {
          // User is logged in, fetch from Supabase
          const { data, error } = await supabase
            .from('chat_history')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(6);
          
          if (error) throw error;
          if (data) {
            setChatHistory(data);
          }
        } else {
          // Not authenticated, check localStorage
          const storedHistory = localStorage.getItem('chatHistory');
          if (storedHistory) {
            const parsedHistory = JSON.parse(storedHistory);
            setChatHistory(parsedHistory.slice(0, 6)); // Take only first 6 items
          }
        }
      } catch (error) {
        console.error("Error fetching chat history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    
    fetchChatHistory();
  }, []);

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return 'Just now';
      if (diffInHours === 1) return '1 hour ago';
      if (diffInHours < 24) return `${diffInHours} hours ago`;
      if (diffInHours < 48) return '1 day ago';
      return `${Math.floor(diffInHours / 24)} days ago`;
    } catch (e) {
      return 'Unknown time';
    }
  };

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

  const handleChatSelect = (chatId: string) => {
    navigate(`/app?chat=${chatId}`);
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

        {/* Chat History section - replacing Features section */}
        <div className="w-full max-w-4xl mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-center">Recent Conversations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full">
            {isLoadingHistory ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border rounded-lg p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-3 w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2 w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))
            ) : chatHistory.length > 0 ? (
              // Show chat history
              chatHistory.map((chat, index) => (
                <div 
                  key={index} 
                  className="border rounded-lg p-6 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => handleChatSelect(chat.id)}
                >
                  <div className="flex items-center mb-2">
                    <MessageSquare className="h-4 w-4 mr-2 text-blue-500" />
                    <h3 className="font-semibold text-xl truncate">{chat.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{chat.last_message || "No messages"}</p>
                  <p className="text-xs text-gray-400 mt-2">{formatTimestamp(chat.updated_at || chat.timestamp)}</p>
                </div>
              ))
            ) : (
              // No history
              <div className="col-span-3 text-center py-10 border rounded-lg">
                <p className="text-muted-foreground">No recent conversations</p>
                <p className="text-sm mt-2">Start a new chat to build your application</p>
              </div>
            )}
          </div>
          {chatHistory.length > 0 && (
            <div className="flex justify-center mt-6">
              <Button variant="outline" onClick={() => navigate('/history')}>
                View All Conversations
              </Button>
            </div>
          )}
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
