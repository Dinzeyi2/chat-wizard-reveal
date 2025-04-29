
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
  // More robust detection for app generation content
  const isAppGeneration = React.useMemo(() => {
    // Comprehensive check for app generation markers
    const hasJsonBlocks = content.includes("```json") && content.includes("```");
    const appKeywords = ["projectName", "files", "description"];
    const keywordsPresent = appKeywords.filter(keyword => content.includes(keyword)).length;
    
    // Enhanced detection logic that's more lenient but still accurate
    const hasDefinitiveJsonStructure = content.includes('"files":') && content.includes('"path":') && content.includes('"content":');
    const hasCombinationIndicators = content.includes("generated") && content.includes("application") && content.includes("files");

    console.info("App generation detection:", { 
      hasJsonStructure: hasDefinitiveJsonStructure, 
      hasJsonBlocks, 
      keywordCount: keywordsPresent,
      hasDefinitiveJsonStructure,
      hasCombinationIndicators,
      hasHighKeywordDensity: keywordsPresent >= 2,
      isAppGen: (hasJsonBlocks && keywordsPresent >= 2) || hasDefinitiveJsonStructure || hasCombinationIndicators
    });
    
    // Return true if multiple indicators are present
    return (hasJsonBlocks && keywordsPresent >= 2) || hasDefinitiveJsonStructure || hasCombinationIndicators;
  }, [content]);
  
  if (message && isAppGeneration) {
    console.info("Rendering AppGeneratorDisplay");
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
