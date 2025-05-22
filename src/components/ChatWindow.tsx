import React, { useEffect, useState } from "react";
import { Message } from "@/types/chat";
import MarkdownRenderer from "./MarkdownRenderer";
import { ArtifactProvider, useArtifact } from "./artifact/ArtifactSystem";
import { FileCode, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import AgentOrchestration from "./AgentOrchestration";
import { contentIncludes, getContentAsString } from "@/utils/contentUtils";

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  projectId: string | null;
}

// Create a wrapper component that uses useArtifact and handles artifact operations
const ArtifactHandler = ({ messages, projectId }: { messages: Message[], projectId: string | null }) => {
  const { openArtifact } = useArtifact();
  
  useEffect(() => {
    if (projectId) {
      // Handle artifact operations using the projectId when needed
      
      // Look for messages that might contain app data to open in the artifact viewer
      const appGeneratedMessage = messages.find(message => 
        message.role === "assistant" && 
        message.metadata?.projectId === projectId &&
        (message.content.includes("I've generated") ||
         message.content.includes("partial implementation") ||
         message.content.includes("code challenge"))
      );
      
      if (appGeneratedMessage) {
        // Logic to extract app data and open in artifact viewer
        console.log("Found app generation or challenge message for project:", projectId);
      }
    }
  }, [messages, projectId, openArtifact]);
  
  return null; // This component doesn't render anything, it just handles artifacts
};

// Improved component to handle opening message content in artifact viewer
const CodeViewerButton = ({ message, projectId }: { message: Message, projectId: string | null }) => {
  const { openArtifact } = useArtifact();
  
  // Check more explicitly for content that likely contains code
  const hasCode = message.role === "assistant" && 
    (contentIncludes(message.content, "```") || 
     contentIncludes(message.content, "<code>") ||
     contentIncludes(message.content, "function") ||
     contentIncludes(message.content, "const") ||
     contentIncludes(message.content, "class") ||
     contentIncludes(message.content, "import "));
  
  if (!hasCode) return null;
  
  const handleOpenInArtifact = () => {
    // Check if this is a partial code challenge message
    const isPartialChallenge = message.content.includes("partial implementation") || 
                               message.content.includes("code challenge") ||
                               message.content.includes("incomplete project");
    
    // Extract code blocks from message content
    const codeRegex = /```(?:[\w]*)\n([\s\S]*?)```/g;
    let match;
    const codeBlocks = [];
    let count = 0;
    
    // Get full content as string
    const messageContentStr = getContentAsString(message.content);
    if (!messageContentStr) {
      console.error("Failed to get message content as string");
      return;
    }
    
    // Extract all code blocks - IMPORTANT: This should ONLY extract the code inside the blocks, not explanatory text
    while ((match = codeRegex.exec(messageContentStr)) !== null) {
      count++;
      const codeBlockContent = match[0];
      const language = 
        codeBlockContent.startsWith("```js") ? "javascript" : 
        codeBlockContent.startsWith("```ts") ? "typescript" : 
        codeBlockContent.startsWith("```html") ? "html" : 
        codeBlockContent.startsWith("```css") ? "css" : 
        codeBlockContent.startsWith("```jsx") ? "javascript" :
        codeBlockContent.startsWith("```tsx") ? "typescript" :
        codeBlockContent.startsWith("```json") ? "json" :
        "javascript"; // Default to JavaScript
      
      // Extract ONLY the code content between the backticks, not including the backticks themselves
      const codeContent = match[1].trim();
      
      // Create a proper file name based on language
      const extension = language === "javascript" ? "js" : 
                        language === "typescript" ? "ts" : 
                        language === "html" ? "html" :
                        language === "css" ? "css" :
                        language === "json" ? "json" :
                        "js";
      
      // For partial code challenges, mark files as intentionally incomplete
      const isComplete = !isPartialChallenge;
      
      codeBlocks.push({
        id: `code-block-${count}`,
        name: `code-${count}.${extension}`,
        path: `code-${count}.${extension}`,
        language: language,
        content: codeContent, // Use ONLY the extracted code content
        isComplete: isComplete, // Mark as incomplete for code challenges
        ...(isPartialChallenge && {
          challenges: [
            {
              description: "Complete this code implementation",
              difficulty: "medium",
              hints: ["Look for TODO comments in the code"]
            }
          ]
        })
      });
    }
    
    // If no code blocks found with markdown syntax, check for app generation message with project info
    if (codeBlocks.length === 0 && message.metadata?.projectId) {
      console.log("Checking for app files in metadata");
      
      // Try to extract files from metadata if this is an app generation message
      if (message.metadata.appData && message.metadata.appData.files) {
        const appFiles = message.metadata.appData.files;
        
        appFiles.forEach((file: any, index: number) => {
          codeBlocks.push({
            id: `app-file-${index}`,
            name: file.path,
            path: file.path,
            language: getFileLanguage(file.path),
            content: file.content, // This is already just the code content
            isComplete: file.isComplete !== false // Mark as complete unless explicitly marked incomplete
          });
        });
      }
    }
    
    // If we have code blocks, open them in the artifact viewer
    if (codeBlocks.length > 0) {
      // Create an artifact object
      const artifact = {
        id: `message-${message.id}`,
        title: isPartialChallenge ? "Partial Code Challenge" : (message.metadata?.projectId ? "Generated App Code" : "Code Snippets"),
        files: codeBlocks,
        description: isPartialChallenge ? "Intentionally incomplete code for you to complete" : "Code from assistant's message",
        isPartialProject: isPartialChallenge,
        projectPrompt: isPartialChallenge ? "Complete the code implementation" : undefined
      };
      
      // Open the artifact viewer with the code
      openArtifact(artifact);
      console.log(`Opened artifact with ${codeBlocks.length} files`);
    } else {
      console.error("No code blocks found to display");
    }
  };
  
  return (
    <Button 
      variant="ghost" 
      size="sm"
      onClick={handleOpenInArtifact}
      className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 p-1 h-auto"
      title="Open in code editor"
    >
      <FileCode className="h-3 w-3" />
      <span>View in Editor</span>
    </Button>
  );
};

// Helper function to determine file language from file path
const getFileLanguage = (path: string): string => {
  const extension = path.split('.').pop()?.toLowerCase() || '';
  switch (extension) {
    case 'js': return 'javascript';
    case 'jsx': return 'javascript';
    case 'ts': return 'typescript';
    case 'tsx': return 'typescript';
    case 'html': return 'html';
    case 'css': return 'css';
    case 'json': return 'json';
    case 'md': return 'markdown';
    default: return 'javascript';
  }
};

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, projectId }) => {
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
  
  // Find the first message with a projectId
  const firstAppMessage = messages.find(message => 
    message.role === "assistant" && 
    message.metadata?.projectId
  );
  
  return (
    <div className="px-4 py-5 md:px-8 lg:px-12">
      {/* Use the ArtifactHandler to manage artifacts */}
      {projectId && <ArtifactHandler messages={messages} projectId={projectId} />}
      
      {/* Always show orchestration UI if we have a project */}
      {projectId && <AgentOrchestration projectId={projectId} />}
      
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
                {/* Display warning only if this is not the first app-generating message */}
                {hasGeneratedApp && 
                 message.content.includes("I've generated") && 
                 message.metadata?.projectId && 
                 firstAppMessage && 
                 message.id !== firstAppMessage.id ? (
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
                
                {/* Add the code viewer button */}
                <div className="mt-3 flex justify-end">
                  <CodeViewerButton message={message} projectId={projectId} />
                </div>
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
