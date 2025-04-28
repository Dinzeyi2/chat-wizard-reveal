
import { useState, useRef, useEffect } from "react";
import ChatWindow from "@/components/ChatWindow";
import InputArea from "@/components/InputArea";
import WelcomeScreen from "@/components/WelcomeScreen";
import { Message } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    
    try {
      // Check if this is a request to generate an app
      const isAppGeneration = content.toLowerCase().includes("create") && 
        (content.toLowerCase().includes("app") || content.toLowerCase().includes("website") || 
         content.toLowerCase().includes("dashboard") || content.toLowerCase().includes("application"));

      if (isAppGeneration) {
        // Use generate-app function
        const { data, error } = await supabase.functions.invoke('generate-app', {
          body: { prompt: content }
        });

        if (error) throw error;

        // Format the response as JSON
        const appData = data;
        const formattedResponse = `I've generated a full-stack application based on your request. Here's what I created:

\`\`\`json
${JSON.stringify(appData, null, 2)}
\`\`\`

You can explore the file structure and content in the panel above. This is a starting point that you can further customize and expand.`;

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: formattedResponse,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
        toast({
          title: "App Generated Successfully",
          description: `${appData.projectName} has been generated with ${appData.files.length} files.`,
        });
      } else {
        // Use regular chat function
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
        
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error calling function:', error);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An unexpected error occurred",
      });
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I'm sorry, but I encountered an error while processing your request. ${error.message || 'Please try again later.'}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-white">
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="h-14 border-b flex items-center px-4 justify-between">
          <div className="flex items-center">
            <h1 className="text-lg font-medium text-gray-700">ChatGPT</h1>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
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
        </div>
        
        <div className="p-4 pb-8">
          <InputArea onSendMessage={handleSendMessage} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default Index;
