
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
  // Very lenient detection for app generation content
  const isAppGeneration = React.useMemo(() => {
    // If no message, can't be app generation
    if (!message) return false;
    
    // Check for obvious app generation keywords
    const appKeywords = ['app', 'application', 'website', 'project', 'web app', 'dashboard'];
    const generationKeywords = ['generated', 'created', 'built', 'developed', 'made'];
    
    // Combine words to create strong indicators
    const strongIndicators = [];
    generationKeywords.forEach(gen => {
      appKeywords.forEach(app => {
        strongIndicators.push(`${gen} ${app}`);
        strongIndicators.push(`${gen} a ${app}`);
        strongIndicators.push(`${gen} an ${app}`);
        strongIndicators.push(`${gen} this ${app}`);
      });
    });
    
    // Check for any of these strong indicators in the content
    const hasStrongIndicator = strongIndicators.some(indicator => 
      content.toLowerCase().includes(indicator.toLowerCase())
    );
    
    // Check for JSON content or multiple code blocks
    const hasJsonContent = content.includes('```json');
    const codeBlockCount = (content.match(/```/g) || []).length;
    const hasMultipleCodeBlocks = codeBlockCount >= 4; // At least 2 blocks (each having opening and closing ```)
    
    // Check for file structure indicators
    const fileStructureIndicators = [
      'src/', 'components/', 'pages/', 'public/', 'package.json',
      'index.js', 'index.jsx', 'index.ts', 'index.tsx',
      'app.js', 'app.jsx', 'app.ts', 'app.tsx'
    ];
    const hasFileStructure = fileStructureIndicators.some(indicator => 
      content.toLowerCase().includes(indicator.toLowerCase())
    );
    
    // If the message contains "I've generated" or "Here's what I created" type phrases
    const generationPhrases = [
      "i've generated", "i've created", "i've built", "i've developed",
      "i have generated", "i have created", "i have built", "i have developed",
      "here's what i created", "here's what i built", "here's what i generated",
      "here is what i created", "here is what i built", "here is what i generated"
    ];
    
    const hasGenerationPhrase = generationPhrases.some(phrase => 
      content.toLowerCase().includes(phrase)
    );
    
    // Look for files array structure
    const hasFilesStructure = content.includes('"files"') && content.includes('"path"') && content.includes('"content"');
    
    // Be VERY lenient - if ANY of these conditions are met, treat it as app generation
    return hasStrongIndicator || hasJsonContent || hasMultipleCodeBlocks || 
           hasFileStructure || hasGenerationPhrase || hasFilesStructure;
  }, [content, message]);
  
  if (message && isAppGeneration) {
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
