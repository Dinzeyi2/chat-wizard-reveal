
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
    // Skip detection if no content or message
    if (!content || !message) return false;
    
    // Direct indicators - any of these strongly suggests app generation
    const hasJsonStructure = content.includes('"files":') || 
                             content.includes('"projectName":') || 
                             (content.includes('"path":') && content.includes('"content":'));
    
    // Check for JSON blocks - common in app generation
    const hasJsonBlocks = content.includes("```json") || 
                          (content.includes("```") && hasJsonStructure);
    
    // Check for app-related phrases and keywords
    const appKeywordPhrases = [
      "generated", "created", "built", "developed",
      "full-stack", "application", "app", "website", "web app", 
      "project", "codebase", "code structure"
    ];
    
    // Count how many app-related keywords appear in the content
    const keywordCount = appKeywordPhrases.filter(keyword => 
      content.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    
    // Strong detection logic:
    // 1. Clear JSON structure with files/paths is definitely app generation
    const hasDefinitiveJsonStructure = hasJsonStructure && 
                                      (content.includes('"files":') || 
                                       (content.includes('"path":') && content.includes('"content":')));
    
    // 2. JSON blocks with app-related keywords
    const hasCombinationIndicators = hasJsonBlocks && keywordCount >= 2;
    
    // 3. High density of app-generation keywords
    const hasHighKeywordDensity = keywordCount >= 4;
    
    // Log information for debugging
    const isAppGen = hasDefinitiveJsonStructure || hasCombinationIndicators || hasHighKeywordDensity;
    
    console.log("App generation detection:", { 
      hasJsonStructure, 
      hasJsonBlocks, 
      keywordCount,
      hasDefinitiveJsonStructure,
      hasCombinationIndicators,
      hasHighKeywordDensity,
      isAppGen 
    });
    
    return isAppGen;
  }, [content, message]);
  
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
