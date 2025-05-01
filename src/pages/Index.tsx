import { useState, useRef, useEffect } from "react";
import ChatWindow from "@/components/ChatWindow";
import InputArea from "@/components/InputArea";
import WelcomeScreen from "@/components/WelcomeScreen";
import { Message, Json } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { ArtifactProvider, ArtifactLayout } from "@/components/artifact/ArtifactSystem";
import { HamburgerMenuButton } from "@/components/HamburgerMenuButton";
import { useLocation } from "react-router-dom";
import { UserProfileMenu } from "@/components/UserProfileMenu";

// Interface for chat history items
interface ChatHistoryItem {
  id: string;
  title: string;
  last_message?: string;
  timestamp: string;
  messages?: Message[]; // Add messages array to store full conversation
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isGeneratingApp, setIsGeneratingApp] = useState(false);
  const [generationDialog, setGenerationDialog] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const location = useLocation();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
      
      // Set up auth state change listener
      const { data: { subscription } } = await supabase.auth.onAuthStateChange(
        (_, session) => {
          setIsAuthenticated(!!session);
        }
      );
      
      return () => {
        subscription.unsubscribe();
      };
    };
    
    checkAuth();
  }, []);

  useEffect(() => {
    // Parse chat ID from URL if present
    const searchParams = new URLSearchParams(location.search);
    const chatId = searchParams.get('chat');
    
    if (chatId) {
      setCurrentChatId(chatId);
      // Load the specific chat history
      loadChatHistory(chatId);
    } else {
      // Clear messages if starting a new chat
      setMessages([]);
      setCurrentChatId(null);
    }
  }, [location]);

  const loadChatHistory = async (chatId: string) => {
    console.log(`Loading chat history for chat ID: ${chatId}`);
    
    try {
      if (isAuthenticated) {
        // Try to load from Supabase
        const { data, error } = await supabase
          .from('chat_history')
          .select('*')
          .eq('id', chatId)
          .single();
        
        if (error) {
          console.error("Error fetching chat from Supabase:", error);
          throw error;
        }
        
        if (data) {
          console.log("Found chat in Supabase:", data);
          if (data.messages && Array.isArray(data.messages)) {
            // Format dates in the messages
            const formattedMessages = data.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }));
            
            setMessages(formattedMessages);
            
            // If this chat had a project ID, restore it
            const projectMsg = formattedMessages.find((msg: Message) => msg.metadata?.projectId);
            if (projectMsg && projectMsg.metadata?.projectId) {
              setCurrentProjectId(projectMsg.metadata.projectId);
            }
            
            return;
          }
        }
      }
      
      // Fall back to localStorage if not found in Supabase or not authenticated
      const storedHistory = localStorage.getItem('chatHistory');
      let localChatHistory = storedHistory ? JSON.parse(storedHistory) : [];
      
      const selectedChat = localChatHistory.find((chat: ChatHistoryItem) => chat.id === chatId);
      
      if (selectedChat) {
        if (selectedChat.messages && selectedChat.messages.length > 0) {
          // Use stored message history if available
          console.log("Loading saved conversation with", selectedChat.messages.length, "messages from localStorage");
          
          // Format dates in the messages
          const formattedMessages = selectedChat.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          
          setMessages(formattedMessages);
          
          // If this chat had a project ID, restore it
          const projectMsg = formattedMessages.find((msg: Message) => msg.metadata?.projectId);
          if (projectMsg && projectMsg.metadata?.projectId) {
            setCurrentProjectId(projectMsg.metadata.projectId);
          }
        } else {
          // Fallback to creating placeholder messages if no saved messages
          console.log("No stored messages found, creating placeholder messages");
          const userMessage: Message = {
            id: "user-" + Date.now().toString(),
            role: "user",
            content: selectedChat.title,
            timestamp: new Date(Date.now() - 3600000) // 1 hour ago
          };
          
          const assistantMessage: Message = {
            id: "assistant-" + Date.now().toString(),
            role: "assistant",
            content: `This is a previous conversation about "${selectedChat.title}". I'm here to continue helping you with this topic.`,
            timestamp: new Date(Date.now() - 3500000) // A bit less than 1 hour ago
          };
          
          setMessages([userMessage, assistantMessage]);
        }
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load chat history. Please try again.",
      });
    }
  };

  // Function to save the current conversation to chat history
  const saveToHistory = async (content: string, responseContent: string) => {
    // Only save if there's actual content
    if (!content.trim()) return;
    
    try {
      // Generate a chat title based on the first user message
      const chatTitle = content.length > 50 
        ? content.substring(0, 50) + "..." 
        : content;
      
      const now = new Date();
      const timeString = "Just now";
      
      // Add new messages to the history
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
        timestamp: now
      };
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
        timestamp: now,
        metadata: currentProjectId ? { projectId: currentProjectId } : undefined
      };
      
      // Update messages state with the new messages
      const updatedMessages = [...messages, userMessage, assistantMessage];
      setMessages(updatedMessages);
      
      if (isAuthenticated) {
        // Save to Supabase if authenticated
        const { data: session } = await supabase.auth.getSession();
        
        if (session.session) {
          // Convert Message[] to a JSON-compatible structure for Supabase
          const serializableMessages = updatedMessages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp.toISOString()
          }));
          
          if (currentChatId) {
            // Update existing chat
            const { error } = await supabase
              .from('chat_history')
              .update({
                last_message: `Last message ${timeString}`,
                messages: serializableMessages as unknown as Json,
                updated_at: now.toISOString()
              })
              .eq('id', currentChatId);
            
            if (error) {
              console.error("Error updating chat in Supabase:", error);
              throw error;
            }
          } else {
            // Create new chat
            const { data, error } = await supabase
              .from('chat_history')
              .insert({
                user_id: session.session.user.id,
                title: chatTitle,
                last_message: `Last message ${timeString}`,
                messages: serializableMessages as unknown as Json
              })
              .select();
            
            if (error) {
              console.error("Error creating chat in Supabase:", error);
              throw error;
            }
            
            if (data && data[0]) {
              setCurrentChatId(data[0].id);
            }
          }
        }
      } else {
        // Save to localStorage if not authenticated
        // Create new chat history item
        const newChat: ChatHistoryItem = {
          id: currentChatId || Date.now().toString(),
          title: chatTitle,
          last_message: `Last message ${timeString}`,
          timestamp: timeString,
          messages: updatedMessages
        };
        
        // Get existing history or initialize empty array
        const storedHistory = localStorage.getItem('chatHistory');
        let chatHistoryArray: ChatHistoryItem[] = [];
        
        try {
          if (storedHistory) {
            chatHistoryArray = JSON.parse(storedHistory);
          }
        } catch (error) {
          console.error("Error parsing chat history:", error);
        }
        
        // If we have a current chat ID, update that chat
        if (currentChatId) {
          const existingIndex = chatHistoryArray.findIndex(chat => chat.id === currentChatId);
          if (existingIndex >= 0) {
            chatHistoryArray[existingIndex].last_message = `Last message ${timeString}`;
            chatHistoryArray[existingIndex].timestamp = timeString;
            chatHistoryArray[existingIndex].messages = updatedMessages;
          } else {
            chatHistoryArray.unshift(newChat);
          }
        } else {
          // Set the current chat ID to the new chat's ID
          const newChatId = Date.now().toString();
          setCurrentChatId(newChatId);
          newChat.id = newChatId;
          
          // Add new chat to beginning of array
          chatHistoryArray.unshift(newChat);
        }
        
        // Save updated history back to localStorage
        localStorage.setItem('chatHistory', JSON.stringify(chatHistoryArray));
      }
    } catch (error) {
      console.error("Error saving chat history:", error);
      toast({
        variant: "destructive", 
        title: "Error",
        description: "Failed to save chat history."
      });
    }
  };

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
        
        // Save this conversation to chat history
        if (data && data.response) {
          saveToHistory(content, formattedResponse);
        }
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
        
        // Save this conversation to chat history
        if (data && data.response) {
          saveToHistory(content, data.response);
        }
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
        
        // Save this conversation to chat history
        saveToHistory(content, data.response);
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

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <UserProfileMenu />
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
