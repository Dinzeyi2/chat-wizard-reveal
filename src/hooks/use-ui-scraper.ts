
import { useState } from "react";
import { EnhancedPerplexityUIScraper, DesignCodeResult } from "@/utils/EnhancedPerplexityUIScraper";
import { ClaudeCodeCustomizer } from "@/utils/ClaudeCodeCustomizer";
import { useToast } from "@/hooks/use-toast";

interface UseUiScraperOptions {
  onSuccess?: (data: DesignCodeResult) => void;
  onError?: (error: Error) => void;
}

export const useUiScraper = (perplexityApiKey?: string, claudeApiKey?: string, options?: UseUiScraperOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<DesignCodeResult | null>(null);
  const [customizedResult, setCustomizedResult] = useState<any | null>(null);
  const { toast } = useToast();

  const findDesignCode = async (prompt: string, apiKeys?: {perplexity?: string, claude?: string}) => {
    const perplexityKey = apiKeys?.perplexity || perplexityApiKey;
    
    if (!perplexityKey) {
      const error = new Error("Perplexity API key is required");
      setError(error);
      options?.onError?.(error);
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
        options?.onSuccess?.(result);
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
      options?.onError?.(error);
      
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

  const customizeDesignCode = async (design: DesignCodeResult, claudeKey?: string) => {
    const apiKey = claudeKey || claudeApiKey;
    
    if (!apiKey) {
      const error = new Error("Claude API key is required");
      setError(error);
      options?.onError?.(error);
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
      options?.onError?.(error);
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const customizer = new ClaudeCodeCustomizer(apiKey);
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
      options?.onError?.(error);
      
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

  return {
    findDesignCode,
    customizeDesignCode,
    isLoading,
    error,
    result,
    customizedResult
  };
};
