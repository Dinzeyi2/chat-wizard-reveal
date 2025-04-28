
import React from "react";
import { Message } from "@/types/chat";
import AppGeneratorDisplay from "./AppGeneratorDisplay";

interface MarkdownRendererProps {
  content: string;
  message?: Message;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, message }) => {
  // Check if this is an app generation message with more comprehensive detection
  const isAppGeneration = (content.includes("```json") || content.includes("projectName")) && 
    (content.includes("projectName") || content.includes("files"));

  if (message && isAppGeneration) {
    return <AppGeneratorDisplay message={message} />;
  }

  // Process normal markdown with better formatting
  const formattedContent = content
    .split('```')
    .map((block, index) => {
      if (index % 2 === 0) {
        // Text outside code blocks - wrap paragraphs
        return block.split('\n\n').map((para, i) => 
          <p key={i} className="mb-4">{para}</p>
        );
      } else {
        // Code blocks - add syntax highlighting class
        const firstLine = block.split('\n')[0];
        const language = firstLine || 'plaintext';
        const codeContent = firstLine ? block.substring(firstLine.length + 1) : block;
        
        return (
          <pre key={index} className="bg-gray-100 dark:bg-gray-800 p-3 rounded my-2 overflow-x-auto">
            <code className={`language-${language.trim()}`}>{codeContent}</code>
          </pre>
        );
      }
    });

  return <div className="whitespace-pre-wrap">{formattedContent}</div>;
};

export default MarkdownRenderer;
