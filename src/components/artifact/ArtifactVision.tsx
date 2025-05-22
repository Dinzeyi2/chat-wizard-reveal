
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

  // Initialize the Gemini Vision service
  useEffect(() => {
    const service = getGeminiVisionService({
      debug: true,
      onVisionResponse: (response) => {
        console.log("Gemini Vision response received:", response.substring(0, 100) + "...");
      },
      onError: (error) => {
        console.error("Gemini Vision error:", error);
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
    
    // Clean up on unmount
    return () => {
      if (service && isVisionActive) {
        service.stopCapturing();
        setIsVisionActive(false);
      }
    };
  }, []);

  // Capture callback function to get active file content
  const captureEditorContent = () => {
    if (!activeFile) return null;
    return getActiveFileContent(activeFile.id);
  };

  // Toggle vision monitoring
  const toggleVision = () => {
    if (!visionService) return;
    
    if (!isVisionActive) {
      if (!isKeySet) {
        setShowApiKeyInput(true);
        return;
      }
      
      visionService.startCapturing(captureEditorContent);
      setIsVisionActive(true);
      
      console.log("GEMINI_VISION_ACTIVATED:", JSON.stringify({
        timestamp: new Date().toISOString(),
        projectId,
        activeFile: activeFile?.name
      }));
    } else {
      visionService.stopCapturing();
      setIsVisionActive(false);
      
      console.log("GEMINI_VISION_DEACTIVATED:", JSON.stringify({
        timestamp: new Date().toISOString()
      }));
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
      description: "Gemini Vision is now activated."
    });
  };

  return (
    <div className="mb-2">
      {showApiKeyInput ? (
        <div className="flex gap-2 items-center mb-2">
          <Input
            type="password"
            placeholder="Enter Gemini API Key"
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
      )}
    </div>
  );
};

export default ArtifactVision;
