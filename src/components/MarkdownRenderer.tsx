
import React from "react";
import { Message } from "@/types/chat";
import AppGeneratorDisplay from "./AppGeneratorDisplay";

interface MarkdownRendererProps {
  content: string;
  message?: Message;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, message }) => {
  // Check if this is an app generation message
  const isAppGeneration = content.includes("```json") && 
    content.includes("projectName") && 
    content.includes("files");

  if (message && isAppGeneration) {
    return <AppGeneratorDisplay message={message} />;
  }

  // For now, we'll just render plain text
  return <div className="whitespace-pre-wrap">{content}</div>;
};

export default MarkdownRenderer;
