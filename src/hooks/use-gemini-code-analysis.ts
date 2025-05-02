
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseGeminiCodeAnalysisOptions {
  onSuccess?: (data: CodeAnalysisResult) => void;
  onError?: (error: Error) => void;
  debug?: boolean;
}

export interface CodeAnalysisResult {
  success: boolean;
  feedback: string;
  suggestions: Array<{
    file: string;
    line?: number;
    suggestion: string;
    severity: 'info' | 'warning' | 'error';
  }>;
  overallScore?: number;
  error?: string;
}

export const useGeminiCodeAnalysis = (options: UseGeminiCodeAnalysisOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<CodeAnalysisResult | null>(null);
  const { toast } = useToast();
  
  const analyzeCode = async (
    projectId: string, 
    files: Array<{ path: string; content: string }>,
    challengeInfo?: any
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Analyzing code for project:', projectId);
      
      const { data, error: supabaseError } = await supabase.functions.invoke('analyze-code', {
        body: { 
          projectId,
          files,
          challengeInfo
        }
      });
      
      if (supabaseError) {
        throw new Error(supabaseError.message || "Failed to analyze code");
      }
      
      if (!data.success) {
        throw new Error(data.error || "Analysis failed");
      }
      
      setResult(data);
      
      if (options.onSuccess) {
        options.onSuccess(data);
      }
      
      toast({
        title: "Code Analysis Complete",
        description: "Your code has been analyzed. Check the feedback for suggestions.",
      });
      
      return data;
    } catch (err: any) {
      setError(err);
      
      if (options.onError) {
        options.onError(err);
      }
      
      toast({
        title: "Error Analyzing Code",
        description: err.message,
        variant: "destructive"
      });
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    analyzeCode,
    isLoading,
    error,
    result
  };
};
