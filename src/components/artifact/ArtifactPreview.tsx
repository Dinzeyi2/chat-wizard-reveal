
import React from 'react';
import { 
  Sandpack,
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackConsole
} from '@codesandbox/sandpack-react';
import { nightOwl } from '@codesandbox/sandpack-themes';
import '@codesandbox/sandpack-react/dist/index.css';

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
  // Convert files array to Sandpack format
  const sandpackFiles = files.reduce((acc, file) => {
    const path = file.path.startsWith('/') ? file.path : `/${file.path}`;
    acc[path] = { code: file.content };
    return acc;
  }, {} as Record<string, { code: string }>);

  // If there are no files, show a placeholder
  if (!files || files.length === 0) {
    return (
      <div className="artifact-preview-container h-full flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <h3 className="font-medium text-lg text-gray-200 mb-2">No Files Available</h3>
          <p className="text-gray-400">
            Generate code to see a preview here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="artifact-preview-container h-full">
      <SandpackProvider 
        theme={nightOwl}
        template="react"
        files={sandpackFiles}
        customSetup={{
          dependencies: {
            "react": "latest",
            "react-dom": "latest"
          }
        }}
      >
        <SandpackLayout>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: '1' }}>
            <SandpackCodeEditor showLineNumbers={true} showInlineErrors={true} />
            <SandpackConsole />
          </div>
          <SandpackPreview />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
};
