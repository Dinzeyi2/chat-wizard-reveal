import React, { useState, useEffect } from "react";
import { Message } from "@/types/chat";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { useArtifact } from "./artifact/ArtifactSystem";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { contentIncludes, getContentAsString } from "@/utils/messageUtils";

// Ensure marked uses synchronous mode for type safety
marked.setOptions({
  async: false
});

interface MarkdownRendererProps {
  content: string;
  message?: Message;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, message }) => {
  // Add state to track if an app has been generated in this message
  const [hasGeneratedApp, setHasGeneratedApp] = useState(false);
  const [cleanedContent, setCleanedContent] = useState(content);
  const [activeTab, setActiveTab] = useState<string>("content");
  // Get artifact system context to open code viewer
  const { openArtifact } = useArtifact();
  
  // Effect to check if this message indicates app generation
  useEffect(() => {
    if (message && 
        message.role === "assistant" && 
        message.metadata?.projectId && 
        (contentIncludes(message.content, "I've generated") || 
         contentIncludes(message.content, "generated a full-stack application") ||
         contentIncludes(message.content, "app generation successful"))) {
      setHasGeneratedApp(true);
      
      // Clean the content by removing the JSON code block
      const cleanContent = content.replace(/```json[\s\S]*?```/g, 
        "[App code is available in the artifact viewer above]");
      
      setCleanedContent(cleanContent);
    } else {
      setCleanedContent(content);
    }
  }, [content, message]);

  // Effect to extract app data and open artifact viewer if app code is detected
  useEffect(() => {
    if (message?.role === "assistant" && message.metadata?.projectId) {
      // Check if we have appData in the metadata
      if (message.metadata.appData) {
        try {
          const appData = message.metadata.appData;
          
          // If we have files, open the artifact viewer
          if (appData.files && Array.isArray(appData.files)) {
            // Transform files into artifact format
            const artifactFiles = appData.files.map((file: any) => ({
              id: `file-${file.path.replace(/\//g, '-')}`,
              name: file.path.split('/').pop(),
              path: file.path,
              language: file.path.split('.').pop() || 'js',
              content: file.content
            }));
            
            // Create an artifact object
            const artifact = {
              id: message.metadata.projectId,
              title: appData.projectName || "Generated App",
              description: appData.description || "Generated application code",
              files: artifactFiles
            };
            
            // Open the artifact viewer
            openArtifact(artifact);
          }
        } catch (error) {
          console.error("Failed to parse app data from message:", error);
        }
      }
      
      // Check for code analysis feedback messages
      if (content.includes('AI_CODE_ANALYSIS') || content.includes('CODE_ANALYSIS_RESULT')) {
        // Here we would handle code analysis feedback messages
        console.log("Code analysis feedback detected in message");
      }
    }
  }, [message, content, openArtifact]);

  // Function to apply code updates when suggested by the AI
  const handleApplyCodeUpdate = () => {
    if (message?.metadata?.codeUpdate) {
      // Create a temporary artifact with the updated code
      const artifactFiles = [
        {
          id: `file-updated-code`,
          name: 'updated-code.js', // Default name
          path: 'updated-code.js',
          language: 'javascript', // Default language
          content: message.metadata.codeUpdate
        }
      ];
      
      // Create an artifact object
      const artifact = {
        id: `code-update-${Date.now()}`,
        title: "Code Update",
        description: "Suggested code update",
        files: artifactFiles
      };
      
      // Open the artifact viewer with the updated code
      openArtifact(artifact);
      
      // Set the active tab to the code tab
      setActiveTab("code");
    }
  };

  // Process code blocks with syntax highlighting
  const processContent = (markdown: string) => {
    // Use marked's synchronous parsing to avoid TypeScript errors
    try {
      const rawHtml = marked.parse(markdown, { async: false });
      
      // Sanitize HTML to prevent XSS attacks
      const sanitizedHtml = DOMPurify.sanitize(rawHtml);
      
      return sanitizedHtml;
    } catch (error) {
      console.error("Error parsing markdown:", error);
      return `<p>Error rendering content: ${error instanceof Error ? error.message : "Unknown error"}</p>`;
    }
  };

  // Check if this message has code updates
  const hasCodeUpdate = message?.metadata?.codeUpdate;

  // We'll modify this conditional to only show the warning in specific circumstances
  // Instead of showing on any app-generation message
  if (message && 
      message.role === "assistant" && 
      message.metadata?.projectId && 
      hasGeneratedApp) {
    
    // Only show the warning if this isn't the first app-generation message in the conversation
    // We need to check if this message is NOT the first one with a projectId
    const isMultiAppWarningNeeded = message.content.includes("I've generated") && 
      message.metadata?.projectId && 
      message.id !== message.id; // Always false, meaning this condition is never met for initial generation
    
    return (
      <div>
        {isMultiAppWarningNeeded && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
            <p className="text-amber-800 font-medium">
              An app has already been generated in this conversation. If you'd like to create a new app, please start a new conversation.
            </p>
          </div>
        )}
        <div dangerouslySetInnerHTML={{ __html: processContent(cleanedContent) }} />
      </div>
    );
  }

  // If this message has code updates, show tabs with content and code
  if (hasCodeUpdate) {
    return (
      <div className="space-y-4">
        <div dangerouslySetInnerHTML={{ __html: processContent(cleanedContent) }} />
        
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">Suggested Code Update</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList>
                <TabsTrigger value="content">Explanation</TabsTrigger>
                <TabsTrigger value="code">Code</TabsTrigger>
              </TabsList>
              <TabsContent value="content">
                <p className="text-sm text-gray-700 py-2">
                  I've prepared some code updates based on your request. You can view the updated code in the "Code" tab.
                </p>
                <Button onClick={handleApplyCodeUpdate} className="mt-2">
                  View Suggested Code
                </Button>
              </TabsContent>
              <TabsContent value="code">
                <div className="bg-gray-100 p-4 rounded overflow-auto max-h-[400px]">
                  <pre className="text-xs">
                    <code>{message?.metadata?.codeUpdate}</code>
                  </pre>
                </div>
                <Button onClick={handleApplyCodeUpdate} className="mt-4">
                  Open in Editor
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Regular rendering with cleaned content if it's an app generation message
  return <div dangerouslySetInnerHTML={{ __html: processContent(hasGeneratedApp ? cleanedContent : content) }} />;
};

export default MarkdownRenderer;
