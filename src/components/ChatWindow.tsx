
import React from "react";
import { Message } from "@/types/chat";
import MarkdownRenderer from "./MarkdownRenderer";
import { Avatar, AvatarFallback } from "./ui/avatar";

interface ChatWindowProps {
  messages: Message[];
  loading: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, loading }) => {
  return (
    <div className="px-4 py-5 md:px-8 lg:px-12">
      {messages.map((message) => (
        <div key={message.id} className="mb-8">
          {message.role === "user" ? (
            <div className="flex flex-col items-end">
              <div className="bg-gray-100 rounded-3xl px-6 py-4 max-w-3xl">
                <MarkdownRenderer content={message.content} />
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start gap-4 mb-1">
                <Avatar className="h-10 w-10 bg-green-600">
                  <AvatarFallback className="text-white">AI</AvatarFallback>
                </Avatar>
                <div className="font-medium">ChatGPT</div>
              </div>
              <div className="ml-14 bg-white border border-gray-200 rounded-3xl px-6 py-4 max-w-3xl">
                <MarkdownRenderer content={message.content} />
              </div>
            </div>
          )}
        </div>
      ))}
      
      {loading && (
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-1">
            <Avatar className="h-10 w-10 bg-green-600">
              <AvatarFallback className="text-white">AI</AvatarFallback>
            </Avatar>
            <div className="font-medium">ChatGPT</div>
          </div>
          <div className="ml-14 bg-white border border-gray-200 rounded-3xl px-6 py-4">
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
