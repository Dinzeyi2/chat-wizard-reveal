
import { useState } from 'react';
import { GeminiCodeGenerator, ChallengeResult } from '@/utils/GeminiCodeGenerator';
import { useToast } from '@/hooks/use-toast';

interface UseGeminiCodeOptions {
  onSuccess?: (data: ChallengeResult) => void;
  onError?: (error: Error) => void;
  debug?: boolean;
}

export const useGeminiCode = (options: UseGeminiCodeOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const { toast } = useToast();
  
  const generator = new GeminiCodeGenerator({ debug: options.debug });
  
  const generateChallenge = async (prompt: string, completionLevel?: 'beginner' | 'intermediate' | 'advanced') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await generator.generateChallenge({
        prompt,
        completionLevel
      });
      
      if (!response.success) {
        throw new Error(response.error || "Failed to generate code challenge");
      }
      
      // Ensure the prompt is included in the result
      const resultWithPrompt: ChallengeResult = {
        ...response,
        prompt: prompt // Store the original prompt in the result
      };
      
      setResult(resultWithPrompt);
      
      if (options.onSuccess) {
        options.onSuccess(resultWithPrompt);
      }
      
      toast({
        title: "Challenge Generated",
        description: `Created "${resultWithPrompt.projectName}" with ${resultWithPrompt.challenges.length} coding challenges!`,
      });
      
      return resultWithPrompt;
    } catch (err: any) {
      setError(err);
      
      if (options.onError) {
        options.onError(err);
      }
      
      toast({
        title: "Error Generating Challenge",
        description: err.message,
        variant: "destructive"
      });
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    generateChallenge,
    isLoading,
    error,
    result
  };
};
