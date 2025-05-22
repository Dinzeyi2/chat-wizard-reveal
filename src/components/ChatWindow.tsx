import React, { useEffect, useState } from "react";
import { Message } from "@/types/chat";
import MarkdownRenderer from "./MarkdownRenderer";
import { ArtifactProvider, useArtifact } from "./artifact/ArtifactSystem";
import { FileCode, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import AgentOrchestration from "./AgentOrchestration";
import { contentIncludes, getContentAsString } from "@/utils/contentUtils";
import { getGeminiVisionService } from "@/utils/GeminiVisionService";

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
      
      if (appGeneratedMessage && appGeneratedMessage.metadata?.appData?.files) {
        // Logic to extract app data and open in artifact viewer
        console.log("Found app generation message for project:", projectId);
        
        const appData = appGeneratedMessage.metadata.appData;
        
        // Transform files into artifact format with incomplete flags
        const artifactFiles = appData.files.map((file: any) => ({
          id: `file-${file.path.replace(/\//g, '-')}`,
          name: file.path.split('/').pop(),
          path: file.path,
          language: file.path.split('.').pop() || 'js',
          content: file.content,
          isComplete: file.isComplete !== undefined ? file.isComplete : true,
          challenges: file.challenges || []
        }));
        
        // Create an artifact object with ONLY code, no explanations
        const artifact = {
          id: appGeneratedMessage.metadata.projectId,
          title: appData.projectName || "Generated App",
          description: "Generated application code with learning challenges",
          files: artifactFiles,
          challenges: appData.challenges || []
        };
        
        // Open the artifact viewer with the incomplete code
        openArtifact(artifact);
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
      
      codeBlocks.push({
        id: `code-block-${count}`,
        name: `code-${count}.${extension}`,
        path: `code-${count}.${extension}`,
        language: language,
        content: codeContent, // Use ONLY the extracted code content
        isComplete: false // Mark as incomplete by default
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
            isComplete: file.isComplete !== undefined ? file.isComplete : true,
            challenges: file.challenges || []
          });
        });
      }
    }
    
    // If still no code blocks found but message suggests there should be code
    if (codeBlocks.length === 0 && messageContentStr.includes("I've generated")) {
      console.log("No code blocks found, but message suggests code generation");
      
      // Parse app structure from message content - look for what appears to be file paths or component names
      const possibleComponentRegex = /(?:component|file|created):\s*['"]*([A-Z][A-Za-z]*(?:\.(?:js|jsx|ts|tsx))?)/g;
      let componentMatch;
      
      while ((componentMatch = possibleComponentRegex.exec(messageContentStr)) !== null) {
        const componentName = componentMatch[1];
        
        // Create a placeholder file for this component
        codeBlocks.push({
          id: `component-${componentName}`,
          name: `${componentName}.jsx`,
          path: `${componentName}.jsx`,
          language: "javascript",
          content: `// This is a placeholder for ${componentName}\n// The actual code was not provided in a code block format\n// TODO: Implement this component\n\nimport React from 'react';\n\nconst ${componentName} = () => {\n  return (\n    <div>\n      ${componentName} Component\n    </div>\n  );\n};\n\nexport default ${componentName};`,
          isComplete: false, // Mark as incomplete to show it needs implementation
          challenges: [{
            description: `Implement the ${componentName} component`,
            difficulty: 'medium',
            hints: ['Look at the project requirements', 'Consider what this component needs to do']
          }]
        });
      }
      
      // If we still don't have any code blocks, add a generic placeholder
      if (codeBlocks.length === 0) {
        codeBlocks.push({
          id: `generated-app`,
          name: "App.jsx",
          path: "App.jsx",
          language: "javascript",
          content: `// Generated App\n// TODO: Implement core functionality\n// This is a placeholder component\n\nimport React from 'react';\n\nfunction App() {\n  return (\n    <div className="app">\n      <h1>Generated Application</h1>\n      <p>The AI mentioned generating an app, but didn't provide code blocks.</p>\n      <p>// TODO: Implement main application features</p>\n    </div>\n  );\n}\n\nexport default App;`,
          isComplete: false, // Mark as incomplete
          challenges: [{
            description: 'Implement the main App functionality',
            difficulty: 'hard',
            hints: ['Start by adding state for key features', 'Break down into smaller components']
          }]
        });
      }
    }
    
    // If we have code blocks, open them in the artifact viewer
    if (codeBlocks.length > 0) {
      // Create an artifact object
      const artifact = {
        id: `message-${message.id}`,
        title: message.metadata?.projectId ? "Generated App Code" : "Code Snippets",
        files: codeBlocks,
        description: message.metadata?.projectId ? "Application with learning challenges" : "Code from assistant's message"
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
  const [visionEnabled, setVisionEnabled] = useState(false);
  
  // Check if Gemini Vision is available
  useEffect(() => {
    // Initialize Gemini Vision service if not already initialized
    const visionService = getGeminiVisionService();
    setVisionEnabled(visionService.isVisionEnabled());
    
    // Listen for console logs that might indicate vision status changes
    const handleConsoleLog = (event: any) => {
      if (event.args && event.args[0] && typeof event.args[0] === 'string') {
        const logMessage = event.args[0];
        if (logMessage.includes('GEMINI_VISION_ACTIVATED')) {
          setVisionEnabled(true);
        } else if (logMessage.includes('GEMINI_VISION_DEACTIVATED')) {
          setVisionEnabled(false);
        }
      }
    };
    
    // This is just for demonstration - in a real app, you'd use a proper event system
    console.addEventListener?.('log', handleConsoleLog);
    
    return () => {
      console.removeEventListener?.('log', handleConsoleLog);
    };
  }, []);
  
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
      
      {/* Display Gemini Vision status */}
      {visionEnabled && (
        <div className="mb-4 p-2 bg-blue-50 border border-blue-100 rounded-lg flex items-center">
          <div className="animate-pulse mr-2 h-2 w-2 rounded-full bg-blue-500"></div>
          <p className="text-xs text-blue-800">
            Gemini Vision is active and monitoring your code editor
          </p>
        </div>
      )}
      
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
                      App code with intentional learning challenges is available in the artifact viewer.
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
