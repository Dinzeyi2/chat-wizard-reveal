
import React, { useEffect, useState } from 'react';
import { 
  Sandpack, 
  SandpackProvider, 
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackConsole
} from '@codesandbox/sandpack-react';
import '@codesandbox/sandpack-react/dist/index.css';
import { nightOwlTheme } from '@codesandbox/sandpack-themes';

interface ArtifactFile {
  id: string;
  name: string;
  path: string;
  language: string;
  content: string;
}

interface ArtifactPreviewProps {
  files: ArtifactFile[];
}

export const ArtifactPreview: React.FC<ArtifactPreviewProps> = ({ files }) => {
  const [sandpackFiles, setSandpackFiles] = useState<Record<string, { code: string, active?: boolean }>>({});
  const [dependencies, setDependencies] = useState<Record<string, string>>({
    "react": "latest",
    "react-dom": "latest"
  });
  
  useEffect(() => {
    if (files && files.length > 0) {
      // Convert the files array to the format expected by Sandpack
      const formattedFiles: Record<string, { code: string, active?: boolean }> = {};
      
      files.forEach((file, index) => {
        const filePath = file.path.startsWith('/') ? file.path : `/${file.path}`;
        formattedFiles[filePath] = {
          code: file.content,
          active: index === 0 // Set the first file as active
        };
      });
      
      // Ensure there's at least an App.js file if none exists
      if (!Object.keys(formattedFiles).some(path => path.endsWith('App.js') || path.endsWith('App.tsx'))) {
        formattedFiles['/App.js'] = {
          code: "export default function App() {\n  return <h1>Preview App</h1>;\n}",
          active: Object.keys(formattedFiles).length === 0
        };
      }
      
      setSandpackFiles(formattedFiles);
      
      // Extract dependencies from the code files
      const detectedDeps = detectDependencies(files);
      
      setDependencies(prev => ({
        ...prev,
        ...detectedDeps
      }));
    }
  }, [files]);
  
  // Simple function to detect dependencies from imports in code
  const detectDependencies = (files: ArtifactFile[]): Record<string, string> => {
    const deps: Record<string, string> = {};
    const importRegex = /import\s+.*\s+from\s+['"]([^./][^'"]*)['"]/g;
    
    files.forEach(file => {
      let match;
      while ((match = importRegex.exec(file.content)) !== null) {
        const packageName = match[1].split('/')[0];
        if (packageName && !packageName.startsWith('.')) {
          deps[packageName] = 'latest';
        }
      }
    });
    
    return deps;
  };
  
  if (!files || files.length === 0) {
    return (
      <div className="artifact-preview-container h-full flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <h3 className="font-medium text-lg text-gray-200 mb-2">No Files to Preview</h3>
          <p className="text-gray-400">
            There are no files available to preview.
          </p>
        </div>
      </div>
    );
  }
  
  // If we have files but sandpackFiles is empty, show loading
  if (Object.keys(sandpackFiles).length === 0) {
    return (
      <div className="artifact-preview-container h-full flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <h3 className="font-medium text-lg text-gray-200 mb-2">Preparing Preview</h3>
          <p className="text-gray-400">
            Setting up the code preview environment...
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="artifact-preview-container h-full">
      <SandpackProvider
        theme={nightOwlTheme}
        template="react"
        files={sandpackFiles}
        customSetup={{
          dependencies: dependencies
        }}
      >
        <SandpackLayout>
          <SandpackCodeEditor showLineNumbers showInlineErrors />
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <SandpackPreview showNavigator />
            <SandpackConsole />
          </div>
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
};
