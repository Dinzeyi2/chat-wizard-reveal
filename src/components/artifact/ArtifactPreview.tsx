
import React, { useRef, useEffect, useState } from 'react';
import { webContainerIntegration } from '@/utils/WebContainerManager';
import { Loader2, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("Initializing...");
  const [error, setError] = useState<string | null>(null);
  const [isCrossOriginError, setIsCrossOriginError] = useState(false);
  
  // Set up preview when files change
  useEffect(() => {
    const setupPreview = async () => {
      if (!files || files.length === 0) {
        setStatus("No files to preview");
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setIsProcessing(true);
      setError(null);
      setIsCrossOriginError(false);
      setStatus("Setting up the preview environment...");
      
      try {
        // Set the iframe reference
        if (iframeRef.current) {
          webContainerIntegration.setPreviewElement(iframeRef.current);
        }
        
        // Set up event listeners for status updates
        const onReady = () => {
          setStatus("WebContainer ready");
        };
        
        const onInstallStarted = () => {
          setStatus("Installing dependencies...");
        };
        
        const onInstallComplete = () => {
          setStatus("Dependencies installed");
        };
        
        const onServerStarting = () => {
          setStatus("Starting development server...");
        };
        
        const onPreviewReady = (event: Event) => {
          const url = (event as CustomEvent).detail?.url;
          setStatus("Preview ready");
          setIsLoading(false);
          setIsProcessing(false);
          setError(null);
          
          // Make sure the iframe is updated with the server URL
          if (iframeRef.current && url) {
            iframeRef.current.src = url;
          }
        };
        
        const onError = (event: Event) => {
          const errorDetail = (event as CustomEvent).detail?.error;
          console.error("WebContainer error:", errorDetail);
          const errorMessage = errorDetail?.message || "Something went wrong";
          
          // Check for cross-origin isolation errors
          if (errorMessage.includes("SharedArrayBuffer") || 
              errorMessage.includes("crossOriginIsolated")) {
            setIsCrossOriginError(true);
          }
          
          setError(errorMessage);
          setStatus("Error: " + errorMessage);
          setIsLoading(false);
          setIsProcessing(false);
        };
        
        // Add event listeners
        document.addEventListener('webcontainer-ready', onReady);
        document.addEventListener('installation-started', onInstallStarted);
        document.addEventListener('installation-complete', onInstallComplete);
        document.addEventListener('server-starting', onServerStarting);
        document.addEventListener('preview-ready', onPreviewReady);
        document.addEventListener('webcontainer-error', onError);
        document.addEventListener('installation-error', onError);
        document.addEventListener('server-error', onError);
        
        // Process the artifact files
        await webContainerIntegration.processArtifactFiles(files);
        
        // Cleanup event listeners on unmount
        return () => {
          document.removeEventListener('webcontainer-ready', onReady);
          document.removeEventListener('installation-started', onInstallStarted);
          document.removeEventListener('installation-complete', onInstallComplete);
          document.removeEventListener('server-starting', onServerStarting);
          document.removeEventListener('preview-ready', onPreviewReady);
          document.removeEventListener('webcontainer-error', onError);
          document.removeEventListener('installation-error', onError);
          document.removeEventListener('server-error', onError);
        };
      } catch (error) {
        console.error("Error setting up preview:", error);
        
        // Check for cross-origin isolation errors
        if (error instanceof Error && 
            (error.message.includes("SharedArrayBuffer") || 
             error.message.includes("crossOriginIsolated"))) {
          setIsCrossOriginError(true);
        }
        
        setError(error instanceof Error ? error.message : "Failed to set up preview environment");
        setStatus("Failed to set up preview environment");
        setIsLoading(false);
        setIsProcessing(false);
      }
    };
    
    setupPreview();
  }, [files]);
  
  const handleRetry = async () => {
    await webContainerIntegration.containerManager.reset();
    setIsLoading(true);
    setIsProcessing(true);
    setError(null);
    setIsCrossOriginError(false);
    setStatus("Retrying...");
    await webContainerIntegration.processArtifactFiles(files);
  };

  // Function to render a static code preview when WebContainer fails
  const renderStaticPreview = () => {
    // This is a simple code viewer fallback
    const getHtmlContent = () => {
      // Create a simple HTML preview using the files
      const htmlFile = files.find(f => f.path.endsWith('.html'));
      const cssFiles = files.filter(f => f.path.endsWith('.css'));
      const jsFiles = files.filter(f => f.path.endsWith('.js') || f.path.endsWith('.jsx'));
      
      let html = htmlFile?.content || `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Code Preview</title>
            <style>
              body { font-family: system-ui, sans-serif; margin: 20px; }
              .preview-container { max-width: 800px; margin: 0 auto; }
              .message { text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px; }
            </style>
            ${cssFiles.map(f => `<style>${f.content}</style>`).join('\n')}
          </head>
          <body>
            <div class="preview-container">
              <div class="message">
                <h2>Static Preview</h2>
                <p>This is a static preview of your code. Interactive features are not available.</p>
              </div>
              <div id="code-files">
                ${files.map(f => `
                  <details>
                    <summary>${f.path}</summary>
                    <pre><code>${f.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
                  </details>
                `).join('\n')}
              </div>
            </div>
            ${jsFiles.map(f => `<script type="text/plain">${f.content}</script>`).join('\n')}
          </body>
        </html>
      `;
      
      return html;
    };
    
    return (
      <iframe
        srcDoc={getHtmlContent()}
        className="w-full h-full border-none"
        title="Static Code Preview"
        sandbox="allow-same-origin"
      />
    );
  };

  return (
    <div className="artifact-preview-container h-full flex flex-col">
      {isLoading && (
        <div className="flex flex-col items-center justify-center p-8 h-full">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <div className="text-center">
            <p className="font-medium text-gray-200">{status}</p>
            {isProcessing && (
              <p className="text-sm text-gray-400 mt-1">This may take a few moments</p>
            )}
          </div>
        </div>
      )}
      
      {error && (
        <div className="webcontainer-error-container">
          <AlertTriangle className="webcontainer-error-icon h-12 w-12" />
          <h3 className="webcontainer-error-title">WebContainer Error</h3>
          <p className="webcontainer-error-message">{error}</p>
          
          {isCrossOriginError ? (
            <div className="max-w-md mx-auto text-center">
              <p className="text-sm text-gray-300 mb-4">
                The WebContainer requires special browser settings to work properly. This error occurs due to 
                cross-origin isolation requirements.
              </p>
              
              <div className="bg-zinc-800 p-4 rounded-lg mb-4 text-left">
                <h4 className="text-sm font-semibold text-gray-200 mb-2">Alternative options:</h4>
                <ul className="text-sm text-gray-400 list-disc pl-5 space-y-2">
                  <li>View the static code preview below</li>
                  <li>Switch to the "Code" tab to view the source code</li>
                  <li>Try using a different browser or device</li>
                </ul>
              </div>
              
              <div className="flex justify-center space-x-3 mb-6">
                <Button 
                  onClick={handleRetry} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              </div>
              
              <h4 className="text-sm font-semibold text-gray-200 mb-2">Static Preview</h4>
              <div className="h-64 border border-gray-700 rounded-lg overflow-hidden bg-white">
                {renderStaticPreview()}
              </div>
            </div>
          ) : (
            <div className="webcontainer-error-actions">
              <Button 
                onClick={handleRetry} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          )}
          
          <div className="mt-8 p-4 bg-zinc-800 rounded-lg w-full max-w-lg overflow-auto">
            <h4 className="text-sm font-semibold text-gray-200 mb-2">Files List:</h4>
            <pre className="text-xs text-gray-300 whitespace-pre-wrap">
              <code>
                {JSON.stringify(files.map(f => ({path: f.path, size: f.content.length})), null, 2)}
              </code>
            </pre>
          </div>
        </div>
      )}
      
      <iframe 
        ref={iframeRef}
        className={`w-full h-full border-none flex-1 ${isLoading || error ? 'hidden' : 'block'}`}
        title="Code Preview"
        sandbox="allow-scripts allow-modals allow-forms allow-same-origin allow-popups allow-top-navigation-by-user-activation"
      />
    </div>
  );
};
