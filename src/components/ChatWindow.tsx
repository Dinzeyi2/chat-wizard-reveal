
import React from "react";
import { Message } from "@/types/chat";
import MarkdownRenderer from "./MarkdownRenderer";

interface ChatWindowProps {
  messages: Message[];
  loading: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, loading }) => {
  return (
    <div className="px-4 py-5 md:px-8 flex flex-col space-y-6">
      {messages.map((message) => (
        <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`flex items-start max-w-3xl ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${message.role === "assistant" ? "bg-green-600 mr-3" : "bg-purple-600 ml-3"} text-white`}>
              {message.role === "assistant" ? "AI" : "U"}
            </div>
            <div className={`${message.role === "user" ? "bg-gray-100 rounded-2xl rounded-tr-none" : "bg-white rounded-2xl rounded-tl-none border border-gray-200"} px-4 py-3`}>
              <div className="text-gray-800">
                <MarkdownRenderer content={message.content} />
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {loading && (
        <div className="flex justify-start">
          <div className="flex items-start max-w-3xl">
            <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 bg-green-600 text-white shrink-0">
              AI
            </div>
            <div className="bg-white rounded-2xl rounded-tl-none border border-gray-200 px-4 py-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
