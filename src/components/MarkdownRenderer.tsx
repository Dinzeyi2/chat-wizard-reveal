
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

  // Handle content with special app warning
  if (message && 
      message.role === "assistant" && 
      message.metadata?.projectId && 
      hasGeneratedApp) {
    // Split content to add warning at the top
    return (
      <div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
          <p className="text-amber-800 font-medium">
            An app has already been generated in this conversation. If you'd like to create a new app, please start a new conversation.
          </p>
        </div>
        <div dangerouslySetInnerHTML={{ __html: processContent(content) }} />
      </div>
    );
  }

  // Regular rendering
  return <div dangerouslySetInnerHTML={{ __html: processContent(content) }} />;
};

export default MarkdownRenderer;
