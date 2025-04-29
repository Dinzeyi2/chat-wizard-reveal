
import React from "react";
import { Message } from "@/types/chat";
import AppGeneratorDisplay from "./AppGeneratorDisplay";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArtifactProvider } from "./artifact/ArtifactSystem";

interface MarkdownRendererProps {
  content: string;
  message?: Message;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, message }) => {
  // More reliable app generation detection with broader patterns
  const isAppGeneration = React.useMemo(() => {
    // Check for app generation indicators with more variations
    const appKeywords = [
      "full-stack application", 
      "generated a", 
      "generated an app",
      "app generation", 
      "created an application",
      "built an application",
      "created a web application",
      "generated your application",
      "built a web app",
      "created an app",
      "built the app",
      "developed an application"
    ];
    
    // Any of these keywords is a strong indicator
    const hasAppKeywords = appKeywords.some(keyword => 
      content.toLowerCase().includes(keyword.toLowerCase())
    );
    
    // Look for JSON structure with more flexible pattern matching
    const hasJsonBlock = content.includes("```json") || 
                         (content.includes("```") && content.includes('"files":')) ||
                         content.includes('"projectName":');
    
    // Check for project structure indicators with broader patterns
    const hasProjectStructure = 
      content.includes('"files":') || 
      content.includes('"path":') ||
      content.includes('"projectName":') ||
      content.includes('"description":') ||
      (content.includes("files") && content.includes("content"));
    
    // More permissive combined check
    const isAppGen = 
      (hasAppKeywords && (hasJsonBlock || hasProjectStructure)) || 
      (hasJsonBlock && hasProjectStructure);
    
    console.log("App generation detection:", { 
      hasAppKeywords, 
      hasJsonBlock, 
      hasProjectStructure, 
      isAppGen 
    });
    
    return isAppGen;
  }, [content]);
  
  if (message && isAppGeneration) {
    console.log("Rendering AppGeneratorDisplay");
    return (
      <ArtifactProvider>
        <AppGeneratorDisplay message={message} />
      </ArtifactProvider>
    );
  }

  // Process normal markdown with better formatting
  // This is a simple implementation - could be expanded with a full markdown parser
  const formattedContent = content
    .split('```')
    .map((block, index) => {
      if (index % 2 === 0) {
        // Text outside code blocks - just wrap paragraphs
        return block.split('\n\n').map((para, i) => 
          <p key={i} className="mb-4">{para}</p>
        );
      } else {
        // Code blocks - add syntax highlighting class
        const firstLine = block.split('\n')[0];
        const language = firstLine || 'plaintext';
        const codeContent = firstLine ? block.substring(firstLine.length + 1) : block;
        
        return (
          <div key={index} className="mb-4">
            <div className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-t-md border border-b-0 border-gray-200">
              {language.trim() || "Code"}
            </div>
            <pre className="bg-gray-100 p-3 rounded-b-md border border-gray-200 overflow-x-auto">
              <code className={`language-${language.trim()}`}>{codeContent}</code>
            </pre>
          </div>
        );
      }
    });

  return (
    <ScrollArea className="max-h-[500px] pr-2">
      <div className="whitespace-pre-wrap">{formattedContent}</div>
    </ScrollArea>
  );
};

export default MarkdownRenderer;
