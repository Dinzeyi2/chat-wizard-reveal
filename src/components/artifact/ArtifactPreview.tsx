
import React, { useState, useEffect, useRef } from 'react';
import { 
  SandpackProvider, 
  SandpackLayout, 
  SandpackPreview, 
  SandpackConsole,
  SandpackFiles,
  SandpackStack,
  useSandpack,
  useActiveCode
} from '@codesandbox/sandpack-react';
import { nightOwl } from '@codesandbox/sandpack-themes';
import { Loader2, TerminalSquare, AlertCircle, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";

// Auto-refresh component that handles hot-reloading
const AutoRefreshPreview = () => {
  const { sandpack } = useSandpack();
  const [refreshStatus, setRefreshStatus] = useState<string | null>(null);
  
  useEffect(() => {
    // Get the first client from the clients array
    const client = sandpack.clients[0];
    
    // Only proceed if client exists
    if (!client) {
      console.warn("AutoRefreshPreview: No Sandpack client available");
      return;
    }
    
    console.log("AutoRefreshPreview: Registering listener for hot reload");
    
    // Register listener for Sandpack events using the client object
    const unsubscribe = client.listen((msg) => {
      if (msg.type === 'start') {
        setRefreshStatus('compiling');
        console.log('Hot reload started: Compiling code');
      } else if (msg.type === 'done') {
        setRefreshStatus('complete');
        console.log('Hot reload complete: Preview updated');
        
        // Reset status after a delay
        setTimeout(() => setRefreshStatus(null), 2000);
      } else if (msg.type === 'status') {
        // Check for error in status type messages
        if (msg.status && msg.status === 'error') {
          setRefreshStatus('error');
          console.error('Hot reload error:', msg);
          
          // Display error toast for better user feedback
          toast({
            variant: "destructive",
            title: "Preview Error",
            description: "Error rendering code preview. Check console for details."
          });
        }
      } else if (msg.type === 'error') {
        // Also check for direct error messages
        setRefreshStatus('error');
        console.error('Hot reload error (direct):', msg);
        
        toast({
          variant: "destructive",
          title: "Preview Error",
          description: "Error rendering code preview. Check console for details."
        });
      }
    });
    
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
        console.log("AutoRefreshPreview: Unregistered hot reload listener");
      }
    };
  }, [sandpack]);
  
  if (!refreshStatus) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Alert variant="default" className="bg-zinc-800 border-green-600 text-white py-2 px-3 shadow-lg">
        <div className="flex items-center space-x-2">
          {refreshStatus === 'compiling' && (
            <RefreshCw className="h-4 w-4 animate-spin text-yellow-400" />
          )}
          <AlertDescription className="text-xs">
            {refreshStatus === 'compiling' && "Updating preview..."}
            {refreshStatus === 'complete' && "Preview updated successfully!"}
            {refreshStatus === 'error' && "Error updating preview"}
          </AlertDescription>
        </div>
      </Alert>
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

/**
 * Formats file paths to be compatible with Sandpack
 * Ensures all paths start with a / but don't have double slashes
 */
const normalizePath = (path: string): string => {
  // Remove any leading/trailing whitespace
  let normalized = path.trim();
  
  // Ensure path starts with a single /
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }
  
  // Remove any double slashes
  while (normalized.includes('//')) {
    normalized = normalized.replace('//', '/');
  }
  
  return normalized;
};

/**
 * Detects the language/type of a file based on its extension and content
 */
const detectFileType = (file: { path: string, content: string }): {
  extension: string,
  isHtml: boolean,
  isJs: boolean,
  isTs: boolean,
  isReact: boolean,
  isJson: boolean,
  isStyle: boolean
} => {
  const path = file.path.toLowerCase();
  const content = file.content || '';
  
  const extension = path.split('.').pop() || '';
  const isHtml = extension === 'html' || extension === 'htm';
  const isJs = extension === 'js' || extension === 'jsx' || extension === 'mjs';
  const isTs = extension === 'ts' || extension === 'tsx';
  const isReact = extension === 'jsx' || extension === 'tsx' || 
                  content.includes('import React') || 
                  content.includes('from "react"') ||
                  content.includes('from \'react\'');
  const isJson = extension === 'json';
  const isStyle = ['css', 'scss', 'less'].includes(extension);
  
  return { extension, isHtml, isJs, isTs, isReact, isJson, isStyle };
};

/**
 * Determines the primary entry file for the application
 */
const detectEntryPoint = (files: ArtifactPreviewProps['files']): string | null => {
  // Priority order for entry points
  const entryPointCandidates = [
    // Vite entry points
    '/src/main.tsx',
    '/src/main.jsx',
    '/src/main.ts',
    '/src/main.js',
    
    // React entry points
    '/src/index.tsx',
    '/src/index.jsx',
    '/src/index.ts',
    '/src/index.js',
    '/index.tsx',
    '/index.jsx', 
    '/index.ts',
    '/index.js',
    
    // HTML entry points
    '/index.html',
    '/public/index.html'
  ];
  
  // Look for entry points in priority order
  for (const candidate of entryPointCandidates) {
    if (files.some(file => normalizePath(file.path) === candidate)) {
      console.log(`Detected entry point: ${candidate}`);
      return candidate;
    }
  }
  
  // If no standard entry points found, look for App components
  const appCandidates = [
    '/src/App.tsx',
    '/src/App.jsx',
    '/App.tsx',
    '/App.jsx'
  ];
  
  for (const candidate of appCandidates) {
    if (files.some(file => normalizePath(file.path) === candidate)) {
      console.log(`Using App component as entry point: ${candidate}`);
      return candidate;
    }
  }
  
  // If no entry points found, fallback to first HTML, then first JS/TS file
  const htmlFile = files.find(file => detectFileType(file).isHtml);
  if (htmlFile) {
    console.log(`Using fallback HTML entry point: ${htmlFile.path}`);
    return normalizePath(htmlFile.path);
  }
  
  const scriptFile = files.find(file => detectFileType(file).isJs || detectFileType(file).isTs);
  if (scriptFile) {
    console.log(`Using fallback script entry point: ${scriptFile.path}`);
    return normalizePath(scriptFile.path);
  }
  
  console.warn("No entry point detected - preview may not render correctly");
  return null;
};

export const ArtifactPreview: React.FC<ArtifactPreviewProps> = ({ files }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"preview" | "console">("preview");
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [appType, setAppType] = useState<"vanilla" | "react" | "react-ts" | "vite">("vanilla");
  
  // Auto-detect the application type based on files
  useEffect(() => {
    try {
      // Default to vanilla
      let detectedType: "vanilla" | "react" | "react-ts" | "vite" = "vanilla";
      
      console.log(`Analyzing ${files.length} files to detect application type...`);
      
      // Check for package.json to detect app type
      const packageJson = files.find(file => file.path.includes('package.json'));
      const packageContent = packageJson ? packageJson.content : '';
      
      // Check for React files
      const reactComponents = files.filter(file => {
        const fileType = detectFileType(file);
        return fileType.isReact;
      });
      
      // Check for TypeScript files
      const tsFiles = files.filter(file => {
        const fileType = detectFileType(file);
        return fileType.isTs;
      });
      
      // Check for Vite configuration
      const hasViteConfig = files.some(file => 
        file.path.includes('vite.config') || 
        (packageContent && (
          packageContent.includes('"vite"') || 
          packageContent.includes("'vite'")
        ))
      );
      
      // Determine app type based on findings
      if (hasViteConfig) {
        detectedType = "vite";
        console.log("Detected Vite application");
      } else if (reactComponents.length > 0) {
        detectedType = tsFiles.length > 0 ? "react-ts" : "react";
        console.log(`Detected React ${tsFiles.length > 0 ? 'TypeScript' : 'JavaScript'} application`);
      } else if (tsFiles.length > 0) {
        detectedType = "react-ts"; // Fallback to react-ts for TypeScript files
        console.log("Detected TypeScript files, using react-ts template");
      } else {
        console.log("Using vanilla template as fallback");
      }
      
      setAppType(detectedType);
    } catch (error) {
      console.error("Error detecting app type:", error);
      setAppType("vanilla"); // Fallback to vanilla
    }
  }, [files]);
  
  // Transform files to Sandpack format
  const sandpackFiles: SandpackFiles = React.useMemo(() => {
    try {
      console.log(`Processing ${files.length} files for preview as ${appType} application`);
      const entryPoint = detectEntryPoint(files);
      console.log(`Entry point determined as: ${entryPoint || 'none'}`);
      
      const result: SandpackFiles = {};
      let hasHtml = false;
      let hasMainScript = false;
      
      // Add all user's files
      files.forEach(file => {
        try {
          // Skip any path with node_modules
          if (file.path.includes("node_modules")) {
            console.log(`Skipping node_modules file: ${file.path}`);
            return;
          }
          
          // Ensure the path is normalized
          const path = normalizePath(file.path);
          const fileType = detectFileType(file);
          
          // Track if we have HTML and main script files
          if (fileType.isHtml) hasHtml = true;
          if (path === entryPoint && (fileType.isJs || fileType.isTs)) hasMainScript = true;
          
          // Determine if this file should be active
          const shouldBeActive = path === entryPoint;
          
          // Store the file content
          result[path] = {
            code: file.content,
            active: shouldBeActive
          };
          
          console.log(`Added ${path} to Sandpack files${shouldBeActive ? ' (active)' : ''}`);
        } catch (error) {
          console.error(`Error processing file ${file.path}:`, error);
        }
      });
      
      // If no index.html is provided and it's a React app, create one
      if (!hasHtml && (appType === 'react' || appType === 'react-ts' || appType === 'vite')) {
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App Preview</title>
  </head>
  <body>
    <div id="root"></div>
    ${entryPoint && !hasMainScript ? `<script type="module" src="${entryPoint}"></script>` : ''}
  </body>
</html>`;
        
        result['/index.html'] = {
          code: htmlContent,
        };
        
        console.log("Created fallback index.html for React/Vite app");
        hasHtml = true;
      }
      
      // Comprehensive fix for the @shadcn/ui import error
      // Process ALL files with any shadcn import patterns
      console.log("Checking for shadcn/ui imports to fix...");
      for (const path in result) {
        const fileContent = result[path];
        // Type check - ensure fileContent is an object with code property
        if (typeof fileContent === 'object' && fileContent !== null) {
          if (typeof fileContent.code === 'string') {
            // Check for any shadcn imports
            const originalCode = fileContent.code;
            
            // Replace all shadcn import patterns
            let updatedCode = originalCode
              .replace(/@shadcn\/ui/g, '@/components/ui')
              .replace(/["']@\/shadcn\/ui["']/g, '"@/components/ui"')
              .replace(/from ["']@ui\/([^"']+)["']/g, 'from "@/components/ui/$1"')
              .replace(/from ["']shadcn\/ui["']/g, 'from "@/components/ui"');
            
            // Only update if changes were actually made
            if (updatedCode !== originalCode) {
              console.log(`Fixed shadcn import in ${path}`);
              result[path] = {
                ...fileContent,
                code: updatedCode
              };
            }
          }
        }
      }
      
      // Additional fallback - add a helper file to mock shadcn/ui imports if detected
      let needsShadcnHelper = false;
      
      for (const path in result) {
        const fileContent = result[path];
        if (typeof fileContent === 'object' && fileContent !== null && 
            typeof fileContent.code === 'string' && 
            (fileContent.code.includes('@shadcn/ui') || fileContent.code.includes('shadcn/ui'))) {
          needsShadcnHelper = true;
          break;
        }
      }
      
      if (needsShadcnHelper) {
        console.log("Adding shadcn helper module for compatibility");
        // Add a shadcn helper module
        result['/node_modules/@shadcn/ui/index.js'] = {
          code: `
// Shadcn helper module
export * from "@/components/ui";
          `
        };
      }
      
      // If it's a vanilla app with no HTML, create a basic setup
      if (Object.keys(result).length === 0 || (!hasHtml && appType === 'vanilla')) {
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
        
        console.log("Created vanilla fallback files for preview");
      }
      
      console.log(`Processed ${Object.keys(result).length} files for Sandpack preview`);
      return result;
    } catch (error) {
      console.error("Error transforming files for preview:", error);
      setPreviewError(`Error preparing files: ${error instanceof Error ? error.message : String(error)}`);
      
      // Return basic error display
      return {
        '/index.html': {
          code: `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Preview Error</title>
    <style>
      body { font-family: system-ui; padding: 2rem; color: #ff3333; background: #fff1f0; }
      .error-box { border: 1px solid #ff9999; padding: 1rem; border-radius: 4px; }
    </style>
  </head>
  <body>
    <div class="error-box">
      <h3>Error preparing preview</h3>
      <p>${error instanceof Error ? error.message : String(error)}</p>
      <p>Check the console for more details.</p>
    </div>
  </body>
</html>`
        }
      };
    }
  }, [files, appType]);

  // Get proper dependencies based on app type
  const getCustomSetup = React.useMemo(() => {
    const dependencies: Record<string, string> = {};
    
    // Add dependencies based on app type
    if (appType === "react" || appType === "react-ts") {
      dependencies["react"] = "^18.2.0";
      dependencies["react-dom"] = "^18.2.0";
    }
    
    if (appType === "react-ts") {
      dependencies["@types/react"] = "^18.2.0";
      dependencies["@types/react-dom"] = "^18.2.0";
    }
    
    if (appType === "vite") {
      dependencies["vite"] = "^4.0.0";
    }
    
    // Check if files include certain imports and add those dependencies
    const allContent = files.map(file => file.content).join('\n');
    
    if (allContent.includes('@tanstack/react-query')) {
      dependencies["@tanstack/react-query"] = "^5.0.0";
    }
    
    if (allContent.includes('lucide-react')) {
      dependencies["lucide-react"] = "^0.288.0";
    }
    
    if (allContent.includes('tailwind') || allContent.includes('className=')) {
      // Already included via external resources but good to note
    }
    
    console.log("Set up dependencies for preview:", dependencies);
    
    const entryPath = appType === "vite" ? "/src/main.tsx" : "/index.js";
    const customEntry = detectEntryPoint(files) || entryPath;
    
    return {
      dependencies,
      entry: customEntry
    };
  }, [files, appType]);

  // Handle loading state and error recovery
  useEffect(() => {
    // Simulate loading for better UX
    console.log("ArtifactPreview mounting, preparing preview environment...");
    
    const timer = setTimeout(() => {
      setIsLoading(false);
      console.log("Preview loading complete");
      
      // Reset any previous errors
      setPreviewError(null);
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      console.log("ArtifactPreview unmounting, cleaning up");
    };
  }, [files]);

  // Force resize on tab change to ensure preview renders properly
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
      console.log(`ArtifactPreview: Forced resize for tab: ${activeTab}`);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Force periodic resize to help with rendering issues
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'preview') {
        window.dispatchEvent(new Event('resize'));
      }
    }, 2000);
    
    return () => clearInterval(interval);
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

  // If preview error, show error message
  if (previewError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <div className="text-center">
          <p className="font-medium text-gray-200">Preview Error</p>
          <p className="text-sm text-gray-400 mt-1">{previewError}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4" 
            onClick={() => setPreviewError(null)}
          >
            Retry Preview
          </Button>
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
            "sp-wrapper": "h-full !bg-zinc-900 !important",
            "sp-stack": "h-full !important",
            "sp-preview-container": "h-full !bg-white !important",
            "sp-preview": "h-full !important",
            "sp-preview-iframe": "h-full !bg-white !important"
          }
        }}
        customSetup={getCustomSetup}
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
                      onClick={() => {
                        window.dispatchEvent(new Event('resize'));
                        console.log("Manual refresh triggered");
                      }}
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
