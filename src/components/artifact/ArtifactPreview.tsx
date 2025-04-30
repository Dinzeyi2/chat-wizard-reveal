
import React from 'react';
import {
  Sandpack,
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackConsole,
  SandpackFileExplorer
} from '@codesandbox/sandpack-react';
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
  // Convert the files array to the format expected by Sandpack
  const formatFilesForSandpack = () => {
    if (!files || files.length === 0) return {};
    
    const sandpackFiles: Record<string, { code: string }> = {};
    
    files.forEach(file => {
      // Use the file path as the key (e.g., "/src/App.js")
      const filePath = file.path.startsWith('/') ? file.path : `/${file.path}`;
      sandpackFiles[filePath] = { code: file.content };
      
      // Set the main file as the active one (we'll use the first one in the array)
      if (Object.keys(sandpackFiles).length === 1) {
        sandpackFiles[filePath].active = true;
      }
    });
    
    // Make sure we have an index.js or App.js as entry point
    if (!Object.keys(sandpackFiles).some(path => 
        path.includes('index.js') || path.includes('App.js') || 
        path.includes('index.ts') || path.includes('App.tsx'))) {
      sandpackFiles['/src/App.js'] = { 
        code: 'export default function App() {\n  return <div>Hello World</div>;\n}',
        active: true
      };
    }
    
    return sandpackFiles;
  };

  // Determine if we have a valid set of files to display
  const sandpackFiles = formatFilesForSandpack();
  const hasValidFiles = Object.keys(sandpackFiles).length > 0;

  if (!hasValidFiles) {
    return (
      <div className="artifact-preview-container h-full flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <h3 className="font-medium text-lg text-gray-200 mb-2">No Files to Preview</h3>
          <p className="text-gray-400">
            Generate code first to see a live preview.
          </p>
          {files && files.length > 0 && (
            <p className="text-gray-500 mt-4 text-sm">
              Files available: {files.length}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="artifact-preview-container h-full w-full overflow-hidden">
      <SandpackProvider
        template="react"
        files={sandpackFiles}
        theme="dark"
        options={{
          autorun: true,
          showNavigator: true,
          showLineNumbers: true,
          showInlineErrors: true,
        }}
      >
        <SandpackLayout className="h-full">
          <div style={{ display: 'flex', flexDirection: 'column', width: '40%', height: '100%' }}>
            <SandpackFileExplorer />
            <SandpackCodeEditor showLineNumbers style={{ flex: 1 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', width: '60%', height: '100%' }}>
            <SandpackPreview style={{ flex: 1 }} />
            <SandpackConsole style={{ height: '30%' }} />
          </div>
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
};
