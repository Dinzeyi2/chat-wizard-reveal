import React, { useState, useEffect, useRef } from 'react';
import { 
  SandpackProvider, 
  SandpackLayout, 
  SandpackPreview, 
  SandpackConsole,
  SandpackFiles,
  SandpackStack,
  useSandpack,
  useActiveCode,
  SandpackClient,
  ListenerType
} from '@codesandbox/sandpack-react';
import { nightOwl } from '@codesandbox/sandpack-themes';
import { Loader2, TerminalSquare, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

// Auto-refresh component that handles hot-reloading
const AutoRefreshPreview = () => {
  const { sandpack } = useSandpack();
  
  useEffect(() => {
    // Create a client to listen to events
    const sandpackClient = sandpack.clients[0];
    
    // Only proceed if the client exists
    if (!sandpackClient) return;
    
    // Register listener for Sandpack events
    const unsubscribe = sandpackClient.listen((message: any) => {
      if (message.type === 'done') {
        // Refresh complete - any additional actions can go here
        console.log('Hot reload complete');
      }
    });
    
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [sandpack]);
  
  return null;
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
  const [activeTab, setActiveTab] = useState<"preview" | "console">("preview");
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [appType, setAppType] = useState<"vanilla" | "react" | "react-ts" | "vite">("vanilla");
  
  // Auto-detect the application type based on files
  useEffect(() => {
    // Default to vanilla
    let detectedType: "vanilla" | "react" | "react-ts" | "vite" = "vanilla";
    
    // Check for package.json to detect app type
    const packageJson = files.find(file => file.path.includes('package.json'));
    const hasReactComponent = files.some(file => 
      (file.path.endsWith('.jsx') || file.path.endsWith('.tsx')) && 
      file.content.includes('import React') || file.content.includes('from "react"')
    );
    
    const hasViteConfig = files.some(file => 
      file.path.includes('vite.config') || 
      (packageJson && packageJson.content.includes('"vite"'))
    );
    
    const hasTypeScript = files.some(file => 
      file.path.endsWith('.ts') || file.path.endsWith('.tsx')
    );
    
    if (hasViteConfig) {
      detectedType = "vite";
      console.log("Detected Vite application");
    } else if (hasReactComponent) {
      detectedType = hasTypeScript ? "react-ts" : "react";
      console.log(`Detected React ${hasTypeScript ? 'TypeScript' : 'JavaScript'} application`);
    }
    
    setAppType(detectedType);
  }, [files]);
  
  // Transform files to Sandpack format
  const sandpackFiles: SandpackFiles = React.useMemo(() => {
    console.log(`Processing files for preview: ${files.length}, app type: ${appType}`);
    const result: SandpackFiles = {};
    
    // Add all user's files
    files.forEach(file => {
      // Skip any path with node_modules
      if (file.path.includes("node_modules")) return;
      
      // Ensure the path starts with /
      const path = file.path.startsWith("/") ? file.path : `/${file.path}`;
      
      // Store the file content
      result[path] = {
        code: file.content,
        active: file.path.endsWith('index.js') || file.path.endsWith('index.tsx') || file.path.endsWith('App.tsx')
      };
    });
    
    // If no index.html is provided and it's a React app, create one
    if (!result['/index.html'] && (appType === 'react' || appType === 'react-ts')) {
      result['/index.html'] = {
        code: `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App Preview</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
      };
    }
    
    // If it's a vanilla app with no HTML, create a basic setup
    if (Object.keys(result).length === 0 || (!result['/index.html'] && appType === 'vanilla')) {
      // Create basic HTML file
      result['/index.html'] = {
        code: `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Code Preview</title>
    <style>
      body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        margin: 0;
        padding: 20px;
        background-color: #f5f5f5;
        color: #333;
      }
      h1 {
        color: #2d3748;
        margin-bottom: 10px;
      }
      p {
        margin-bottom: 20px;
      }
      .content {
        background-color: white;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        margin-bottom: 20px;
      }
      pre {
        background-color: #f0f0f0;
        padding: 10px;
        border-radius: 4px;
        overflow: auto;
      }
      .file-name {
        font-weight: bold;
        margin-bottom: 5px;
        color: #4a5568;
      }
    </style>
  </head>
  <body>
    <div id="app"></div>
    <script src="/index.js"></script>
  </body>
</html>`,
      };
      
      // Create a basic JavaScript file to display the files
      result['/index.js'] = {
        code: `
// This script generates the preview display
console.log("Preview initialized with files:", ${JSON.stringify(files.map(f => f.path))});

document.addEventListener("DOMContentLoaded", function() {
  const container = document.createElement("div");
  container.className = "content";
  document.body.appendChild(container);
  
  const header = document.createElement("h1");
  header.textContent = "Code Preview";
  container.appendChild(header);
  
  const description = document.createElement("p");
  description.textContent = "Files in this preview:";
  container.appendChild(description);
  
  // Display each file
  const filesList = ${JSON.stringify(files.map(f => ({ path: f.path, content: f.content.substring(0, 200) })))};
  
  filesList.forEach(file => {
    const fileContainer = document.createElement("div");
    fileContainer.className = "content";
    
    const fileName = document.createElement("div");
    fileName.className = "file-name";
    fileName.textContent = file.path;
    fileContainer.appendChild(fileName);
    
    const contentPreview = document.createElement("pre");
    contentPreview.textContent = file.content + (file.content.length > 200 ? "..." : "");
    fileContainer.appendChild(contentPreview);
    
    container.appendChild(fileContainer);
  });
  
  console.log("Preview content displayed");
});`,
      };
    }
    
    console.log("Processed files for Sandpack:", Object.keys(result).length);
    return result;
  }, [files, appType]);

  useEffect(() => {
    // Simulate loading for better UX
    console.log("ArtifactPreview mounted, loading preview...");
    const timer = setTimeout(() => {
      setIsLoading(false);
      console.log("Preview loading complete");
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Force resize on tab change to ensure preview renders properly
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
      console.log("Forced resize in ArtifactPreview for tab:", activeTab);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [activeTab]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <div className="text-center">
          <p className="font-medium text-gray-200">Loading preview...</p>
          <p className="text-sm text-gray-400 mt-1">Setting up the sandbox environment</p>
        </div>
      </div>
    );
  }

  // If no files, show message
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full">
        <div className="text-center">
          <p className="font-medium text-gray-200">No files to preview</p>
          <p className="text-sm text-gray-400 mt-1">Add files to see a preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="artifact-preview-container h-full flex flex-col">
      <SandpackProvider
        theme={nightOwl}
        template={appType}
        files={sandpackFiles}
        options={{
          recompileMode: "delayed",
          recompileDelay: 300,
          autorun: true,
          bundlerURL: "https://sandpack-bundler.pages.dev",
          externalResources: [
            "https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css"
          ],
          classes: {
            "sp-wrapper": "h-full !important",
            "sp-stack": "h-full !important",
            "sp-preview-container": "h-full !important bg-white !important",
            "sp-preview": "h-full !important",
            "sp-preview-iframe": "h-full !important bg-white !important"
          }
        }}
        customSetup={{
          dependencies: {
            ...(appType === "react" || appType === "react-ts" ? {
              "react": "^18.2.0",
              "react-dom": "^18.2.0",
              "@types/react": "^18.2.0",
              "@types/react-dom": "^18.2.0"
            } : {}),
            ...(appType === "vite" ? {
              "vite": "^4.0.0"
            } : {})
          },
          entry: appType === "vite" ? "/src/main.tsx" : "/index.js"
        }}
      >
        <AutoRefreshPreview />
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as "preview" | "console")} 
          className="w-full h-full"
        >
          <div className="flex justify-between items-center border-b border-zinc-800 px-2">
            <TabsList className="bg-transparent border-b-0 p-0">
              <TabsTrigger value="preview" className="data-[state=active]:bg-zinc-800">
                <div className="flex items-center gap-2">
                  Preview
                </div>
              </TabsTrigger>
              <TabsTrigger value="console" className="data-[state=active]:bg-zinc-800">
                <div className="flex items-center gap-2">
                  <TerminalSquare className="h-4 w-4" />
                  Console
                </div>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="preview" className="border-none p-0 m-0 h-full">
            <SandpackLayout className="h-full w-full">
              <SandpackStack className="h-full w-full">
                <SandpackPreview 
                  showNavigator={true}
                  showRefreshButton={true}
                  showOpenInCodeSandbox={false}
                  showRestartButton={true}
                  className="!h-full !w-full sp-preview-force"
                  actionsChildren={
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-400 hover:text-white hover:bg-transparent"
                      onClick={() => window.dispatchEvent(new Event('resize'))}
                    >
                      Refresh
                    </Button>
                  }
                />
              </SandpackStack>
            </SandpackLayout>
          </TabsContent>
          
          <TabsContent value="console" className="border-none p-0 m-0 h-full">
            <SandpackLayout className="h-full">
              <SandpackStack className="h-full">
                <SandpackConsole className="h-full" />
              </SandpackStack>
            </SandpackLayout>
          </TabsContent>
        </Tabs>
      </SandpackProvider>
    </div>
  );
};
