
import React from "react";

interface MarkdownRendererProps {
  content: string;
}

// A simple markdown renderer implementation
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // For now, we'll just render plain text
  // In a real implementation, you would use a library like react-markdown
  return <div className="whitespace-pre-wrap">{content}</div>;
};

export default MarkdownRenderer;
