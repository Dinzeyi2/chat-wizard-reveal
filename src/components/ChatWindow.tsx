
import React, { useEffect, useState } from "react";
import { Message } from "@/types/chat";
import MarkdownRenderer from "./MarkdownRenderer";
import { ArtifactProvider } from "./artifact/ArtifactSystem";

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading }) => {
  // Add state to track if an app has been generated in this conversation
  const [hasGeneratedApp, setHasGeneratedApp] = useState(false);
  
  // Effect to check messages for app generation
  useEffect(() => {
    // Look for messages that indicate an app was generated
    const appGeneratedMessage = messages.find(message => 
      message.role === "assistant" && 
      message.metadata?.projectId && 
      (message.content.includes("I've generated") || 
       message.content.includes("generated a full-stack application") ||
       message.content.includes("app generation successful"))
    );
    
    // Update state if we found evidence of app generation
    if (appGeneratedMessage && !hasGeneratedApp) {
      setHasGeneratedApp(true);
    }
  }, [messages, hasGeneratedApp]);
  
  // Wrap the chat window in the ArtifactProvider for artifact system integration
  return (
    <ArtifactProvider>
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
                <div className="ml-0 bg-white border border-gray-200 rounded-3xl px-6 py-4 max-w-3xl">
                  {/* Display warning if user asks for another app and one has already been generated */}
                  {hasGeneratedApp && 
                   message.content.includes("I've generated") && 
                   message.metadata?.projectId && 
                   message !== messages.find(m => m.metadata?.projectId) ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                      <p className="text-amber-800 font-medium">
                        An app has already been generated in this conversation. If you'd like to create a new app, please start a new conversation.
                      </p>
                    </div>
                  ) : null}
                  
                  {/* If this is an app-generating message, add a button to view code */}
                  {message.metadata?.projectId && message.role === "assistant" && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                      <p className="font-medium text-blue-800">
                        App code is available in the artifact viewer. 
                      </p>
                    </div>
                  )}
                  
                  <MarkdownRenderer content={message.content} message={message} />
                </div>
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="mb-8">
            <div className="ml-0 bg-white border border-gray-200 rounded-3xl px-6 py-4">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ArtifactProvider>
  );
};

export default ChatWindow;
