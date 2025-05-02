
import { useState } from "react";
import { EnhancedPerplexityUIScraper, DesignCodeResult } from "@/utils/EnhancedPerplexityUIScraper";
import { ClaudeCodeCustomizer } from "@/utils/ClaudeCodeCustomizer";
import { useToast } from "@/hooks/use-toast";
import { UICodeGenerator, GenerationResult } from "@/utils/UICodeGenerator";

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

  // Initialize the UI Code Generator
  const codeGenerator = new UICodeGenerator({
    perplexityApiKey,
    claudeApiKey,
    debug: true
  });

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

  const generateCodeFromPrompt = async (prompt: string, claudeKey?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Add better logging for debugging
      console.log("Generating code from prompt:", prompt.substring(0, 100) + "...");
      
      // Use the passed API key or the one from initialization
      const apiKey = claudeKey || claudeApiKey;
      if (!apiKey) {
        console.warn("No Claude API key provided for code generation");
      }
      
      // If we have a Claude API key, we should ensure it's set in the generator
      if (apiKey && apiKey !== codeGenerator.getClaudeApiKey()) {
        // Update the API key in the code generator
        codeGenerator.setClaudeApiKey(apiKey);
      }
      
      // Generate the code - only pass the prompt
      const result = await codeGenerator.generateCode(prompt);
      console.log("Code generation result:", result);
      
      setGeneratedCode(result);
      
      if (result.success) {
        toast({
          title: "Code Generated",
          description: `Generated code for ${result.metadata?.componentType || 'component'}`
        });
        return result;
      } else {
        throw new Error(result.error || "Failed to generate code");
      }
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(err?.message || "Unknown error");
      console.error("Error generating code:", error);
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
    generateCodeFromPrompt,
    isLoading,
    error,
    result,
    customizedResult,
    generatedCode
  };
};
