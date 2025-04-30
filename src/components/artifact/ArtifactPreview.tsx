
import React, { useState, useEffect } from 'react';
import { 
  SandpackProvider, 
  SandpackLayout, 
  SandpackCodeEditor, 
  SandpackPreview,
  SandpackConsole,
  SandpackFileExplorer,
  useSandpack,
  SandpackFiles,
  SandpackPredefinedTemplate
} from '@codesandbox/sandpack-react';
import { nightOwl } from '@codesandbox/sandpack-themes';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Custom hook to track when files are ready
const useSandpackFilesReady = (initialFiles: SandpackFiles) => {
  const { sandpack } = useSandpack();
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    if (Object.keys(initialFiles).length > 0) {
      // Short timeout to allow Sandpack to process files
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [initialFiles, sandpack]);
  
  return isReady;
};

// Component to render inside the SandpackProvider
const SandpackContent = ({ isLoading }: { isLoading: boolean }) => {
  const isReady = useSandpackFilesReady({});
  const [activeTab, setActiveTab] = useState<string>("preview");
  
  if (isLoading || !isReady) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="font-medium text-gray-200">Loading Sandpack environment...</p>
        <p className="text-sm text-gray-400 mt-1">This may take a few moments</p>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mx-2 mt-2">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="console">Console</TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview" className="flex-grow h-full m-0 p-0">
          <SandpackPreview showNavigator showRefreshButton />
        </TabsContent>
        
        <TabsContent value="code" className="flex-grow h-full m-0 p-0 flex">
          <div className="w-1/4 h-full border-r border-zinc-800">
            <SandpackFileExplorer />
          </div>
          <div className="w-3/4 h-full">
            <SandpackCodeEditor showTabs showLineNumbers closableTabs />
          </div>
        </TabsContent>
        
        <TabsContent value="console" className="flex-grow h-full m-0 p-0">
          <SandpackConsole />
        </TabsContent>
      </Tabs>
    </div>
  );
};

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
  const [isLoading, setIsLoading] = useState(true);
  const [sandpackFiles, setSandpackFiles] = useState<SandpackFiles>({});
  const [template, setTemplate] = useState<SandpackPredefinedTemplate>("react");
  
  // Process files into Sandpack format
  useEffect(() => {
    if (!files || files.length === 0) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    // Convert files to Sandpack format
    const processedFiles: SandpackFiles = {};
    let hasIndexHtml = false;
    let hasMainJsx = false;
    let hasPackageJson = false;
    
    files.forEach(file => {
      const filePath = file.path;
      processedFiles[filePath] = {
        code: file.content,
        active: false  // We'll set the active file later
      };
      
      if (filePath === 'index.html') hasIndexHtml = true;
      if (filePath === 'src/main.jsx' || filePath === 'src/index.jsx') hasMainJsx = true;
      if (filePath === 'package.json') hasPackageJson = true;
    });
    
    // Add necessary default files if missing
    if (!hasIndexHtml) {
      processedFiles['index.html'] = {
        code: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sandpack App</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`,
      };
    }
    
    if (!hasMainJsx) {
      processedFiles['src/index.jsx'] = {
        code: `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
      };
    }
    
    if (!hasPackageJson) {
      processedFiles['package.json'] = {
        code: JSON.stringify({
          name: "sandpack-project",
          private: true,
          dependencies: {
            "react": "^18.2.0",
            "react-dom": "^18.2.0"
          },
          devDependencies: {
            "vite": "^4.3.9"
          }
        }, null, 2),
      };
    }
    
    // Set first file as active
    const firstFilePath = Object.keys(processedFiles)[0];
    if (firstFilePath) {
      processedFiles[firstFilePath].active = true;
    }
    
    // Auto-detect template based on files
    let detectedTemplate: SandpackPredefinedTemplate = "react";
    
    // Check for Vue, Angular or other frameworks
    if (files.some(file => file.path.endsWith('.vue'))) {
      detectedTemplate = "vue";
    } else if (files.some(file => file.path.endsWith('.svelte'))) {
      detectedTemplate = "svelte";
    }
    
    setTemplate(detectedTemplate);
    setSandpackFiles(processedFiles);
    setIsLoading(false);
  }, [files]);
  
  return (
    <div className="artifact-preview-container h-full">
      <SandpackProvider
        theme={nightOwl}
        template={template}
        files={sandpackFiles}
        options={{
          autorun: true,
          recompileMode: "immediate",
          recompileDelay: 500,
          bundlerURL: "https://sandpack-bundler.vercel.app"
        }}
      >
        <SandpackLayout className="h-full border-none">
          <SandpackContent isLoading={isLoading} />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
};
