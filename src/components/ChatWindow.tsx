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
        message.content.includes("I've generated")
      );
      
      if (appGeneratedMessage) {
        // Logic to extract app data and open in artifact viewer
        console.log("Found app generation message for project:", projectId);
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
    
    // Extract all code blocks
    while ((match = codeRegex.exec(messageContentStr)) !== null) {
      count++;
      const language = match[0].startsWith("```js") ? "javascript" : 
                      match[0].startsWith("```ts") ? "typescript" : 
                      match[0].startsWith("```html") ? "html" : 
                      match[0].startsWith("```css") ? "css" : 
                      "javascript"; // Default to JavaScript
                      
      codeBlocks.push({
        id: `code-block-${count}`,
        name: `Code Block ${count}`,
        path: `code-block-${count}.${language === "javascript" ? "js" : language === "typescript" ? "ts" : language}`,
        language: language,
        content: match[1]
      });
    }
    
    // If no code blocks found with markdown syntax, check for app generation message with project info
    if (codeBlocks.length === 0 && message.metadata?.projectId && message.content.includes("I've generated")) {
      console.log("App generation message detected, checking for files in metadata");
      
      // Try to extract files from metadata if this is an app generation message
      if (message.metadata.appData && message.metadata.appData.files) {
        const appFiles = message.metadata.appData.files;
        
        appFiles.forEach((file: any, index: number) => {
          codeBlocks.push({
            id: `app-file-${index}`,
            name: file.path,
            path: file.path,
            language: getFileLanguage(file.path),
            content: file.content
          });
        });
      }
    }
    
    // If still no code blocks found, use the whole message but try to clean it
    if (codeBlocks.length === 0) {
      // Clean the content - try to extract just code-like parts
      let content = messageContentStr;
      
      // Remove markdown headings
      content = content.replace(/^#+\s+.*$/gm, '');
      // Remove any explanatory text at the beginning
      if (content.includes("I've generated")) {
        const parts = content.split(/(?=```)/);
        if (parts.length > 1) {
          content = parts.slice(1).join('');
        }
      }
      
      codeBlocks.push({
        id: `message-content-${message.id}`,
        name: "Message Content",
        path: "message-content.js",
        language: "javascript",
        content: content.replace(/(<([^>]+)>)/gi, "") // Strip HTML tags
      });
    }
    
    // Create an artifact object
    const artifact = {
      id: `message-${message.id}`,
      title: message.metadata?.projectId ? "Generated App Code" : "Message Code",
      files: codeBlocks,
      description: "Code from assistant's message"
    };
    
    // Open the artifact viewer with the code
    openArtifact(artifact);
    
    console.log(`Opened artifact with ${codeBlocks.length} files`);
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
