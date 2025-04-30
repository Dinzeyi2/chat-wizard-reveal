
import React, { useState, useEffect } from 'react';
import { 
  Sandpack, 
  SandpackProvider, 
  SandpackLayout, 
  SandpackPreview, 
  SandpackCodeEditor,
  useSandpack,
  SandpackConsole
} from '@codesandbox/sandpack-react';
import { nightOwl } from '@codesandbox/sandpack-themes';
import { sandpackManager } from '@/utils/SandpackManager';
import { Loader2, AlertTriangle, ExternalLink, RefreshCw, Monitor, Code, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

interface ArtifactPreviewProps {
  files: Array<{
    id: string;
    name: string;
    path: string;
    language: string;
    content: string;
  }>;
}

// Custom error boundary for Sandpack
const SandpackErrorBoundary: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Error in Sandpack:', event.error);
      setError(event.error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="sandpack-error-container p-6 flex flex-col items-center justify-center h-full">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Sandpack Error</h3>
        <p className="text-sm text-gray-600 mb-4 text-center">
          {error?.message || 'There was an error loading the code preview.'}
        </p>
        <Button 
          onClick={() => setHasError(false)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};

// Custom console for Sandpack
const ConsoleListener: React.FC = () => {
  const { listen } = useSandpack();

  useEffect(() => {
    const unsubscribe = listen((message) => {
      if (message.type === 'start') {
        console.log('Sandpack is starting...');
      }
      if (message.type === 'done') {
        console.log('Sandpack bundling complete');
      }
      if (message.type === 'error') {
        console.error('Sandpack error:', message.error);
        toast({
          title: "Preview Error",
          description: message.error.message || "An error occurred in the preview",
          variant: "destructive"
        });
      }
    });
    
    return unsubscribe;
  }, [listen]);

  return null;
};

export const ArtifactPreview: React.FC<ArtifactPreviewProps> = ({ files }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sandpackFiles, setSandpackFiles] = useState<any>({});
  const [customSetup, setCustomSetup] = useState<any>({});
  const [showStaticPreview, setShowStaticPreview] = useState(false);
  const [staticPreviewContent, setStaticPreviewContent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("preview");
  const [activeFile, setActiveFile] = useState<string | null>(null);
  
  // Process files when they change
  useEffect(() => {
    const prepareFiles = async () => {
      if (!files || files.length === 0) {
        setError("No files to preview");
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log(`Processing ${files.length} files for Sandpack preview`);
        
        // Convert files to the format expected by SandpackManager
        const formattedFiles = files.map(file => ({
          path: file.path,
          content: file.content,
          type: file.language
        }));
        
        // Detect dependencies in the files
        const dependencies = sandpackManager.detectDependencies(formattedFiles);
        
        // Process files for Sandpack format
        const processedFiles = sandpackManager.processFiles(formattedFiles);
        
        // Find a good default file to show in the editor
        const mainFile = Object.keys(processedFiles).find(path => 
          path.includes('/App.') || path.includes('/index.') || path.endsWith('.jsx')
        ) || Object.keys(processedFiles)[0];
        
        setActiveFile(mainFile);
        setSandpackFiles(processedFiles);
        setCustomSetup({ dependencies });
        
        // Generate static preview content as a fallback
        const staticHtml = sandpackManager.generateStaticPreview(formattedFiles);
        setStaticPreviewContent(staticHtml);
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error preparing Sandpack files:", error);
        setError(error instanceof Error ? error.message : "Failed to prepare preview");
        setIsLoading(false);
        setShowStaticPreview(true);
      }
    };
    
    prepareFiles();
  }, [files]);

  const handleShowStaticPreview = () => {
    setShowStaticPreview(true);
  };

  const handleResetSandpack = () => {
    setIsLoading(true);
    setError(null);
    setShowStaticPreview(false);
    
    // Slight delay to ensure reset
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  // Render static preview when Sandpack fails
  const renderStaticPreview = () => {
    if (!staticPreviewContent) {
      return (
        <div className="static-preview-fallback p-6 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Preview Unavailable</h3>
          <p className="text-sm text-gray-600 mb-4">
            Could not generate a preview for the current files.
          </p>
        </div>
      );
    }
    
    return (
      <iframe
        srcDoc={staticPreviewContent}
        className="w-full h-full border-none static-preview-iframe"
        title="Static Code Preview"
        sandbox="allow-same-origin"
      />
    );
  };

  return (
    <div className="artifact-preview-container h-full flex flex-col">
      {isLoading ? (
        <div className="preview-loading-indicator p-8 flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4 mx-auto" />
            <p className="font-medium text-gray-200">Preparing preview...</p>
            <p className="text-sm text-gray-400 mt-1">This may take a few moments</p>
          </div>
        </div>
      ) : error && !showStaticPreview ? (
        <div className="sandpack-error-container p-8 flex flex-col items-center justify-center h-full">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Preview Error</h3>
          <p className="text-sm text-gray-300 mb-4 text-center max-w-md">
            {error}
          </p>
          <div className="flex space-x-3">
            <Button 
              onClick={handleResetSandpack} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            
            <Button 
              onClick={handleShowStaticPreview} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Monitor className="h-4 w-4" />
              View Static Preview
            </Button>
          </div>
        </div>
      ) : showStaticPreview ? (
        <div className="static-preview-container h-full">
          {renderStaticPreview()}
        </div>
      ) : (
        <SandpackErrorBoundary>
          <SandpackProvider
            theme={nightOwl}
            files={sandpackFiles}
            template="vite-react"
            customSetup={customSetup}
            options={{
              activeFile: activeFile || undefined,
              visibleFiles: Object.keys(sandpackFiles).filter(path => !sandpackFiles[path].hidden),
              recompileMode: "delayed",
              recompileDelay: 500,
              classes: {
                "sp-wrapper": "h-full border-none",
                "sp-layout": "h-full border-none"
              }
            }}
          >
            <ConsoleListener />
            <div className="h-full flex flex-col">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="border-b px-2">
                  <TabsList className="bg-transparent border-b-0 justify-start mb-0">
                    <TabsTrigger value="preview" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none rounded-none">
                      <Monitor className="h-4 w-4 mr-2" />
                      Preview
                    </TabsTrigger>
                    <TabsTrigger value="code" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none rounded-none">
                      <Code className="h-4 w-4 mr-2" />
                      Code
                    </TabsTrigger>
                    <TabsTrigger value="console" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none rounded-none">
                      <Terminal className="h-4 w-4 mr-2" />
                      Console
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="preview" className="mt-0 h-full">
                  <SandpackLayout className="h-full">
                    <SandpackPreview showNavigator={true} showRefreshButton={true} />
                  </SandpackLayout>
                </TabsContent>
                
                <TabsContent value="code" className="mt-0 h-full">
                  <SandpackLayout className="h-full">
                    <SandpackCodeEditor showTabs showLineNumbers wrapContent closableTabs />
                  </SandpackLayout>
                </TabsContent>
                
                <TabsContent value="console" className="mt-0 h-full">
                  <SandpackLayout className="h-full">
                    <SandpackConsole />
                  </SandpackLayout>
                </TabsContent>
              </Tabs>
            </div>
          </SandpackProvider>
        </SandpackErrorBoundary>
      )}
    </div>
  );
};
