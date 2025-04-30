
import React, { useState, useEffect } from 'react';
import { 
  SandpackProvider, 
  SandpackLayout, 
  SandpackPreview, 
  SandpackCodeEditor,
  SandpackConsole,
  useSandpack,
  SandpackFiles,
  SandpackStack
} from '@codesandbox/sandpack-react';
import { nightOwl } from '@codesandbox/sandpack-themes';
import { Loader2, TerminalSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

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
  
  // Transform files to Sandpack format
  const sandpackFiles: SandpackFiles = React.useMemo(() => {
    console.log("Processing files for preview:", files.length);
    const result: SandpackFiles = {};
    
    // First identify if we have an index.html
    let hasIndexHtml = files.some(file => file.path === "index.html");
    
    // If no index.html, we'll need to create one
    if (!hasIndexHtml) {
      result["/index.html"] = {
        code: `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Code Preview</title>
  </head>
  <body>
    <div id="root"></div>
    <div id="app"></div>
  </body>
</html>`,
        hidden: true
      };
    }
    
    // Check if we need to create a basic index.js
    let hasIndexJs = files.some(file => 
      file.path === "index.js" || 
      file.path === "/index.js" ||
      file.path === "src/index.js" || 
      file.path === "/src/index.js"
    );
    
    // If there's no index.js but there are other files, create a simple one
    if (!hasIndexJs && files.length > 0) {
      // Simple index.js that doesn't rely on specific element IDs
      result["/index.js"] = {
        code: `
// This is a basic entry point for the preview
console.log("Preview initialized");

document.addEventListener("DOMContentLoaded", function() {
  // Create content if it doesn't exist
  const content = document.createElement("div");
  content.innerHTML = "<h1>Preview Content</h1><p>Your code is being previewed here.</p>";
  document.body.appendChild(content);
});
`,
        hidden: true
      };
    }
    
    // Process all files
    files.forEach(file => {
      // Skip any path with node_modules
      if (file.path.includes("node_modules")) return;
      
      // Ensure the path starts with /
      const path = file.path.startsWith("/") ? file.path : `/${file.path}`;
      
      result[path] = {
        code: file.content,
        // Fix the type issue by using a type guard
        active: file.path.endsWith(".html") // Make HTML files active by default
      };
    });
    
    // If no files were made active, make the first one active
    const hasActive = Object.values(result).some(file => 
      // Use a type guard to check if 'active' exists
      typeof file === 'object' && file !== null && 'active' in file && file.active === true
    );
    
    if (!hasActive && Object.keys(result).length > 0) {
      const firstKey = Object.keys(result)[0];
      if (result[firstKey] && typeof result[firstKey] === 'object') {
        (result[firstKey] as { active?: boolean }).active = true;
      }
    }
    
    console.log("Processed files for Sandpack:", Object.keys(result).length);
    return result;
  }, [files]);

  // Determine template based on files
  const template = React.useMemo(() => {
    // Check for package.json to determine if it's a React project
    const isReact = files.some(file => 
      file.path.includes("package.json") && 
      file.content.includes("react")
    );
    
    // Check for Vue files
    const isVue = files.some(file => file.path.endsWith(".vue"));
    
    // Check if it's just HTML/CSS/JS
    const hasHTML = files.some(file => file.path.endsWith(".html"));
    
    if (isReact) {
      console.log("Detected React project");
      return "react";
    }
    if (isVue) {
      console.log("Detected Vue project");
      return "vue";
    }
    if (hasHTML) {
      console.log("Detected HTML project");
      return "vanilla";
    }
    
    // Default to vanilla
    console.log("Using default vanilla template");
    return "vanilla";
  }, [files]);
  
  useEffect(() => {
    // Simulate loading to ensure everything renders properly
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
          recompileMode: "immediate",
          recompileDelay: 300,
        }}
      >
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
            <SandpackLayout className="h-full">
              <SandpackStack className="h-full">
                <SandpackPreview 
                  showOpenInCodeSandbox={false}
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
