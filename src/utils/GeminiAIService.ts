
import { supabase } from "@/integrations/supabase/client";

class GeminiAIService {
  private apiKey: string | null = null;
  private maxRetries = 3;
  private baseBackoffMs = 2000;

  constructor() {
    console.log("GeminiAIService initialized");
  }

  /**
   * Set the API key for Gemini API
   */
  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Initialize a project with Gemini AI
   * @param prompt User prompt for project generation
   * @param projectName Name for the project
   */
  async initializeProject(prompt: string, projectName: string) {
    console.log(`Initializing project with prompt: ${prompt.substring(0, 50)}...`);
    
    if (!this.apiKey) {
      // Try to get API key from Supabase environment
      try {
        const { data, error } = await supabase.functions.invoke('get-env', {
          body: { key: 'GEMINI_API_KEY' }
        });
        
        if (error || !data?.value) {
          console.error("Failed to get Gemini API key from environment");
          throw new Error("Gemini API key not configured. Please contact support.");
        }
        
        this.apiKey = data.value;
      } catch (error) {
        console.error("Error retrieving Gemini API key:", error);
        throw new Error("Failed to access Gemini AI service. Please try again later.");
      }
    }
    
    // Call the generate-app function with retries
    let attempt = 0;
    let lastError;
    
    while (attempt < this.maxRetries) {
      try {
        const { data, error } = await supabase.functions.invoke('generate-app', {
          body: { 
            prompt: prompt,
            projectName: projectName 
          }
        });
        
        if (error) throw error;
        if (!data) throw new Error("Empty response from generate-app function");
        
        return {
          projectId: data.projectId,
          projectContext: {
            projectName: data.projectName,
            description: data.description,
            files: data.files,
            challenges: data.challenges || []
          },
          assistantMessage: data.explanation || "App generated successfully.",
          initialCode: data.files?.length > 0 ? data.files[0].content : "",
          appData: data
        };
      } catch (error: any) {
        console.error(`Project initialization attempt ${attempt + 1} failed:`, error);
        lastError = error;
        
        // Check if this is a rate limit error or temporary failure
        const isTemporaryError = error.message && 
          (error.message.includes('429') || 
           error.message.includes('timeout') ||
           error.message.includes('non-2xx'));
        
        if (isTemporaryError && attempt < this.maxRetries - 1) {
          // Wait using exponential backoff before retry
          const waitTime = this.baseBackoffMs * Math.pow(2, attempt);
          console.log(`Temporary error detected. Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          attempt++;
        } else {
          // Permanent error or out of retries
          if (error.message && error.message.includes('429')) {
            throw new Error("AI service is temporarily unavailable due to high demand. Please try again in a few minutes with a simpler prompt.");
          } else {
            throw new Error("Failed to generate app: " + (error.message || "Unknown error"));
          }
        }
      }
    }
    
    // If we exhausted all retries, throw the last error with detailed message
    if (lastError && lastError.message && lastError.message.includes('429')) {
      throw new Error("AI service is temporarily unavailable due to rate limits. Please try again in a few minutes with a simpler prompt.");
    }
    
    throw lastError || new Error("Failed to initialize project after multiple attempts");
  }
}

export const geminiAIService = new GeminiAIService();
