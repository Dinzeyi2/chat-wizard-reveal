
import React, { useEffect, useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Message } from "@/types/chat";
import { Loader2 } from "lucide-react";
import { useArtifact } from "@/components/artifact/ArtifactSystem";
import { marked } from "marked";
import DOMPurify from "dompurify";
import CodeChallengePanel from "@/components/CodeChallengePanel";
import { useGeminiCodeAnalysis } from "@/hooks/use-gemini-code-analysis";
import { useToast } from "@/hooks/use-toast";

interface ChatWindowProps {
  messages: Message[];
  isLoading?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading }) => {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [currentChallenge, setCurrentChallenge] = useState<any | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const { openArtifact, currentArtifact } = useArtifact();
  const [renderedMessages, setRenderedMessages] = useState<React.ReactNode[]>([]);
  const { analyzeCode, isLoading: isAnalyzing } = useGeminiCodeAnalysis();
  const { toast } = useToast();

  useEffect(() => {
    const challengeData = localStorage.getItem("currentChallenge");
    if (challengeData) {
      try {
        const parsedData = JSON.parse(challengeData);
        setCurrentChallenge(parsedData);
        
        // Check if we have a project ID from a message
        const projectMessage = messages.find(msg => msg.metadata?.projectId);
        if (projectMessage?.metadata?.projectId) {
          setActiveProjectId(projectMessage.metadata.projectId);
        }
      } catch (error) {
        console.error("Error parsing challenge data:", error);
      }
    }
  }, [messages]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, renderedMessages]);

  // Process messages to render markdown and code blocks
  useEffect(() => {
    const processMessages = async () => {
      const processed = messages.map((message, index) => {
        // Skip processing if it's a special message
        if (message.metadata?.type === "special") {
          return (
            <div
              key={message.id || index}
              className="px-4 py-2 rounded-lg text-sm italic text-gray-500 mx-auto"
            >
              {message.content}
            </div>
          );
        }

        // Convert markdown to HTML
        let sanitizedHtml = "";
        try {
          const html = marked.parse(message.content);
          sanitizedHtml = DOMPurify.sanitize(html);
        } catch (error) {
          console.error("Error parsing markdown:", error);
          sanitizedHtml = message.content;
        }

        // Message classes based on sender
        const messageClasses =
          message.role === "user"
            ? "bg-primary/10 text-primary-foreground ml-auto"
            : "bg-secondary text-secondary-foreground";

        // Format timestamp
        const timestamp = message.timestamp instanceof Date
          ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
          <div
            key={message.id || index}
            className={`flex flex-col w-full max-w-3xl mb-6 ${message.role === "user" ? "items-end" : "items-start"}`}
          >
            <div className="flex items-end gap-2">
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/robot-avatar.png" alt="AI" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              )}
              <div
                className={`px-4 py-3 rounded-lg ${messageClasses} ${
                  message.role === "assistant" ? "rounded-tl-none" : "rounded-tr-none"
                }`}
              >
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                />
              </div>
              {message.role === "user" && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/user-avatar.png" alt="User" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              )}
            </div>
            <span className="text-xs text-gray-400 mt-1 mx-2">{timestamp}</span>
          </div>
        );
      });

      setRenderedMessages(processed);
    };

    processMessages();
  }, [messages]);

  const handleAnalyzeCode = async () => {
    if (!currentArtifact || !currentChallenge) {
      toast({
        title: "Cannot analyze code",
        description: "No code files are open for analysis",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await analyzeCode(
        activeProjectId || "unknown",
        currentArtifact.files.map(f => ({ path: f.path, content: f.content })),
        currentChallenge
      );

      // Display feedback in chat
      const feedbackMessage = `
# Code Analysis Results

${result.feedback}

## Suggestions
${result.suggestions.map(s => `
- **${s.file}** ${s.line ? `(Line ${s.line})` : ''} - ${s.severity.toUpperCase()}
  ${s.suggestion}
`).join('\n')}

Overall Score: ${result.overallScore}/100
`;

      // Add this message to the chat
      const newMessage: Message = {
        id: `analyze-${Date.now()}`,
        role: "assistant",
        content: feedbackMessage,
        timestamp: new Date()
      };

      // We can't directly update messages here as it's passed as props
      // This is where you could emit an event or call a callback to add the message
      // For now we'll just show a toast
      toast({
        title: "Analysis Complete",
        description: `Overall Score: ${result.overallScore}/100. View the detailed feedback in the chat.`,
      });
    } catch (error) {
      console.error("Error analyzing code:", error);
    }
  };

  return (
    <div className="h-full overflow-y-auto py-4 flex flex-col">
      <div className="flex-grow">
        {/* Challenge Panel when a challenge is active */}
        {currentChallenge && (
          <div className="px-4 mb-6">
            <CodeChallengePanel
              projectId={activeProjectId || undefined}
              projectName={currentChallenge.projectName}
              challenges={currentChallenge.challenges}
              onAnalyzeCode={handleAnalyzeCode}
              isAnalyzing={isAnalyzing}
            />
          </div>
        )}

        {/* Rendered chat messages */}
        <div className="space-y-4 px-4">
          {renderedMessages}
          
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-gray-500">Thinking...</span>
            </div>
          )}
          
          <div ref={messageEndRef} />
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
