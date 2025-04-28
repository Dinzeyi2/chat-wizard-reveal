import React from "react";
import { Message } from "@/types/chat";
import MarkdownRenderer from "./MarkdownRenderer";

interface ChatWindowProps {
  messages: Message[];
  loading: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, loading }) => {
  return (
    <div className="px-4 py-5 md:px-8 lg:px-12">
      {messages.map((message) => (
        <div key={message.id} className={`mb-8 ${message.role === "assistant" ? "bg-gray-50 -mx-4 md:-mx-8 lg:-mx-12 p-4 md:p-8 lg:p-12" : ""}`}>
          <div className="flex items-start mb-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${message.role === "assistant" ? "bg-green-600" : "bg-purple-600"} text-white`}>
              {message.role === "assistant" ? "AI" : "U"}
            </div>
            <div className="font-medium">
              {message.role === "assistant" ? "ChatGPT" : "You"}
            </div>
          </div>
          <div className="pl-11 text-gray-800">
            <MarkdownRenderer content={message.content} />
          </div>
        </div>
      ))}
      
      {loading && (
        <div className="mb-8 bg-gray-50 -mx-4 md:-mx-8 lg:-mx-12 p-4 md:p-8 lg:p-12">
          <div className="flex items-start mb-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 bg-green-600 text-white">
              AI
            </div>
            <div className="font-medium">ChatGPT</div>
          </div>
          <div className="pl-11">
            <div className="flex space-x-2">
              <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
