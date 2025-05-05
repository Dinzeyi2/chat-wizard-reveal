
import React, { useState, useEffect } from "react";
import { Message } from "@/types/chat";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { useArtifact } from "@/components/artifact/ArtifactSystem";

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
      
      // Check if we should open the artifact automatically
      if (message.metadata?.projectId) {
        // Try to find code blocks to extract file information
        const codeBlockMatch = content.match(/```json\n([\s\S]*?)\n```/);
        if (codeBlockMatch) {
          try {
            const projectData = JSON.parse(codeBlockMatch[1]);
            
            // If we have files data, open the artifact
            if (projectData && projectData.files && Array.isArray(projectData.files)) {
              // Create artifact structure from project data
              const artifactFiles = projectData.files.map((file: any, index: number) => ({
                id: `file-${index}`,
                name: file.path.split('/').pop() || `file-${index}`,
                path: file.path,
                language: getLanguageFromExtension(file.path),
                content: file.content || ''
              }));
              
              // Open the artifact with the files data
              if (artifactFiles.length > 0) {
                openArtifact({
                  id: message.metadata.projectId,
                  title: projectData.projectName || "Generated Application",
                  files: artifactFiles,
                  description: projectData.description || "Full-stack application"
                });
              }
            }
          } catch (err) {
            console.error("Error parsing artifact data:", err);
          }
        }
      }
    }
  }, [content, message, openArtifact]);
  
  // Helper function to determine language from file extension
  const getLanguageFromExtension = (filePath: string): string => {
    const extension = filePath.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'css': 'css',
      'scss': 'scss',
      'html': 'html',
      'json': 'json',
      'md': 'markdown',
    };
    return languageMap[extension] || 'plaintext';
  };

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
