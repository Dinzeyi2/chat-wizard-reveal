
import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { geminiAIService } from "@/utils/GeminiAIService";

interface CodeEditorProps {
  code: string;
  language?: string;
  projectId?: string;
  filename?: string;
  readOnly?: boolean;
  onCodeChange?: (value: string) => void;
  height?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  language = "javascript",
  projectId = "default",
  filename = "main.js",
  readOnly = false,
  onCodeChange,
  height = "500px"
}) => {
  const editorRef = useRef<any>(null);
  const lastAnalysisTime = useRef<number>(0);
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };
  
  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined && onCodeChange) {
      onCodeChange(value);
      
      // Schedule delayed code analysis
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
      
      // Only trigger analysis if it's been at least 5 seconds since the last one
      const now = Date.now();
      if (now - lastAnalysisTime.current > 5000) {
        analysisTimeoutRef.current = setTimeout(() => {
          analyzeCode(value);
          lastAnalysisTime.current = Date.now();
        }, 2000);
      }
    }
  };
  
  const analyzeCode = async (codeToAnalyze: string) => {
    if (!geminiAIService.getApiKey()) {
      return;
    }
    
    try {
      // Only analyze if code is substantial
      if (codeToAnalyze.length < 50) {
        return;
      }
      
      await geminiAIService.processCodeAnalysisRequest(
        codeToAnalyze,
        filename,
        projectId
      );
    } catch (error) {
      console.error("Error analyzing code:", error);
    }
  };
  
  const handleAnalyzeClick = () => {
    if (!geminiAIService.getApiKey()) {
      toast({
        title: "API Key Required",
        description: "Please set your Gemini API key first.",
        variant: "destructive"
      });
      return;
    }
    
    const currentCode = editorRef.current?.getValue() || code;
    analyzeCode(currentCode);
    toast({
      title: "Code Analysis Started",
      description: "Analyzing your code...",
    });
  };
  
  useEffect(() => {
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, []);
  
  return (
    <Card className="w-full h-full shadow-lg">
      <CardHeader className="p-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{filename}</CardTitle>
          <Button 
            size="sm" 
            onClick={handleAnalyzeClick}
            disabled={readOnly}
          >
            Analyze Code
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Editor
          height={height}
          language={language}
          value={code}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          options={{
            readOnly,
            minimap: { enabled: true },
            fontSize: 14,
            wordWrap: 'on',
            automaticLayout: true,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            folding: true,
            renderLineHighlight: 'all',
          }}
        />
      </CardContent>
    </Card>
  );
};

export default CodeEditor;
