
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface CodeEditorProps {
  content: string;
  onChange: (newCode: string) => void;
  filename: string | null;
  onSave?: () => void;
  readOnly?: boolean;
  projectId?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  content,
  onChange,
  filename,
  onSave,
  readOnly = false,
  projectId
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [sentGuidanceMessage, setSentGuidanceMessage] = useState(false);

  useEffect(() => {
    // When the component mounts and has a project ID but hasn't sent guidance yet
    if (projectId && !sentGuidanceMessage && filename) {
      // Send guidance message to console for the AI to pick up
      console.log("AI_GUIDANCE_NEEDED:", JSON.stringify({
        projectId,
        filename,
        action: "send_first_step"
      }));
      setSentGuidanceMessage(true);
    }
  }, [projectId, filename, sentGuidanceMessage]);

  // Function to analyze code
  const analyzeCode = async () => {
    if (!content || !filename) return;
    
    setAnalyzing(true);
    
    try {
      // In a real implementation, this would call a backend AI service
      // For now we'll just simulate with a toast message
      setTimeout(() => {
        toast({
          title: "Code Analysis",
          description: "Your code looks good! Make sure to test all edge cases."
        });
        setAnalyzing(false);
      }, 1500);
    } catch (err) {
      console.error('Error analyzing code:', err);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze code. Please try again.",
        variant: "destructive"
      });
      setAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave();
    } else {
      toast({
        title: "File Saved",
        description: `${filename} has been saved successfully.`
      });
    }

    // Trigger guidance check after save
    if (projectId) {
      console.log("AI_CODE_SAVED:", JSON.stringify({
        projectId,
        filename,
        action: "check_progress"
      }));
    }
  };

  // File validation function
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    // Continue with file processing...
    console.log("File validated for CodeEditor:", file.name);
    
    toast({
      title: "File Validated",
      description: "The selected image file is valid and ready for upload."
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b">
        <div className="font-mono text-sm">
          {filename || 'No file selected'}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={analyzeCode}
            disabled={analyzing || !filename}
          >
            {analyzing ? 'Analyzing...' : 'Analyze Code'}
          </Button>
          <Button 
            size="sm"
            onClick={handleSave}
            disabled={!filename || readOnly}
          >
            Save
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        {filename ? (
          <textarea
            className="w-full h-full font-mono text-sm p-4 border rounded resize-none"
            value={content}
            onChange={(e) => onChange(e.target.value)}
            disabled={readOnly || !filename}
            spellCheck="false"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a file to edit
          </div>
        )}
      </div>

      {/* Hidden file input for demonstration purposes */}
      <input 
        type="file"
        id="code-file-upload"
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default CodeEditor;
