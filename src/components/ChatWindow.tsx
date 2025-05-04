
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
    // Process messages to handle guidance steps
    const processMessages = () => {
      const processed: Message[] = [];
      
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        processed.push(message);
        
        // Check if this is an AI message with a projectId and there isn't already a guidance message following it
        if (message.role === "assistant" && 
            message.metadata?.projectId && 
            !message.metadata?.isGuidance &&
            !(i < messages.length - 1 && messages[i + 1].metadata?.isGuidance)) {
          
          // Check console logs for ANY FIRST TASK message
          if (window.console) {
            const originalConsoleLog = console.log;
            let firstTaskMessage = "";
            
            console.log = function(message) {
              if (typeof message === "string" && message.includes("AI FIRST TASK:")) {
                firstTaskMessage = message.replace("AI FIRST TASK:", "").trim();
              }
              originalConsoleLog.apply(console, arguments);
            };
            
            // Restore original console.log
            console.log = originalConsoleLog;
            
            if (firstTaskMessage) {
              // Insert a synthetic guidance message with standard format
              processed.push({
                id: `guidance-${message.id}`,
                role: "assistant",
                content: firstTaskMessage,
                timestamp: new Date(),
                metadata: {
                  projectId: message.metadata.projectId,
                  isGuidance: true,
                  projectName: message.metadata.projectName
                }
              });
            }
          }
        }
      }
      
      setProcessedMessages(processed);
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
