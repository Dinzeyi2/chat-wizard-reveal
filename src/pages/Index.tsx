
import { useState, useRef, useEffect } from "react";
import ChatWindow from "@/components/ChatWindow";
import InputArea from "@/components/InputArea";
import WelcomeScreen from "@/components/WelcomeScreen";
import { Message } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      // Always use deep reasoning
      const { data, error } = await supabase.functions.invoke('deep-reasoning', {
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
    } catch (error) {
      console.error(`Error calling deep-reasoning function:`, error);
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
          <div className="flex items-center text-sm text-gray-600 gap-4">
            <div className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
              <span>Deep Reasoning</span>
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
          <InputArea 
            onSendMessage={handleSendMessage} 
            loading={loading} 
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
