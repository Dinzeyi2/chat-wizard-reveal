
import React, { useEffect, useState } from 'react';
import { useArtifact } from './ArtifactSystem';
import { getGeminiVisionService, GeminiVisionService } from '@/utils/GeminiVisionService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ArtifactVisionProps {
  projectId?: string | null;
}

const ArtifactVision: React.FC<ArtifactVisionProps> = ({ projectId }) => {
  const { activeFile, getActiveFileContent } = useArtifact();
  const [visionService, setVisionService] = useState<GeminiVisionService | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [isKeySet, setIsKeySet] = useState<boolean>(false);
  const [isVisionActive, setIsVisionActive] = useState<boolean>(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);
  const [lastProcessedTime, setLastProcessedTime] = useState<string | null>(null);

  // Initialize the Vision service
  useEffect(() => {
    console.log("Initializing Vision service");
    
    const service = getGeminiVisionService({
      debug: true,
      onVisionResponse: (response) => {
        console.log("Vision response received:", response.substring(0, 100) + "...");
        // Update last processed time
        setLastProcessedTime(new Date().toLocaleTimeString());
      },
      onError: (error) => {
        console.error("Vision error:", error);
        toast({
          title: "Vision Error",
          description: error.message,
          variant: "destructive"
        });
        setIsVisionActive(false);
      }
    });
    
    setVisionService(service);
    setIsKeySet(service.isVisionEnabled());
    
    // Check if vision was previously active and restore state
    const checkVisionStatus = () => {
      const isActive = service.isVisionEnabled();
      setIsVisionActive(isActive);
      if (isActive && activeFile) {
        // If vision is active and we have an active file, start capturing
        service.startCapturing(captureEditorContent);
        
        // Broadcast status to chat window
        window.postMessage({
          type: 'GEMINI_VISION_ACTIVATED',
          data: {
            timestamp: new Date().toISOString(),
            activeFile: activeFile?.name
          }
        }, '*');
      }
    };
    
    checkVisionStatus();
    
    // Clean up on unmount
    return () => {
      if (service && isVisionActive) {
        service.stopCapturing();
        setIsVisionActive(false);
      }
    };
  }, []);

  // Monitor active file changes
  useEffect(() => {
    if (isVisionActive && activeFile && visionService) {
      // When the active file changes, capture the new content
      const content = getActiveFileContent(activeFile.id);
      if (content) {
        visionService.processEditorContent(content);
      }
    }
  }, [activeFile, isVisionActive, visionService]);

  // Capture callback function to get active file content
  const captureEditorContent = () => {
    if (!activeFile) return null;
    
    console.log("Capturing editor content for:", activeFile.name);
    const content = getActiveFileContent(activeFile.id);
    
    return content;
  };

  // Toggle vision monitoring
  const toggleVision = () => {
    if (!visionService) return;
    
    console.log("Toggling vision, current state:", isVisionActive);
    
    if (!isVisionActive) {
      if (!isKeySet) {
        setShowApiKeyInput(true);
        return;
      }
      
      visionService.startCapturing(captureEditorContent);
      setIsVisionActive(true);
      
      // Immediately capture current content
      const content = captureEditorContent();
      if (content) {
        console.log("Initial content captured, length:", content.length);
        visionService.processEditorContent(content);
      }
    } else {
      visionService.stopCapturing();
      setIsVisionActive(false);
    }
  };

  // Set API key
  const handleSetApiKey = () => {
    if (!visionService || !apiKey) return;
    
    visionService.setApiKey(apiKey);
    setIsKeySet(true);
    setShowApiKeyInput(false);
    
    // Start capturing after setting the key
    visionService.startCapturing(captureEditorContent);
    setIsVisionActive(true);
    
    toast({
      title: "API Key Set",
      description: "Vision is now activated."
    });
  };

  return (
    <div className="mb-2">
      {showApiKeyInput ? (
        <div className="flex gap-2 items-center mb-2">
          <Input
            type="password"
            placeholder="Enter OpenAI API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="text-xs h-8"
          />
          <Button size="sm" onClick={handleSetApiKey} disabled={!apiKey}>
            Set Key
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setShowApiKeyInput(false)}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isVisionActive ? "default" : "outline"}
            onClick={toggleVision}
            className="text-xs flex items-center gap-1 h-8"
            disabled={!activeFile}
          >
            {isVisionActive ? (
              <>
                <Eye className="h-3.5 w-3.5" />
                <span>Vision Active</span>
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                <span>Enable Vision</span>
              </>
            )}
          </Button>
          
          {isVisionActive && lastProcessedTime && (
            <span className="text-xs text-gray-500">
              Last scan: {lastProcessedTime}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ArtifactVision;
