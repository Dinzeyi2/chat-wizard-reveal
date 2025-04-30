
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface ArtifactPreviewProps {
  files: Array<{
    id: string;
    name: string;
    path: string;
    language: string;
    content: string;
  }>;
}

export const ArtifactPreview: React.FC<ArtifactPreviewProps> = ({ files }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Find HTML file if it exists
  const htmlFile = files.find(file => file.path.endsWith('.html'));
  const cssFiles = files.filter(file => file.path.endsWith('.css'));
  
  // Combine HTML and CSS content if available
  const previewContent = React.useMemo(() => {
    if (htmlFile) {
      let content = htmlFile.content;
      
      // Inject CSS content into HTML
      if (cssFiles.length > 0) {
        const styleTag = `<style>\n${cssFiles.map(file => file.content).join('\n')}\n</style>`;
        content = content.replace('</head>', `${styleTag}\n</head>`);
      }
      
      return content;
    }
    return null;
  }, [htmlFile, cssFiles]);

  return (
    <div className="artifact-preview-container h-full flex flex-col">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-8 h-full">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <div className="text-center">
            <p className="font-medium text-gray-200">Loading preview...</p>
            <p className="text-sm text-gray-400 mt-1">This may take a few moments</p>
          </div>
        </div>
      ) : (
        <>
          {previewContent ? (
            <iframe 
              srcDoc={previewContent}
              className="w-full h-full border-none flex-1"
              title="Code Preview"
              sandbox="allow-scripts allow-modals allow-forms"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 h-full">
              <div className="text-center">
                <p className="font-medium text-gray-200">No HTML file found for preview</p>
                <p className="text-sm text-gray-400 mt-1">Add an HTML file to see a preview</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
