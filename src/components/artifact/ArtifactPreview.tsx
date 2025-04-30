
import React, { useState, useEffect } from 'react';
import { 
  SandpackProvider, 
  SandpackLayout, 
  SandpackPreview, 
  SandpackConsole,
  SandpackFiles
} from '@codesandbox/sandpack-react';
import { nightOwl } from '@codesandbox/sandpack-themes';
import { Loader2, TerminalSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    
    // Always create an index.html file for better visibility
    result["/index.html"] = {
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
    <div id="root"></div>
    <div id="app"></div>
  </body>
</html>
      `,
      hidden: false
    };
    
    // Always create an index.js file that will display files content
    result["/index.js"] = {
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
});
      `,
      hidden: false
    };
    
    // Add all user's files
    files.forEach(file => {
      // Skip any path with node_modules
      if (file.path.includes("node_modules")) return;
      
      // Ensure the path starts with /
      const path = file.path.startsWith("/") ? file.path : `/${file.path}`;
      
      // Store the file content
      result[path] = {
        code: file.content
      };
    });
    
    console.log("Processed files for Sandpack:", Object.keys(result).length);
    return result;
  }, [files]);

  // Define the exact type for the template
  const template = "vanilla" as const;
  
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

  // Add debugging logs for iframe visibility
  useEffect(() => {
    if (!isLoading && activeTab === "preview") {
      const checkIframe = setInterval(() => {
        const iframe = document.querySelector('.sp-preview-iframe') as HTMLIFrameElement;
        if (iframe) {
          console.log("Found preview iframe, ensuring visibility");
          iframe.style.display = 'block';
          iframe.style.visibility = 'visible';
          iframe.style.opacity = '1';
          iframe.style.height = '100%';
          iframe.style.width = '100%';
          clearInterval(checkIframe);
        }
      }, 500);

      return () => clearInterval(checkIframe);
    }
  }, [isLoading, activeTab]);

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
          autorun: true,
          showNavigator: true,
          showLineNumbers: true,
          showInlineErrors: true,
          externalResources: [
            "https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css"
          ],
          classes: {
            "sp-wrapper": "h-full !bg-zinc-900",
            "sp-stack": "h-full",
            "sp-preview-container": "h-full !bg-white",
            "sp-preview-iframe": "h-full !bg-white"
          }
        }}
        customSetup={{
          entry: "/index.js"
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
            <SandpackLayout className="h-full w-full">
              <SandpackPreview 
                showOpenInCodeSandbox={true}
                showRefreshButton={true}
              />
            </SandpackLayout>
          </TabsContent>
          
          <TabsContent value="console" className="border-none p-0 m-0 h-full">
            <SandpackLayout className="h-full">
              <SandpackConsole className="h-full" />
            </SandpackLayout>
          </TabsContent>
        </Tabs>
      </SandpackProvider>
    </div>
  );
};
