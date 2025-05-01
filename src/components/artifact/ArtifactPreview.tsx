
import React, { useState, useEffect } from 'react';
import { 
  SandpackProvider, 
  SandpackLayout, 
  SandpackPreview, 
  SandpackConsole,
  SandpackFiles,
  SandpackStack,
  SandpackCodeEditor,
  useSandpack
} from '@codesandbox/sandpack-react';
import { nightOwl } from '@codesandbox/sandpack-themes';
import { Loader2, TerminalSquare, FileCode, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

// This component auto-refreshes the preview when code changes
const AutoRefreshPreview = () => {
  const { sandpack } = useSandpack();
  
  useEffect(() => {
    // Listen for file changes and auto-refresh
    const unsubscribe = sandpack.listen((msg) => {
      if (msg.type === "file" && msg.event === "update") {
        // Small delay before refresh to allow bundling
        setTimeout(() => {
          sandpack.runSandpack();
          console.log("Preview auto-refreshed due to file update");
        }, 300);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [sandpack]);
  
  return null; // This is a utility component with no UI
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
  const [activeTab, setActiveTab] = useState<"preview" | "console" | "editor">("preview");
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [template, setTemplate] = useState<"vanilla" | "react" | "react-ts">("react");
  
  // Transform files to Sandpack format
  const sandpackFiles: SandpackFiles = React.useMemo(() => {
    console.log("Processing files for preview:", files.length);
    const result: SandpackFiles = {};
    
    // Try to detect proper template based on files
    const hasReactFiles = files.some(f => 
      f.path.endsWith('.jsx') || 
      f.path.endsWith('.tsx') || 
      f.content.includes('import React') || 
      f.content.includes('from "react"')
    );
    
    const hasTypeScript = files.some(f => 
      f.path.endsWith('.ts') || 
      f.path.endsWith('.tsx')
    );
    
    // Set appropriate template
    if (hasReactFiles) {
      if (hasTypeScript) {
        setTemplate("react-ts");
      } else {
        setTemplate("react");
      }
    } else {
      setTemplate("vanilla");
    }
    
    // Process all files
    files.forEach(file => {
      // Skip any path with node_modules
      if (file.path.includes("node_modules")) return;
      
      // Ensure the path starts with /
      const path = file.path.startsWith("/") ? file.path : `/${file.path}`;
      
      // Store the file content
      result[path] = {
        code: file.content,
        active: true // Make file active in editor
      };
    });
    
    // Create essential files if they don't exist
    if (!Object.keys(result).some(path => path.endsWith('index.html'))) {
      result["/index.html"] = {
        code: `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React Preview</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./index.js"></script>
  </body>
</html>`,
      };
    }
    
    // Create a React entry point if template is react but no App or index files exist
    if (template.includes('react') && 
        !Object.keys(result).some(path => 
          path.endsWith('App.jsx') || 
          path.endsWith('App.tsx') || 
          path.endsWith('index.jsx') || 
          path.endsWith('index.tsx')
        )) {
      
      // Add index.js if it doesn't exist
      if (!Object.keys(result).some(path => path.endsWith('index.js'))) {
        result["/index.js"] = {
          code: `
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const root = createRoot(document.getElementById('root'));
root.render(<App />);
`,
        };
      }
      
      // Add App component if it doesn't exist
      if (!Object.keys(result).some(path => path.includes('App.'))) {
        const fileExt = template === "react-ts" ? "tsx" : "jsx";
        result[`/App.${fileExt}`] = {
          code: `
import React from 'react';

${template === "react-ts" ? "export default function App(): JSX.Element {" : "export default function App() {"}
  return (
    <div className="app-container">
      <h1>React Preview</h1>
      <p>This is a preview of your React application.</p>
      <p>Edit files in the editor to see changes reflected here in real-time!</p>
    </div>
  );
}
`,
        };
      }
    }
    
    console.log("Processed files for Sandpack:", Object.keys(result).length);
    console.log("Using template:", template);
    return result;
  }, [files]);
  
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
        template={template}
        files={sandpackFiles}
        options={{
          autorun: true,
          recompileDelay: 300,
          recompileMode: "immediate",
          externalResources: [
            "https://cdn.tailwindcss.com"
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
            "react": "^18.0.0",
            "react-dom": "^18.0.0"
          }
        }}
      >
        <AutoRefreshPreview />
        
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as "preview" | "console" | "editor")} 
          className="w-full h-full"
        >
          <div className="flex justify-between items-center border-b border-zinc-800 px-2">
            <TabsList className="bg-transparent border-b-0 p-0">
              <TabsTrigger value="preview" className="data-[state=active]:bg-zinc-800">
                <div className="flex items-center gap-2">
                  Preview
                </div>
              </TabsTrigger>
              <TabsTrigger value="editor" className="data-[state=active]:bg-zinc-800">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4" />
                  Editor
                </div>
              </TabsTrigger>
              <TabsTrigger value="console" className="data-[state=active]:bg-zinc-800">
                <div className="flex items-center gap-2">
                  <TerminalSquare className="h-4 w-4" />
                  Console
                </div>
              </TabsTrigger>
            </TabsList>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const { sandpack } = useSandpack();
                sandpack.runSandpack();
                toast({
                  title: "Preview refreshed",
                  description: "The preview has been manually refreshed.",
                  duration: 2000
                });
              }}
              className="text-gray-400 hover:text-white hover:bg-transparent"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          <TabsContent value="preview" className="border-none p-0 m-0 h-full">
            <SandpackLayout className="h-full w-full">
              <SandpackStack className="h-full w-full">
                <SandpackPreview 
                  showRefreshButton={true}
                  showRestartButton={true}
                  className="!h-full !w-full sp-preview-force"
                />
              </SandpackStack>
            </SandpackLayout>
          </TabsContent>
          
          <TabsContent value="editor" className="border-none p-0 m-0 h-full">
            <SandpackLayout className="h-full w-full">
              <SandpackStack className="h-full w-full">
                <SandpackCodeEditor
                  showLineNumbers={true}
                  showInlineErrors={true}
                  wrapContent={true}
                  className="h-full"
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
