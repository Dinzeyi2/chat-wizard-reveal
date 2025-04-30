
import React, { useRef, useEffect, useState } from 'react';
import { webContainerIntegration } from '@/utils/WebContainerManager';
import { Loader2 } from 'lucide-react';

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
          
          // Make sure the iframe is updated with the server URL
          if (iframeRef.current && url) {
            iframeRef.current.src = url;
          }
        };
        
        const onError = (event: Event) => {
          console.error("WebContainer error:", (event as CustomEvent).detail?.error);
          setStatus("Error: " + ((event as CustomEvent).detail?.error?.message || "Something went wrong"));
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
        setStatus("Failed to set up preview environment");
        setIsLoading(false);
        setIsProcessing(false);
      }
    };
    
    setupPreview();
  }, [files]);
  
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
      <iframe 
        ref={iframeRef}
        className={`w-full h-full border-none flex-1 ${isLoading ? 'hidden' : 'block'}`}
        title="Code Preview"
        sandbox="allow-scripts allow-modals allow-forms allow-same-origin allow-popups allow-top-navigation-by-user-activation"
      />
    </div>
  );
};
