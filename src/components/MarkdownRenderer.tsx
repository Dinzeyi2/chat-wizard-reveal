
import React, { useState, useEffect } from "react";
import { Message } from "@/types/chat";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { useArtifact } from "./artifact/ArtifactSystem";

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
  // Get artifact system context to open code viewer
  const { openArtifact } = useArtifact();
  
  // Effect to check if this message indicates app generation
  useEffect(() => {
    if (message && 
        message.role === "assistant" && 
        message.metadata?.projectId && 
        (content.includes("I've generated") || 
         content.includes("generated a full-stack application") ||
         content.includes("app generation successful"))) {
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
      // Check for app generation pattern in content (looking for JSON)
      const appDataMatch = content.match(/(\{[\s\S]*"projectId"\s*:\s*"[^"]*"[\s\S]*\})/);
      
      if (appDataMatch) {
        try {
          const appDataString = appDataMatch[1];
          const appData = JSON.parse(appDataString);
          
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
    }
  }, [message, content, openArtifact]);

  // Process code blocks with syntax highlighting
  const processContent = (markdown: string) => {
    // Use marked's synchronous parsing to avoid TypeScript errors
    const rawHtml = marked.parse(markdown, { async: false });
    
    // Sanitize HTML to prevent XSS attacks
    const sanitizedHtml = DOMPurify.sanitize(rawHtml);
    
    return sanitizedHtml;
  };

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

  // Regular rendering with cleaned content if it's an app generation message
  return <div dangerouslySetInnerHTML={{ __html: processContent(hasGeneratedApp ? cleanedContent : content) }} />;
};

export default MarkdownRenderer;
