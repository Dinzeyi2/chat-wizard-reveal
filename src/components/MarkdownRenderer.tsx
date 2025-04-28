
import React from "react";

interface MarkdownRendererProps {
  content: string;
}

// A simple markdown renderer implementation
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Basic formatting for headers, lists, bold, and code blocks
  const formatMarkdown = (text: string) => {
    // Process code blocks first (```code```)
    let formatted = text.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-3 my-2 rounded overflow-x-auto"><code>$1</code></pre>');
    
    // Process inline code (`code`)
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>');
    
    // Process headers
    formatted = formatted.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold my-3">$1</h1>');
    formatted = formatted.replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold my-2">$1</h2>');
    formatted = formatted.replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold my-2">$1</h3>');
    
    // Process bold
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Process italics
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Process unordered lists
    formatted = formatted.replace(/^\s*[-*+]\s+(.*$)/gm, '<li class="ml-4">$1</li>');
    formatted = formatted.replace(/(<li.*?>.*?<\/li>)\s+(?=<li)/gs, '$1');
    formatted = formatted.replace(/(<li.*?>.*?<\/li>)+/g, '<ul class="list-disc my-2 ml-2">$&</ul>');
    
    // Process ordered lists
    formatted = formatted.replace(/^\s*(\d+)\.\s+(.*$)/gm, '<li class="ml-4">$2</li>');
    formatted = formatted.replace(/(<li.*?>.*?<\/li>)\s+(?=<li)/gs, '$1');
    formatted = formatted.replace(/(<li.*?>.*?<\/li>)+/g, '<ol class="list-decimal my-2 ml-2">$&</ol>');
    
    // Process paragraphs (excluding already processed elements)
    const lines = formatted.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (
        !lines[i].startsWith('<h') && 
        !lines[i].startsWith('<ul') && 
        !lines[i].startsWith('<ol') && 
        !lines[i].startsWith('<li') && 
        !lines[i].startsWith('<pre') &&
        lines[i].trim().length > 0
      ) {
        lines[i] = `<p class="my-2">${lines[i]}</p>`;
      }
    }
    formatted = lines.join('\n');
    
    return formatted;
  };

  return (
    <div 
      className="whitespace-pre-wrap markdown-content" 
      dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
    />
  );
};

export default MarkdownRenderer;
