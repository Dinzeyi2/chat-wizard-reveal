
import React, { useMemo } from 'react';
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackFileExplorer,
  SandpackConsole,
  SandpackFiles,
  SandpackPredefinedTemplate
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

// Helper function to detect likely template based on files
const detectTemplate = (files: ArtifactPreviewProps['files']): SandpackPredefinedTemplate => {
  // Check for common template indicators
  const hasPackageJson = files.some(file => file.path.endsWith('package.json'));
  const hasTsConfig = files.some(file => file.path.includes('tsconfig'));
  const hasReactImports = files.some(file => 
    file.content.includes('import React') || 
    file.content.includes('from "react"') || 
    file.content.includes("from 'react'")
  );
  const hasVueFiles = files.some(file => file.path.endsWith('.vue'));
  const hasAngularFiles = files.some(file => file.path.includes('angular'));
  
  // Determine template based on detected patterns
  if (hasVueFiles) return 'vue';
  if (hasAngularFiles) return 'angular';
  if (hasReactImports) {
    return hasTsConfig ? 'react-ts' : 'react';
  }
  return hasTsConfig ? 'vanilla-ts' : 'vanilla';
};

// Helper to convert files to Sandpack format
const convertToSandpackFiles = (files: ArtifactPreviewProps['files']): SandpackFiles => {
  const sandpackFiles: SandpackFiles = {};
  
  files.forEach(file => {
    // Ensure file has a proper path that starts with /
    const filePath = file.path.startsWith('/') ? file.path : `/${file.path}`;
    sandpackFiles[filePath] = {
      code: file.content,
      // Set the main file active by default
      active: filePath === '/App.js' || filePath === '/App.tsx' || filePath === '/src/App.js' || filePath === '/src/App.tsx' || filePath === '/index.js'
    };
  });
  
  return sandpackFiles;
};

// Helper to extract dependencies from package.json
const extractDependencies = (files: ArtifactPreviewProps['files']): Record<string, string> => {
  const packageJsonFile = files.find(file => file.path.endsWith('package.json'));
  
  if (packageJsonFile) {
    try {
      const packageJson = JSON.parse(packageJsonFile.content);
      return {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };
    } catch (e) {
      console.error('Failed to parse package.json:', e);
    }
  }
  
  // Default dependencies
  return {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  };
};

export const ArtifactPreview: React.FC<ArtifactPreviewProps> = ({ files }) => {
  // If there are no files, show a message
  if (!files || files.length === 0) {
    return (
      <div className="artifact-preview-container h-full flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <h3 className="font-medium text-lg text-gray-200 mb-2">No Files Available</h3>
          <p className="text-gray-400">
            There are no files to preview.
          </p>
        </div>
      </div>
    );
  }
  
  // Convert files to Sandpack format
  const sandpackFiles = useMemo(() => convertToSandpackFiles(files), [files]);
  
  // Detect likely template
  const template = useMemo(() => detectTemplate(files), [files]);
  
  // Extract dependencies from package.json
  const dependencies = useMemo(() => extractDependencies(files), [files]);

  return (
    <div className="artifact-preview-container h-full w-full">
      <SandpackProvider
        theme={nightOwl}
        template={template}
        files={sandpackFiles}
        customSetup={{
          dependencies: dependencies
        }}
      >
        <SandpackLayout>
          <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "30%" }}>
            <SandpackFileExplorer />
            <SandpackCodeEditor showLineNumbers closableTabs showTabs />
          </div>
          <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "70%" }}>
            <SandpackPreview showNavigator />
            <SandpackConsole />
          </div>
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
};
