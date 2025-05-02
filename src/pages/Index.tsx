import { useState, useRef, useEffect } from "react";
import ChatWindow from "@/components/ChatWindow";
import InputArea from "@/components/InputArea";
import WelcomeScreen from "@/components/WelcomeScreen";
import { Message, ChallengeInfo } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { ArtifactProvider, ArtifactLayout, useArtifact } from "@/components/artifact/ArtifactSystem";
import { HamburgerMenuButton } from "@/components/HamburgerMenuButton";
import { useLocation } from "react-router-dom";

// Interface for chat history items
interface ChatHistoryItem {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
}

interface ChallengeResult {
  projectId: string;
  projectName: string;
  description: string;
  challengeInfo: {
    title: string;
    description: string;
    missingFeatures: string[];
    difficultyLevel: string;
  };
  files: {
    path: string;
    content: string;
    language: string;
  }[];
  explanation: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isGeneratingApp, setIsGeneratingApp] = useState(false);
  const [generationDialog, setGenerationDialog] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const location = useLocation();

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

  const loadChatHistory = async (chatId: string) => {
    console.log(`Loading chat history for chat ID: ${chatId}`);
    
    // Try to load from localStorage first
    const storedHistory = localStorage.getItem('chatHistory');
    let localChatHistory = storedHistory ? JSON.parse(storedHistory) : [];
    
    // If not found in localStorage, use mock data
    if (!localChatHistory || localChatHistory.length === 0) {
      localChatHistory = chatHistory;
    }
    
    const selectedChat = localChatHistory.find((chat: ChatHistoryItem) => chat.id === chatId);
    
    if (selectedChat) {
      // Simulate loading previous messages based on the chat title
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
      
      // If this chat had a project ID, we would restore it here
      // setCurrentProjectId(mockProjectId);
    }
  };

  // Function to save the current conversation to chat history
  const saveToHistory = (content: string, responseContent: string) => {
    // Only save if there's actual content
    if (!content.trim()) return;
    
    // Generate a chat title based on the first user message
    const chatTitle = content.length > 50 
      ? content.substring(0, 50) + "..." 
      : content;
    
    const now = new Date();
    const timeString = "Just now";
    
    // Create new chat history item
    const newChat: ChatHistoryItem = {
      id: currentChatId || Date.now().toString(),
      title: chatTitle,
      lastMessage: `Last message ${timeString}`,
      timestamp: timeString
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
        chatHistoryArray[existingIndex].lastMessage = `Last message ${timeString}`;
        chatHistoryArray[existingIndex].timestamp = timeString;
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
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleAnalyzeCode = async (code: string) => {
    if (!code.trim() || !currentProjectId) return;
    
    setLoading(true);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `Can you analyze this code and provide feedback?\n\n\`\`\`\n${code}\n\`\`\``,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    const processingMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "Analyzing your code...",
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, processingMessage]);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-code', {
        body: { 
          code: code,
          projectId: currentProjectId,
          language: 'typescript' // Default to typescript, could be more dynamic
        }
      });

      if (error) throw error;

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.analysis,
        timestamp: new Date()
      };
      
      setMessages(prev => prev.filter(msg => msg.id !== processingMessage.id));
      setMessages(prev => [...prev, aiMessage]);
      
    } catch (error) {
      console.error('Error analyzing code:', error);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to analyze code. Please try again.",
      });
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I'm sorry, but I encountered an error while analyzing your code. Please try again later.`,
        timestamp: new Date()
      };
      
      setMessages(prev => prev.filter(msg => msg.id !== processingMessage.id));
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

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
    
    // Check if this is a challenge app generation request
    const isChallengeRequest = 
      (content.toLowerCase().includes("create") || 
       content.toLowerCase().includes("build") || 
       content.toLowerCase().includes("generate") ||
       content.toLowerCase().includes("make") || 
       content.toLowerCase().includes("develop") ||
       content.toLowerCase().includes("code") ||
       content.toLowerCase().includes("challenge")) && 
      (content.toLowerCase().includes("app") || 
       content.toLowerCase().includes("website") || 
       content.toLowerCase().includes("dashboard") || 
       content.toLowerCase().includes("application") ||
       content.toLowerCase().includes("platform") ||
       content.toLowerCase().includes("clone") ||
       content.toLowerCase().includes("system") ||
       content.toLowerCase().includes("project") ||
       content.toLowerCase().includes("site"));
    
    if (isChallengeRequest) {
      console.log("Calling generate-challenge-app function with prompt:", content);
      
      setGenerationDialog(true);
      setIsGeneratingApp(true);
      setLoading(true);
      
      const processingMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm working on generating your coding challenge. This may take a minute or two...",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, processingMessage]);
      
      try {
        const { data, error } = await supabase.functions.invoke('generate-challenge-app', {
          body: { prompt: content }
        });

        if (error) {
          console.error("Supabase function error:", error);
          
          setMessages(prev => prev.filter(msg => msg.id !== processingMessage.id));
          
          throw new Error(`Error generating challenge: ${error.message || "Unknown error"}`);
        }

        const challengeResult = data as ChallengeResult;
        console.log("Challenge generation successful:", challengeResult.projectName);
        setCurrentProjectId(challengeResult.projectId);
        
        setGenerationDialog(false);
        
        setMessages(prev => prev.filter(msg => msg.id !== processingMessage.id));

        // Convert the files to the format expected by the artifact system
        const artifactFiles = challengeResult.files.map(file => ({
          id: crypto.randomUUID(),
          name: file.path.split('/').pop() || file.path,
          path: file.path,
          language: file.language || 'typescript',
          content: file.content
        }));

        // Create artifact to display files
        const artifact = {
          id: challengeResult.projectId,
          title: challengeResult.projectName,
          files: artifactFiles,
          description: challengeResult.description
        };

        // Cast the difficultyLevel to the expected type
        const difficultyLevel = challengeResult.challengeInfo.difficultyLevel.toLowerCase();
        const validatedDifficultyLevel = 
          difficultyLevel === "beginner" || 
          difficultyLevel === "intermediate" || 
          difficultyLevel === "advanced" 
            ? difficultyLevel 
            : "intermediate";

        const formattedResponse = `# 🚀 ${challengeResult.challengeInfo.title} - Coding Challenge

${challengeResult.challengeInfo.description}

## 📋 Missing Features to Implement:
${challengeResult.challengeInfo.missingFeatures.map(feature => `- ${feature}`).join('\n')}

## 🎯 Difficulty Level:
${validatedDifficultyLevel.charAt(0).toUpperCase() + validatedDifficultyLevel.slice(1)}

## 🔍 Instructions:
1. Explore the code in the file explorer panel
2. Find the TODOs and missing features
3. Implement the missing functionality
4. Submit your code for analysis using the "Analyze My Code" button

This challenge will help you gain practical experience solving real-world problems. Good luck!`;

        const aiMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: formattedResponse,
          metadata: {
            projectId: challengeResult.projectId,
            challengeInfo: {
              title: challengeResult.challengeInfo.title,
              description: challengeResult.challengeInfo.description,
              missingFeatures: challengeResult.challengeInfo.missingFeatures,
              difficultyLevel: validatedDifficultyLevel as "beginner" | "intermediate" | "advanced"
            }
          },
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
        // Open the artifact to show the code
        const { openArtifact } = require("@/components/artifact/ArtifactSystem").useArtifact();
        if (openArtifact) {
          openArtifact(artifact);
        }
        
        toast({
          title: "Challenge Generated",
          description: `${challengeResult.projectName} has been generated with ${challengeResult.files.length} files.`,
        });
        
        // Save this conversation to chat history
        saveToHistory(content, formattedResponse);
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
          
If you were trying to generate a challenge, this might be due to limits with our AI model or connectivity issues. You can try:
1. Using a shorter, more focused prompt (e.g., "Create a simple Twitter clone challenge")
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
        // Use the chat function with added context about the current project/challenge
        const { data, error } = await supabase.functions.invoke('chat', {
          body: { 
            message: content,
            projectId: currentProjectId // Include project context if available
          }
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

  return (
    <ArtifactProvider>
      <div className="h-screen flex overflow-hidden bg-white">
        <ArtifactLayout>
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="h-14 border-b flex items-center px-4 justify-between">
              <div className="flex items-center">
                <HamburgerMenuButton />
                <h1 className="ml-4 font-semibold text-lg">CodeLab</h1>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2">Learning mode active</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="ml-5 px-3 py-1 rounded-full bg-gray-100 flex items-center">
                  <span>Coding Challenge</span>
                </div>
                <div className="ml-2 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white">
                  C
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
                    <strong>Error generating challenge:</strong> {generationError}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Try refreshing the page and using a simpler prompt.
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-4 pb-8">
              <InputArea 
                onSendMessage={handleSendMessage} 
                onAnalyzeCode={handleAnalyzeCode}
                loading={loading} 
                currentProjectId={currentProjectId}
              />
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
              <DialogTitle>Generating Your Coding Challenge</DialogTitle>
              <DialogDescription>
                Please wait while we generate your coding challenge project. This may take a minute or two.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <div className="text-center">
                <p className="font-medium">Creating challenge project...</p>
                <p className="text-sm text-muted-foreground mt-1">We're intentionally including educational gaps for you to solve!</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ArtifactProvider>
  );
};

export default Index;
