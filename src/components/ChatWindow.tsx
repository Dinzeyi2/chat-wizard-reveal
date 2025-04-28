
import React from "react";
import { Message } from "@/types/chat";
import MarkdownRenderer from "./MarkdownRenderer";

interface ChatWindowProps {
  messages: Message[];
  loading: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, loading }) => {
  return (
    <div className="flex flex-col px-4 py-5 md:px-8 lg:px-12 gap-6">
      {messages.map((message) => (
        <div key={message.id} className={`flex ${message.role === "assistant" ? "self-start" : "self-end flex-row-reverse"}`}>
          <div className={`max-w-[85%] ${message.role === "assistant" ? "mr-3" : "ml-3"}`}>
            <div 
              className={`rounded-2xl px-4 py-3 ${
                message.role === "assistant" 
                  ? "bg-gray-100 rounded-tl-sm" 
                  : "bg-purple-600 text-white rounded-tr-sm"
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">
                <MarkdownRenderer content={message.content} />
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {loading && (
        <div className="flex self-start">
          <div className="max-w-[85%] mr-3">
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
