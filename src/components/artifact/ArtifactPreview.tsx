
import React from 'react';

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
  return (
    <div className="artifact-preview-container h-full flex flex-col items-center justify-center p-8">
      <div className="text-center">
        <h3 className="font-medium text-lg text-gray-200 mb-2">Preview Disabled</h3>
        <p className="text-gray-400">
          The WebContainer preview feature has been disabled.
        </p>
        {files && files.length > 0 && (
          <p className="text-gray-500 mt-4 text-sm">
            Files available: {files.length}
          </p>
        )}
      </div>
    </div>
  );
};
