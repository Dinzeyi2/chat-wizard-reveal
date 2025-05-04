
import React from "react";
import { Message } from "@/types/chat";
import AppGeneratorDisplay from "./AppGeneratorDisplay";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useArtifact, ArtifactProvider } from "./artifact/ArtifactSystem";
import { marked } from "marked";
import DOMPurify from "dompurify";

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
      codeBlockCount,
      isGuidance: message.metadata?.isGuidance
    });
    
    // Be VERY lenient - if multiple conditions are met, treat it as app generation
    return isModification || 
           (hasJsonContent && (hasProjectName || hasFiles)) || 
           (hasGenerationPhrase && (hasAppKeyword || hasFileStructure)) ||
           (hasGenerationKeyword && hasAppKeyword && (hasFileStructure || hasMultipleCodeBlocks)) ||
           (projectId !== null) || 
           (hasMultipleCodeBlocks && hasFileStructure) ||
           (message.metadata?.isGuidance === true);  // Added check for guidance messages
  }, [content, message, projectId]);
  
  // Check if this is specifically AI guidance content that should get special formatting
  const isAIGuidance = React.useMemo(() => {
    if (!message) return false;
    
    // Explicit metadata flag for guidance - highest priority check
    if (message.metadata?.isGuidance === true) return true;
    
    // Check content for guidance patterns
    const hasGuidancePatterns = 
      content.includes("Let's start by") ||
      content.includes("Your next task") ||
      content.includes("In this challenge") ||
      (content.includes("file") && content.includes("modify")) ||
      content.includes("When you've completed this task");
      
    // If it has multiple guidance patterns and is NOT an app generation
    return hasGuidancePatterns && message.role === "assistant" && !isAppGeneration;
  }, [content, message, isAppGeneration]);
  
  if (message && isAppGeneration && !message.metadata?.isGuidance) {
    console.log("Rendering AppGeneratorDisplay for message:", message.id);
    return (
      <ArtifactProvider>
        <AppGeneratorDisplay message={message} projectId={projectId} />
      </ArtifactProvider>
    );
  }
  
  // Special formatting for AI guidance (non-app-generation or explicitly marked as guidance)
  if (message && (isAIGuidance || message.metadata?.isGuidance)) {
    return (
      <ScrollArea className="max-h-[500px]">
        <div className="p-4">
          <div className="prose max-w-none" 
               dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(content)) }}>
          </div>
        </div>
      </ScrollArea>
    );
  }

  // Process normal markdown with better formatting
  return (
    <ScrollArea className="max-h-[500px] pr-2">
      <div className="whitespace-pre-wrap" 
           dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(content)) }}>
      </div>
    </ScrollArea>
  );
};

export default MarkdownRenderer;
