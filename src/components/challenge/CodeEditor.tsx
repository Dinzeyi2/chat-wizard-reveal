
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';

interface CodeEditorProps {
  content: string;
  onChange: (newCode: string) => void;
  filename: string | null;
  onSave?: () => void;
  readOnly?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  content,
  onChange,
  filename,
  onSave,
  readOnly = false
}) => {
  const [analyzing, setAnalyzing] = useState(false);

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
    </div>
  );
};

export default CodeEditor;
