
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { PlusIcon, Search, ArrowLeft } from "lucide-react";

interface ChatHistoryItem {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
}

const ChatHistory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  
  // Mock data for chat history
  const chatHistory: ChatHistoryItem[] = [
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

  const filteredChats = chatHistory.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChatSelection = (chatId: string) => {
    // Here we navigate to the main chat page with the specific chat ID
    navigate(`/?chat=${chatId}`);
  };

  // Function to handle creating a new chat
  const handleNewChat = () => {
    // Navigate to the home page without any chat ID parameter to start fresh
    navigate('/');
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="outline" size="icon" className="rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-medium text-gray-800">Your chat history</h1>
        </div>
        <Button className="rounded-full" onClick={handleNewChat}>
          <PlusIcon className="mr-2 h-4 w-4" />
          New chat
        </Button>
      </div>
      
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input 
          type="search"
          placeholder="Search your chats..." 
          className="pl-10 border-blue-300 focus:border-blue-500 rounded-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <p className="text-gray-600 mb-6">
        You have {chatHistory.length} previous chats with Claude. <span className="text-blue-500 cursor-pointer">Select</span>
      </p>
      
      <div className="space-y-4">
        {filteredChats.map(chat => (
          <Card 
            key={chat.id} 
            className="cursor-pointer hover:bg-gray-50 p-4 transition-colors"
            onClick={() => handleChatSelection(chat.id)}
          >
            <h2 className="font-medium text-gray-800">{chat.title}</h2>
            <p className="text-sm text-gray-500">{chat.lastMessage}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ChatHistory;
