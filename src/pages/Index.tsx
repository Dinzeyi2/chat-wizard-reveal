
import { useState, useEffect, useRef } from "react";
import ChatWindow from "@/components/ChatWindow";
import InputArea from "@/components/InputArea";
import { v4 as uuidv4 } from "uuid";
import { Message } from "@/types/chat";
import { useLocation, useNavigate } from 'react-router-dom';
import WelcomeScreen from "@/components/WelcomeScreen";
import { ArtifactProvider } from "@/components/artifact/ArtifactSystem";
import { UICodeGenerator } from "@/utils/UICodeGenerator";
import { geminiAIService } from "@/utils/GeminiAIService";
import { supabase } from "@/integrations/supabase/client";

const uiCodeGenerator = new UICodeGenerator({ debug: true });

const Index = () => {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Function to handle retrying failed requests
  const handleRetry = () => {
    // Get the last user message to retry
    const lastUserMessage = [...messages]
      .reverse()
      .find(m => m.role === "user");
    
    if (lastUserMessage) {
      // Remove any error message
      const updatedMessages = messages.filter(m => 
        !(m.role === "assistant" && 
          (m.content.includes("Failed to access Gemini AI") || 
           m.content.includes("Error generating app")))
      );
      
      setMessages(updatedMessages);
      
      // Re-send the last user message
      handleSendMessage(lastUserMessage.content);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const chatParam = params.get("chat");

    if (chatParam) {
      try {
        const decodedChat = JSON.parse(decodeURIComponent(chatParam));
        if (Array.isArray(decodedChat)) {
          setMessages(decodedChat);
        }
      } catch (error) {
        console.error("Error parsing chat parameter:", error);
      }
    } else if (isFirstLoad) {
      // Load welcome message only on the first load
      const welcomeMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: <WelcomeScreen onSendMessage={handleSendMessage} />,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
      setIsFirstLoad(false);
    }
  }, [location.search, isFirstLoad]);

  useEffect(() => {
    // Persist chat history to URL
    const chatHistory = encodeURIComponent(JSON.stringify(messages));
    navigate(`?chat=${chatHistory}`, { replace: true });
  }, [messages, navigate]);

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    
    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    
    // Always add the user message to the chat first
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    setLoading(true);
    
    try {
      // Check if this appears to be an app generation request
      const isAppGenerationRequest = 
        message.toLowerCase().includes("create") || 
        message.toLowerCase().includes("build") || 
        message.toLowerCase().includes("make") || 
        message.toLowerCase().includes("generate");
      
      // If it looks like an app generation request and we don't have a project yet
      if (isAppGenerationRequest && !projectId) {
        // Generate an app with agent orchestration
        const result = await geminiAIService.initializeProject(message, "New Project");
        
        if (result.projectId) {
          setProjectId(result.projectId);
          
          const assistantMessage: Message = {
            id: uuidv4(),
            role: "assistant",
            content: result.assistantMessage,
            timestamp: new Date(),
            metadata: {
              projectId: result.projectId,
              orchestrationEnabled: true
            }
          };
          
          setMessages(prevMessages => [...prevMessages, assistantMessage]);
        }
      } else {
        // Handle regular message
        const assistantMessage: Message = {
          id: uuidv4(),
          role: "assistant",
          content: "This is a placeholder response. I'm still under development!",
          timestamp: new Date(),
        };
        setMessages(prevMessages => [...prevMessages, assistantMessage]);
      }
    } catch (error: any) {
      console.error("Error processing message:", error);
      
      const errorMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: `I'm sorry, but I encountered an error: ${error.message || "Unknown error"}. Please try again with a simpler prompt or try again later.`,
        timestamp: new Date(),
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ArtifactProvider>
      <div className="flex flex-col h-screen">
        <div className="flex-grow overflow-y-auto bg-gray-50">
          <ChatWindow 
            messages={messages} 
            isLoading={loading} 
            projectId={projectId} 
            onRetry={handleRetry}
          />
          <div ref={messagesEndRef} />
        </div>
        <div className="border-t border-gray-200 bg-white">
          <InputArea onSendMessage={handleSendMessage} loading={loading} />
        </div>
      </div>
    </ArtifactProvider>
  );
};

export default Index;
