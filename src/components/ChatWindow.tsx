import React from "react";
import { Message } from "@/types/chat";
import MarkdownRenderer from "./MarkdownRenderer";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ArtifactProvider, useArtifact, ArtifactLayout } from "./artifact/ArtifactSystem";

interface ChatWindowProps {
  messages: Message[];
  loading: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, loading }) => {
  // Try to access the artifact context to determine if we're in artifact mode
  const isInArtifactContext = (() => {
    try {
      useArtifact();
      return true;
    } catch {
      return false;
    }
  })();

  const MessageContent = () => (
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
                <ArtifactProvider>
                  <MarkdownRenderer content={message.content} message={message} />
                </ArtifactProvider>
              </div>
            </div>
          )}
        </div>
      ))}
      
      {loading && (
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
  );

  // If we're already in an artifact context, just render the messages
  if (isInArtifactContext) {
    return <MessageContent />;
  }

  // Otherwise wrap with the provider and layout
  return (
    <ArtifactProvider>
      <ArtifactLayout>
        <MessageContent />
      </ArtifactLayout>
    </ArtifactProvider>
  );
};

export default ChatWindow;
