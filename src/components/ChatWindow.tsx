
import React, { useEffect, useState } from "react";
import { Message } from "@/types/chat";
import MarkdownRenderer from "./MarkdownRenderer";
import StepProgressDisplay from "./StepProgressDisplay";
import { ImplementationStep } from '@/utils/StructuredAIGuide';
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage?: (message: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, onSendMessage }) => {
  const [processedMessages, setProcessedMessages] = useState<Message[]>([]);
  const [lastProjectId, setLastProjectId] = useState<string | null>(null);
  const [guidanceSent, setGuidanceSent] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    // Process messages consistently to ensure all are captured for history
    const processMessages = () => {
      // Simply copy all messages to processed array
      setProcessedMessages([...messages]);
      
      // Save conversation to history if there are messages
      if (messages.length > 0) {
        saveConversation(messages);
      }
      
      // Check for app generation messages to trigger guidance follow-up
      detectAppGenerationAndSendGuidance(messages);
    };
    
    processMessages();
  }, [messages]);
  
  // Function to detect app generation messages and send guidance
  const detectAppGenerationAndSendGuidance = (messages: Message[]) => {
    if (!onSendMessage) return;
    
    // Check the last message for app generation content
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;
    
    // Skip if not from assistant
    if (lastMessage.role !== 'assistant') return;
    
    // Extract projectId from metadata or content
    const projectId = lastMessage.metadata?.projectId || extractProjectIdFromContent(lastMessage.content);
    
    // If we found a projectId and haven't sent guidance for it yet
    if (projectId && !guidanceSent[projectId]) {
      console.log("Detected app generation with projectId:", projectId);
      
      // Wait a moment before sending the follow-up guidance
      setTimeout(() => {
        // Mark this projectId as having received guidance
        setGuidanceSent(prev => ({ ...prev, [projectId]: true }));
        setLastProjectId(projectId);
        
        // Send the guidance message
        onSendMessage(
          "I've created your app! Let's start implementing the next step. " +
          "Click the \"I've completed this\" button when you're done with each step, " +
          "and I'll guide you through fixing all the issues one by one."
        );
      }, 1000);
    }
  };
  
  // Helper function to extract projectId from message content
  const extractProjectIdFromContent = (content: any): string | null => {
    if (typeof content !== 'string') return null;
    
    // Try to find project ID in JSON blocks
    const jsonRegex = /```json\n([\s\S]*?)```/;
    const jsonMatch = content.match(jsonRegex);
    
    if (jsonMatch && jsonMatch[1]) {
      try {
        const jsonData = JSON.parse(jsonMatch[1]);
        return jsonData.projectId || null;
      } catch (e) {
        console.error("Error parsing JSON for projectId:", e);
      }
    }
    
    return null;
  };
  
  // Function to save conversation to history
  const saveConversation = async (messages: Message[]) => {
    if (messages.length === 0) return;
    
    try {
      // Extract content from the latest message for title generation
      const lastMessage = messages[messages.length - 1];
      const lastContent = typeof lastMessage.content === 'string' ? lastMessage.content : JSON.stringify(lastMessage.content);
      
      // Create a title from the first user message or use default
      let title = "Untitled Conversation";
      const firstUserMessage = messages.find(msg => msg.role === "user");
      if (firstUserMessage && typeof firstUserMessage.content === 'string') {
        title = firstUserMessage.content.substring(0, 30) + (firstUserMessage.content.length > 30 ? "..." : "");
      }
      
      // Generate a unique ID for the conversation if needed
      const conversationId = lastMessage.metadata?.chatId || uuidv4();
      
      // Convert Message objects to JSON-serializable format
      const serializableMessages = messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp
      }));
      
      // Try to save to Supabase first
      const { data: session } = await supabase.auth.getSession();
      
      if (session.session) {
        // User is logged in, save to Supabase
        const { error } = await supabase
          .from('chat_history')
          .upsert({
            id: conversationId,
            title: title,
            messages: serializableMessages,
            last_message: lastContent.substring(0, 100),
            user_id: session.session.user.id,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id',
            ignoreDuplicates: false
          });
          
        if (error) {
          console.error("Failed to save conversation to Supabase:", error);
          // Fall back to localStorage
          saveToLocalStorage(conversationId, title, messages, lastContent);
        }
      } else {
        // No session, save to localStorage
        saveToLocalStorage(conversationId, title, messages, lastContent);
      }
    } catch (error) {
      console.error("Error saving conversation:", error);
      // Attempt localStorage as final fallback
      try {
        const conversationId = uuidv4();
        const lastContent = messages[messages.length - 1].content;
        const title = "Conversation " + new Date().toLocaleString();
        saveToLocalStorage(conversationId, title, messages, lastContent);
      } catch (e) {
        console.error("Failed to save to localStorage:", e);
      }
    }
  };
  
  const saveToLocalStorage = (id: string, title: string, messages: Message[], lastMessage: any) => {
    try {
      // Get existing history or initialize empty array
      const existingHistory = localStorage.getItem('chatHistory');
      let history = existingHistory ? JSON.parse(existingHistory) : [];
      
      // Convert Message objects to JSON-serializable format for localStorage
      const serializableMessages = messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp
      }));
      
      // Check if conversation already exists in history
      const existingIndex = history.findIndex((item: any) => item.id === id);
      
      const historyItem = {
        id,
        title,
        messages: serializableMessages,
        last_message: typeof lastMessage === 'string' ? 
          lastMessage.substring(0, 100) : 
          JSON.stringify(lastMessage).substring(0, 100),
        timestamp: new Date().toISOString()
      };
      
      if (existingIndex >= 0) {
        // Update existing conversation
        history[existingIndex] = historyItem;
      } else {
        // Add new conversation
        history.unshift(historyItem);
      }
      
      // Keep only the latest 50 conversations
      history = history.slice(0, 50);
      
      localStorage.setItem('chatHistory', JSON.stringify(history));
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  };
  
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
