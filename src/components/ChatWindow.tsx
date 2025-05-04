
import React, { useEffect, useState } from "react";
import { Message } from "@/types/chat";
import MarkdownRenderer from "./MarkdownRenderer";
import StepProgressDisplay from "./StepProgressDisplay";
import { ImplementationStep } from '@/utils/StructuredAIGuide';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading }) => {
  const [processedMessages, setProcessedMessages] = useState<Message[]>([]);
  
  useEffect(() => {
    // Process messages consistently to ensure all are captured for history
    const processMessages = () => {
      // Simply copy all messages to processed array, without complex transformations
      // This ensures all conversations are treated the same way
      setProcessedMessages([...messages]);
    };
    
    processMessages();
  }, [messages]);
  
  return (
    <div className="px-4 py-5 md:px-8 lg:px-12">
      {processedMessages.map((message) => (
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
                <MarkdownRenderer content={message.content} message={message} />
                
                {message.metadata?.isGuidance && message.metadata?.projectId && (
                  <div className="mt-4">
                    <StepProgressDisplay
                      steps={[{
                        id: "step-1",
                        name: "First Step",
                        description: "Complete the first implementation task",
                        difficulty: "beginner",
                        type: "frontend"
                      }]}
                      currentStep={{
                        id: "step-1",
                        name: "First Step",
                        description: "Complete the first implementation task",
                        difficulty: "beginner",
                        type: "frontend"
                      }}
                      stepProgress={{
                        "step-1": { status: "in_progress" }
                      }}
                      onCompleteStep={(stepId) => {
                        console.log("Step completed:", stepId);
                        // Implementation of step completion would be handled in the parent component
                      }}
                    />
                  </div>
                )}
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
  );
};

export default ChatWindow;
