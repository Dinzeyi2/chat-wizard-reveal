
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
  // Extract project ID from app generation/modification response
  const projectId = React.useMemo(() => {
    if (!content) return null;
    
    // Try to find project ID in JSON blocks
    const jsonRegex = /```json\n([\s\S]*?)```/;
    const jsonMatch = content.match(jsonRegex);
    
    if (jsonMatch && jsonMatch[1]) {
      try {
        const jsonData = JSON.parse(jsonMatch[1]);
        return jsonData.projectId;
      } catch (e) {
        console.error("Error parsing JSON for projectId:", e);
      }
    }
    
    // Try to find projectId in the message data
    if (message && message.metadata && message.metadata.projectId) {
      return message.metadata.projectId;
    }
    
    return null;
  }, [content, message]);
  
  // Very lenient detection for app generation content
  const isAppGeneration = React.useMemo(() => {
    // If no message, can't be app generation
    if (!message) return false;
    
    // Check for JSON content that looks like an app
    const hasJsonContent = content.includes('```json');
    const hasProjectName = content.includes('"projectName"');
    const hasFiles = content.includes('"files"');
    
    // Check for common app generation phrases
    const generationPhrases = [
      "i've generated", "i have generated", 
      "i've created", "i have created", 
      "i've built", "i have built", 
      "here's what i created", "here's what i built",
      "here is what i created", "here is what i built",
      "i've updated your app", "your app has been updated",
      "i've modified your app"
    ];
    
    const hasGenerationPhrase = generationPhrases.some(phrase => 
      content.toLowerCase().includes(phrase)
    );
    
    // Check for obvious app generation keywords
    const appKeywords = ['app', 'application', 'website', 'project', 'web app', 'dashboard'];
    const generationKeywords = ['generated', 'created', 'built', 'developed', 'made', 'modified', 'updated'];
    
    const hasAppKeyword = appKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );
    
    const hasGenerationKeyword = generationKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );
    
    // Check for file structure indicators
    const fileStructureIndicators = [
      'src/', 'components/', 'pages/', 'public/', 'package.json',
      'index.js', 'index.jsx', 'index.ts', 'index.tsx',
      'app.js', 'app.jsx', 'app.ts', 'app.tsx'
    ];
    const hasFileStructure = fileStructureIndicators.some(indicator => 
      content.toLowerCase().includes(indicator.toLowerCase())
    );
    
    // Count code blocks - multiple code blocks often indicate an app
    const codeBlockCount = (content.match(/```/g) || []).length;
    const hasMultipleCodeBlocks = codeBlockCount >= 4; // At least 2 blocks
    
    // If this is a modification response with a projectId
    const isModification = content.toLowerCase().includes('updated your app') || 
                          (projectId !== null && (
                            content.toLowerCase().includes('modified') || 
                            content.toLowerCase().includes('updated')
                          ));
    
    // Debug
    console.log("App generation detection:", {
      hasJsonContent,
      hasProjectName,
      hasFiles,
      hasGenerationPhrase,
      hasAppKeyword,
      hasGenerationKeyword,
      hasFileStructure,
      hasMultipleCodeBlocks,
      projectId,
      isModification,
      codeBlockCount
    });
    
    // Be VERY lenient - if multiple conditions are met, treat it as app generation
    return isModification || 
           (hasJsonContent && (hasProjectName || hasFiles)) || 
           (hasGenerationPhrase && (hasAppKeyword || hasFileStructure)) ||
           (hasGenerationKeyword && hasAppKeyword && (hasFileStructure || hasMultipleCodeBlocks)) ||
           (projectId !== null) || // If we detected a projectId, it's definitely app generation
           (hasMultipleCodeBlocks && hasFileStructure); // If we have multiple code blocks and file structure
  }, [content, message, projectId]);
  
  if (message && isAppGeneration) {
    console.log("Rendering AppGeneratorDisplay for message:", message.id);
    return (
      <ArtifactProvider>
        <AppGeneratorDisplay message={message} projectId={projectId} />
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
