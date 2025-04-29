
import { useState } from "react";
import { EnhancedPerplexityUIScraper, DesignCodeResult } from "@/utils/EnhancedPerplexityUIScraper";
import { useToast } from "@/hooks/use-toast";

interface UseUiScraperOptions {
  onSuccess?: (data: DesignCodeResult) => void;
  onError?: (error: Error) => void;
}

export const useUiScraper = (apiKey?: string, options?: UseUiScraperOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<DesignCodeResult | null>(null);
  const { toast } = useToast();

  const findDesignCode = async (prompt: string, perplexityApiKey?: string) => {
    const key = apiKey || perplexityApiKey;
    
    if (!key) {
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
      
      const scraper = new EnhancedPerplexityUIScraper(key);
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

  return {
    findDesignCode,
    isLoading,
    error,
    result
  };
};
