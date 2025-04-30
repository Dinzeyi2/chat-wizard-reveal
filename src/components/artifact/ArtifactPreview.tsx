
import React, { useRef, useEffect, useState } from 'react';
import { webContainerIntegration } from '@/utils/WebContainerManager';
import { Loader2, AlertTriangle, ExternalLink, RefreshCw, Monitor } from 'lucide-react';
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
  const [isInstanceLimitError, setIsInstanceLimitError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showStaticPreview, setShowStaticPreview] = useState(false);
  const [activeTab, setActiveTab] = useState("preview");
  
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
      setIsInstanceLimitError(false);
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
          
          // Detect specific types of errors
          if (errorDetail?.isCrossOriginError || 
              errorMessage.includes("SharedArrayBuffer") || 
              errorMessage.includes("crossOriginIsolated")) {
            console.log("Detected cross-origin isolation error");
            setIsCrossOriginError(true);
          }
          
          // Check for instance limit errors
          if (errorDetail?.isInstanceLimitError || 
              errorMessage.includes("Unable to create more instances")) {
            console.log("Detected instance limit error");
            setIsInstanceLimitError(true);
          }
          
          setError(errorMessage);
          setStatus("Error: " + errorMessage);
          setIsLoading(false);
          setIsProcessing(false);
          
          // Automatically show static preview after 3 seconds if there's an error
          setTimeout(() => {
            if (!showStaticPreview) {
              console.log("Auto-switching to static preview due to WebContainer error");
              setShowStaticPreview(true);
            }
          }, 2000);
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
        
        // Check for instance limit errors
        if (error instanceof Error && 
            error.message.includes("Unable to create more instances")) {
          setIsInstanceLimitError(true);
        }
        
        setError(error instanceof Error ? error.message : "Failed to set up preview environment");
        setStatus("Failed to set up preview environment");
        setIsLoading(false);
        setIsProcessing(false);
        
        // Show static preview after error
        setTimeout(() => {
          setShowStaticPreview(true);
        }, 1500);
      }
    };
    
    setupPreview();
  }, [files, retryCount]);
  
  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    await webContainerIntegration.containerManager.reset();
    setIsLoading(true);
    setIsProcessing(true);
    setError(null);
    setIsCrossOriginError(false);
    setIsInstanceLimitError(false);
    setShowStaticPreview(false);
    setStatus("Retrying...");
  };

  const handleShowStaticPreview = () => {
    setShowStaticPreview(true);
  };

  // Function to render a static code preview when WebContainer fails
  const renderStaticPreview = () => {
    // Create a simple HTML preview using the files
    const htmlFile = files.find(f => f.path.endsWith('.html'));
    const cssFiles = files.filter(f => f.path.endsWith('.css'));
    const jsFiles = files.filter(f => f.path.endsWith('.js') || f.path.endsWith('.jsx'));
    
    // Prepare HTML content with file previews
    const staticContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Static Code Preview</title>
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              margin: 0; 
              padding: 0;
              background-color: #f8f9fa;
              color: #333;
            }
            .preview-container { 
              max-width: 100%; 
              margin: 0 auto; 
              padding: 20px;
            }
            .static-header {
              font-size: 24px;
              text-align: center;
              margin-bottom: 16px;
              color: #333;
            }
            .static-message {
              font-size: 16px;
              text-align: center;
              margin-bottom: 32px;
              color: #666;
            }
            .file-item {
              margin-bottom: 1rem;
              border-radius: 8px;
              overflow: hidden;
              border: 1px solid #ddd;
              background: white;
            }
            .file-header {
              display: flex;
              align-items: center;
              padding: 10px 16px;
              background-color: #f1f3f5;
              border-bottom: 1px solid #ddd;
              cursor: pointer;
              user-select: none;
            }
            .file-header:hover {
              background-color: #e9ecef;
            }
            .file-icon {
              margin-right: 10px;
              font-weight: bold;
            }
            .file-content {
              padding: 16px;
              overflow-x: auto;
              display: none;
            }
            .file-content pre {
              margin: 0;
              font-family: monospace;
              white-space: pre-wrap;
              font-size: 14px;
              line-height: 1.5;
            }
            .file-item.open .file-content {
              display: block;
            }
            details {
              margin-bottom: 16px;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              overflow: hidden;
            }
            summary {
              padding: 12px 16px;
              background-color: #f8fafc;
              cursor: pointer;
              font-weight: 600;
            }
            details pre {
              margin: 0;
              padding: 16px;
              background-color: #ffffff;
              overflow-x: auto;
              font-family: monospace;
              font-size: 14px;
              line-height: 1.5;
            }
            ${cssFiles.map(f => f.content).join('\n')}
          </style>
        </head>
        <body>
          <div class="preview-container">
            <h2 class="static-header">Static Preview</h2>
            <p class="static-message">This is a static preview of your code. Interactive features are not available.</p>
            
            <div id="file-list">
              ${files.map(file => `
                <details>
                  <summary>${file.path}</summary>
                  <pre><code>${file.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
                </details>
              `).join('')}
            </div>
          </div>
          
          <script>
            // Allow expanding/collapsing file items
            document.addEventListener('DOMContentLoaded', function() {
              const headers = document.querySelectorAll('.file-header');
              headers.forEach(header => {
                header.addEventListener('click', function() {
                  const fileItem = this.parentElement;
                  fileItem.classList.toggle('open');
                });
              });
            });
          </script>
        </body>
      </html>
    `;
    
    return (
      <iframe
        srcDoc={staticContent}
        className="w-full h-full border-none static-preview-iframe"
        title="Static Code Preview"
        sandbox="allow-same-origin"
      />
    );
  };

  return (
    <div className="artifact-preview-container h-full flex flex-col">
      {isLoading && !showStaticPreview && (
        <div className="preview-loading-indicator p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <div className="text-center">
            <p className="font-medium text-gray-200">{status}</p>
            {isProcessing && (
              <p className="text-sm text-gray-400 mt-1">This may take a few moments</p>
            )}
          </div>
        </div>
      )}
      
      {error && !showStaticPreview && (
        <div className="webcontainer-error-container">
          <AlertTriangle className="webcontainer-error-icon h-12 w-12" />
          <h3 className="webcontainer-error-title">WebContainer Error</h3>
          <p className="webcontainer-error-message">{error}</p>
          
          {isInstanceLimitError && (
            <div className="max-w-md mx-auto text-center">
              <p className="text-sm text-gray-300 mb-4">
                WebContainer has reached its instance limit. This often happens when there are too many 
                WebContainer instances running in other tabs or the environment is limited.
              </p>
              
              <div className="bg-zinc-800 p-4 rounded-lg mb-4 text-left">
                <h4 className="text-sm font-semibold text-gray-200 mb-2">Try these solutions:</h4>
                <ul className="text-sm text-gray-400 list-disc pl-5 space-y-2">
                  <li>Close other tabs with WebContainer instances</li>
                  <li>Refresh this page to reset the WebContainer</li>
                  <li>View the static code preview instead</li>
                </ul>
              </div>
            </div>
          )}
          
          {isCrossOriginError && !isInstanceLimitError && (
            <div className="max-w-md mx-auto text-center">
              <p className="text-sm text-gray-300 mb-4">
                The WebContainer requires cross-origin isolation which is not available in this environment.
                This is a common issue with the WebContainer API.
              </p>
              
              <div className="bg-zinc-800 p-4 rounded-lg mb-4 text-left">
                <h4 className="text-sm font-semibold text-gray-200 mb-2">Alternative options:</h4>
                <ul className="text-sm text-gray-400 list-disc pl-5 space-y-2">
                  <li>View the static code preview instead (recommended)</li>
                  <li>Try using a different browser</li>
                  <li>Try again later - this is sometimes a temporary issue</li>
                </ul>
              </div>
            </div>
          )}
          
          {!isCrossOriginError && !isInstanceLimitError && (
            <div className="max-w-md mx-auto text-center">
              <p className="text-sm text-gray-300 mb-4">
                There was a problem initializing the WebContainer preview environment.
              </p>
            </div>
          )}
          
          <div className="webcontainer-error-actions">
            <Button 
              onClick={handleRetry} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
            
            <Button 
              onClick={handleShowStaticPreview} 
              variant="outline"
              className="flex items-center gap-2 ml-3"
            >
              <Monitor className="h-4 w-4" />
              View Static Preview
            </Button>
          </div>
        </div>
      )}
      
      {showStaticPreview ? (
        <div className="static-preview-container h-full">
          {renderStaticPreview()}
        </div>
      ) : (
        <iframe 
          ref={iframeRef}
          className={`w-full h-full border-none flex-1 ${isLoading || error ? 'hidden' : 'block'}`}
          title="Code Preview"
          sandbox="allow-scripts allow-modals allow-forms allow-same-origin allow-popups allow-top-navigation-by-user-activation"
        />
      )}
    </div>
  );
};
