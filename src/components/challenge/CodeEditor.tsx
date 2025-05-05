
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';

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
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState(content);

  useEffect(() => {
    // Sync content prop with internal state
    setEditableContent(content);
  }, [content]);

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
    // Update the parent component with the edited content
    if (isEditing) {
      onChange(editableContent);
      setIsEditing(false);
    }
    
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

  // Get language for syntax highlighting
  const getLanguageFromFilename = (fileName: string | null): string => {
    if (!fileName) return 'plaintext';
    
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'css': 'css',
      'scss': 'scss',
      'html': 'html',
      'json': 'json',
      'md': 'markdown',
    };
    return languageMap[extension] || 'plaintext';
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditableContent(e.target.value);
    // We don't immediately call onChange here to avoid excessive updates
  };

  const toggleEditMode = () => {
    if (isEditing) {
      // Save when exiting edit mode
      onChange(editableContent);
    }
    setIsEditing(!isEditing);
  };

  // File validation function - integrated from the code snippet
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
    
    // You could add more processing here in a real implementation
    toast({
      title: "File Validated",
      description: "The selected image file is valid and ready for upload."
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-2 border-b bg-zinc-800 text-white">
        <div className="font-mono text-sm text-gray-300">
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
          {!readOnly && (
            <Button 
              variant="outline"
              size="sm"
              onClick={toggleEditMode}
              disabled={!filename}
            >
              {isEditing ? 'View' : 'Edit'}
            </Button>
          )}
          <Button 
            size="sm"
            onClick={handleSave}
            disabled={!filename || readOnly}
          >
            Save
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {filename ? (
          isEditing ? (
            <textarea
              className="w-full h-full font-mono text-sm p-4 border-0 resize-none bg-zinc-900 text-gray-300"
              value={editableContent}
              onChange={handleContentChange}
              disabled={readOnly || !filename}
              spellCheck="false"
            />
          ) : (
            <div className="w-full h-full bg-zinc-900">
              <SyntaxHighlighter
                language={getLanguageFromFilename(filename)}
                style={vs2015}
                customStyle={{
                  margin: 0,
                  padding: '16px',
                  height: '100%',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  backgroundColor: '#18181b'
                }}
                showLineNumbers={true}
              >
                {content}
              </SyntaxHighlighter>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 bg-zinc-900">
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
