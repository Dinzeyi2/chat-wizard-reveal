
import { useState } from "react";
import { EnhancedPerplexityUIScraper, DesignCodeResult } from "@/utils/EnhancedPerplexityUIScraper";
import { ClaudeCodeCustomizer } from "@/utils/ClaudeCodeCustomizer";
import { UICodeGenerator } from "@/utils/UICodeGenerator";
import { useToast } from "@/hooks/use-toast";

interface UseUiScraperOptions {
  onSuccess?: (data: DesignCodeResult) => void;
  onError?: (error: Error) => void;
}

export const useUiScraper = (apiKeyOrOptions?: string | UseUiScraperOptions, options?: UseUiScraperOptions) => {
  // Extract API key and options
  let perplexityApiKey: string | undefined;
  let claudeApiKey: string | undefined;
  let uiScraperOptions: UseUiScraperOptions = {};
  
  if (typeof apiKeyOrOptions === 'string') {
    perplexityApiKey = apiKeyOrOptions;
    uiScraperOptions = options || {};
  } else if (apiKeyOrOptions && typeof apiKeyOrOptions === 'object') {
    uiScraperOptions = apiKeyOrOptions;
  }
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<DesignCodeResult | null>(null);
  const [customizedResult, setCustomizedResult] = useState<any | null>(null);
  const [generatedCode, setGeneratedCode] = useState<any | null>(null);
  const { toast } = useToast();

  const findDesignCode = async (prompt: string, apiKey?: string) => {
    const perplexityKey = apiKey || perplexityApiKey;
    
    if (!perplexityKey) {
      const error = new Error("Perplexity API key is required");
      setError(error);
      uiScraperOptions.onError?.(error);
      toast({
        title: "API Key Missing",
        description: "Please provide a Perplexity API key in the settings",
        variant: "destructive"
      });
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const scraper = new EnhancedPerplexityUIScraper(perplexityKey);
      const result = await scraper.findDesignCode(prompt);
      
      setResult(result);
      
      if (result.success) {
        uiScraperOptions.onSuccess?.(result);
        toast({
          title: "UI Design Found",
          description: `Found design code for ${result.requirements?.componentType || 'component'}`
        });
        return result;
      } else {
        throw new Error(result.error || "Failed to find matching design");
      }
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(err?.message || "Unknown error");
      setError(error);
      uiScraperOptions.onError?.(error);
      
      toast({
        title: "Error Finding Design",
        description: error.message,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const customizeDesignCode = async (design: DesignCodeResult, apiKey?: string) => {
    const claudeKey = apiKey || claudeApiKey;
    
    if (!claudeKey) {
      const error = new Error("Claude API key is required");
      setError(error);
      uiScraperOptions.onError?.(error);
      toast({
        title: "API Key Missing",
        description: "Please provide a Claude API key in the settings",
        variant: "destructive"
      });
      return null;
    }
    
    if (!design || !design.success) {
      const error = new Error("Valid design code is required for customization");
      setError(error);
      uiScraperOptions.onError?.(error);
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const customizer = new ClaudeCodeCustomizer(claudeKey);
      const customized = await customizer.customizeCode(design);
      
      setCustomizedResult(customized);
      
      if (customized.success) {
        toast({
          title: "Design Customized",
          description: "Successfully customized the UI design code"
        });
        return customized;
      } else {
        throw new Error(customized.error || "Failed to customize design");
      }
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(err?.message || "Unknown error");
      setError(error);
      uiScraperOptions.onError?.(error);
      
      toast({
        title: "Error Customizing Design",
        description: error.message,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // New function that uses the combined UICodeGenerator for a more streamlined experience
  const generateCodeFromPrompt = async (prompt: string, perplexityKey?: string, claudeKey?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const generator = new UICodeGenerator({
        perplexityApiKey: perplexityKey || perplexityApiKey,
        claudeApiKey: claudeKey || claudeApiKey,
        debug: true
      });
      
      toast({
        title: "Generating Code",
        description: "Finding and customizing UI design..."
      });
      
      const result = await generator.generateCode(prompt);
      setGeneratedCode(result);
      
      if (result.success) {
        toast({
          title: "Code Generated",
          description: `Successfully generated ${result.metadata?.componentType || 'component'} code`
        });
        return result;
      } else {
        throw new Error(result.error || "Failed to generate code");
      }
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(err?.message || "Unknown error");
      setError(error);
      uiScraperOptions.onError?.(error);
      
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
    findDesignCode,
    customizeDesignCode,
    generateCodeFromPrompt,  // New integrated function
    isLoading,
    error,
    result,
    customizedResult,
    generatedCode
  };
};
