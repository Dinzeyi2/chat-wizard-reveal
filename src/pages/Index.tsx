
import { useState, useRef, useEffect } from "react";
import ChatWindow from "@/components/ChatWindow";
import InputArea from "@/components/InputArea";
import WelcomeScreen from "@/components/WelcomeScreen";
import { Message } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { ArtifactProvider, ArtifactLayout } from "@/components/artifact/ArtifactSystem";
import { HamburgerMenuButton } from "@/components/HamburgerMenuButton";
import { useLocation } from "react-router-dom";

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isGeneratingApp, setIsGeneratingApp] = useState(false);
  const [generationDialog, setGenerationDialog] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const location = useLocation();

  useEffect(() => {
    // Parse chat ID from URL if present
    const searchParams = new URLSearchParams(location.search);
    const chatId = searchParams.get('chat');
    
    if (chatId) {
      // Load the specific chat history
      loadChatHistory(chatId);
    }
  }, [location]);

  const loadChatHistory = async (chatId: string) => {
    console.log(`Loading chat history for chat ID: ${chatId}`);
    
    // In a real application, here we would fetch the chat history from the backend
    // For now, we'll simulate loading chat data with mock messages based on mock data
    const mockChatHistory = chatHistory.find(chat => chat.id === chatId);
    
    if (mockChatHistory) {
      // Simulate loading previous messages based on the chat title
      const userMessage: Message = {
        id: "user-" + Date.now().toString(),
        role: "user",
        content: mockChatHistory.title,
        timestamp: new Date(Date.now() - 3600000) // 1 hour ago
      };
      
      const assistantMessage: Message = {
        id: "assistant-" + Date.now().toString(),
        role: "assistant",
        content: `This is a previous conversation about "${mockChatHistory.title}". I'm here to continue helping you with this topic.`,
        timestamp: new Date(Date.now() - 3500000) // A bit less than 1 hour ago
      };
      
      setMessages([userMessage, assistantMessage]);
      
      // If this chat had a project ID, we would restore it here
      // setCurrentProjectId(mockProjectId);
    }
  };

  // Mock chat history data (same as in ChatHistory.tsx)
  const chatHistory = [
    {
      id: "1",
      title: "Chatbot to Generate Full Stack Apps with Anthropic API",
      lastMessage: "Last message 15 hours ago",
      timestamp: "15 hours ago"
    },
    {
      id: "2",
      title: "Enhancing AI Responses with Deep Reasoning",
      lastMessage: "Last message 16 hours ago",
      timestamp: "16 hours ago"
    },
    {
      id: "3",
      title: "Enhancing AI Conversational Awareness",
      lastMessage: "Last message 18 hours ago",
      timestamp: "18 hours ago"
    },
    {
      id: "4",
      title: "Enabling User Customization of AI-Generated Web Apps",
      lastMessage: "Last message 18 hours ago",
      timestamp: "18 hours ago"
    },
    {
      id: "5",
      title: "Chatbot for Customizing AI-Generated Webapps",
      lastMessage: "Last message 18 hours ago",
      timestamp: "18 hours ago"
    },
    {
      id: "6",
      title: "AI-Powered Full Stack App Builder",
      lastMessage: "Last message 1 day ago",
      timestamp: "1 day ago"
    },
    {
      id: "7",
      title: "Intelligent Project Management System with Contextual AI",
      lastMessage: "Last message 1 day ago",
      timestamp: "1 day ago"
    }
  ];

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    setGenerationError(null);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Check if this is a standard app generation request
    const isAppGeneration = 
      (content.toLowerCase().includes("create") || 
       content.toLowerCase().includes("build") || 
       content.toLowerCase().includes("generate") ||
       content.toLowerCase().includes("make") || 
       content.toLowerCase().includes("develop") ||
       content.toLowerCase().includes("code")) && 
      (content.toLowerCase().includes("app") || 
       content.toLowerCase().includes("website") || 
       content.toLowerCase().includes("dashboard") || 
       content.toLowerCase().includes("application") ||
       content.toLowerCase().includes("platform") ||
       content.toLowerCase().includes("clone") ||
       content.toLowerCase().includes("system") ||
       content.toLowerCase().includes("project") ||
       content.toLowerCase().includes("site"));

    // Check if this is a modification request for an existing app
    const isModificationRequest = 
      currentProjectId && // We have a current project ID
      (content.toLowerCase().includes("change") ||
       content.toLowerCase().includes("modify") ||
       content.toLowerCase().includes("update") ||
       content.toLowerCase().includes("add") ||
       content.toLowerCase().includes("fix"));
    
    if (isAppGeneration) {
      console.log("Calling generate-app function with prompt:", content);
      
      setGenerationDialog(true);
      setIsGeneratingApp(true);
      setLoading(true);
      
      const processingMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm working on generating your application. This may take a minute or two...",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, processingMessage]);
      
      try {
        const { data, error } = await supabase.functions.invoke('generate-app', {
          body: { prompt: content }
        });

        if (error) {
          console.error("Supabase function error:", error);
          
          setMessages(prev => prev.filter(msg => msg.id !== processingMessage.id));
          
          throw new Error(`Error generating application: ${error.message || "Unknown error"}`);
        }

        const appData = data;
        console.log("App generation successful:", appData);
        setCurrentProjectId(appData.projectId);
        
        setGenerationDialog(false);
        
        setMessages(prev => prev.filter(msg => msg.id !== processingMessage.id));

        const formattedResponse = `I've generated a full-stack application based on your request. Here's what I created:

\`\`\`json
${JSON.stringify(appData, null, 2)}
\`\`\`

You can explore the file structure and content in the panel above. This is a starting point that you can further customize and expand.`;

        const aiMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: formattedResponse,
          metadata: {
            projectId: appData.projectId
          },
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
        toast({
          title: "App Generated Successfully",
          description: `${appData.projectName} has been generated with ${appData.files.length} files.`,
        });
      } catch (error) {
        console.error('Error calling function:', error);
        setGenerationDialog(false);
        setGenerationError(error.message || "An unexpected error occurred");
        
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "An unexpected error occurred",
        });
        
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `I'm sorry, but I encountered an error while processing your request: ${error.message || 'Please try again later.'}
          
If you were trying to generate an app, this might be due to limits with our AI model or connectivity issues. You can try:
1. Using a shorter, more focused prompt (e.g., "Create a simple Twitter clone with basic tweet functionality")
2. Breaking down your request into smaller parts
3. Trying again in a few minutes`,
          timestamp: new Date()
        };
        
        setMessages(prev => prev.filter(msg => msg.id !== processingMessage.id));
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setLoading(false);
        setIsGeneratingApp(false);
      }
    } else if (isModificationRequest) {
      console.log("Calling chat function with modification request for project:", currentProjectId);
      
      setLoading(true);
      
      const processingMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm working on modifying your application. This may take a moment...",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, processingMessage]);
      
      try {
        const { data, error } = await supabase.functions.invoke('chat', {
          body: { 
            message: content,
            projectId: currentProjectId 
          }
        });

        if (error) throw error;

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response,
          metadata: {
            projectId: data.projectId || currentProjectId
          },
          timestamp: new Date()
        };
        
        setMessages(prev => prev.filter(msg => msg.id !== processingMessage.id));
        setMessages(prev => [...prev, aiMessage]);
        
        // Update current project ID if we got a new one from the modification
        if (data.projectId && data.projectId !== currentProjectId) {
          setCurrentProjectId(data.projectId);
        }
        
        toast({
          title: "App Modified Successfully",
          description: "Your application has been updated with your requested changes.",
        });
      } catch (error) {
        console.error('Error calling function:', error);
        setGenerationError(error.message || "An unexpected error occurred");
        
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "An unexpected error occurred",
        });
        
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `I'm sorry, but I encountered an error while modifying your application: ${error.message || 'Please try again later.'}`,
          timestamp: new Date()
        };
        
        setMessages(prev => prev.filter(msg => msg.id !== processingMessage.id));
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      
      const processingMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant", 
        content: "Processing your request...",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, processingMessage]);
      
      try {
        const { data, error } = await supabase.functions.invoke('chat', {
          body: { message: content }
        });

        if (error) throw error;

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response,
          timestamp: new Date()
        };
        
        setMessages(prev => prev.filter(msg => msg.id !== processingMessage.id));
        setMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        console.error('Error calling function:', error);
        setGenerationError(error.message || "An unexpected error occurred");
        
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "An unexpected error occurred",
        });
        
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `I'm sorry, but I encountered an error while processing your request: ${error.message || 'Please try again later.'}`,
          timestamp: new Date()
        };
        
        setMessages(prev => prev.filter(msg => msg.id !== processingMessage.id));
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <ArtifactProvider>
      <div className="h-screen flex overflow-hidden bg-white">
        <ArtifactLayout>
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="h-14 border-b flex items-center px-4 justify-between">
              <div className="flex items-center">
                <HamburgerMenuButton />
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2">Saved memory full</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="ml-5 px-3 py-1 rounded-full bg-gray-100 flex items-center">
                  <span>Temporary</span>
                </div>
                <div className="ml-2 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white">
                  O
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {messages.length === 0 ? (
                <WelcomeScreen onSendMessage={handleSendMessage} />
              ) : (
                <ChatWindow 
                  messages={messages} 
                  loading={loading} 
                />
              )}
              <div ref={messagesEndRef} />
              
              {generationError && (
                <div className="px-4 py-3 mx-auto my-4 max-w-3xl bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
                    <strong>Error generating app:</strong> {generationError}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Try refreshing the page and using a simpler prompt.
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-4 pb-8">
              <InputArea onSendMessage={handleSendMessage} loading={loading} />
            </div>
          </div>
        </ArtifactLayout>

        <Dialog open={generationDialog} onOpenChange={setGenerationDialog}>
          <DialogContent className="sm:max-w-md" onInteractOutside={e => {
            if (isGeneratingApp) {
              e.preventDefault();
            }
          }}>
            <DialogHeader>
              <DialogTitle>Generating Your Application</DialogTitle>
              <DialogDescription>
                Please wait while we generate your application. This may take a minute or two.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <div className="text-center">
                <p className="font-medium">Building app architecture...</p>
                <p className="text-sm text-muted-foreground mt-1">This may take up to 2 minutes.</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ArtifactProvider>
  );
};

export default Index;
