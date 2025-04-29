
import { useState } from "react";
import { UICodeGenerator } from "@/utils/UICodeGenerator";
import { useToast } from "@/hooks/use-toast";

interface UseUiScraperOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export const useUiScraper = (apiKeyOrOptions?: string | UseUiScraperOptions, options?: UseUiScraperOptions) => {
  // Extract API key and options
  let claudeApiKey: string | undefined;
  let uiScraperOptions: UseUiScraperOptions = {};
  
  if (typeof apiKeyOrOptions === 'string') {
    claudeApiKey = apiKeyOrOptions;
    uiScraperOptions = options || {};
  } else if (apiKeyOrOptions && typeof apiKeyOrOptions === 'object') {
    uiScraperOptions = apiKeyOrOptions;
  }
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [generatedCode, setGeneratedCode] = useState<any | null>(null);
  const { toast } = useToast();

  // Function to generate code directly using Claude
  const generateCodeFromPrompt = async (prompt: string, claudeKey?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const generator = new UICodeGenerator({
        claudeApiKey: claudeKey || claudeApiKey,
        debug: true
      });
      
      toast({
        title: "Generating Code",
        description: "Creating UI code based on your prompt..."
      });
      
      const result = await generator.generateCode(prompt);
      setGeneratedCode(result);
      
      if (result.success) {
        toast({
          title: "Code Generated",
          description: `Successfully generated ${result.metadata?.componentType || 'component'} code`
        });
        
        if (uiScraperOptions.onSuccess) {
          uiScraperOptions.onSuccess(result);
        }
        
        return result;
      } else {
        throw new Error(result.error || "Failed to generate code");
      }
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(err?.message || "Unknown error");
      setError(error);
      
      if (uiScraperOptions.onError) {
        uiScraperOptions.onError(error);
      }
      
      toast({
        title: "Error Generating Code",
        description: error.message,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generateCodeFromPrompt,
    isLoading,
    error,
    generatedCode
  };
};
