
import { useState, useEffect } from 'react';
import './App.css';
import ChatWindow from './components/ChatWindow';
import InputArea from './components/InputArea';
import { Message } from './types/chat';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSendMessage = (message: string) => {
    if (!message.trim()) return;
    
    // Create a new user message
    const newUserMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    
    // Add the message to chat
    setMessages(prev => [...prev, newUserMessage]);
    
    // Set loading state
    setIsLoading(true);
    
    // Simulate AI response (in a real app, this would call your API)
    setTimeout(() => {
      const aiResponse: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `I received your message: "${message}"`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };
  
  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-auto bg-gray-50">
        <ChatWindow 
          messages={messages} 
          isLoading={isLoading} 
          onSendMessage={handleSendMessage}
        />
      </div>
      <div className="p-4 bg-white border-t border-gray-200">
        <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}

export default App;
