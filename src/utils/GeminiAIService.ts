
import { supabase } from "@/integrations/supabase/client";
import { agentOrchestrationService } from "./AgentOrchestrationService";

class GeminiAIService {
  private apiKey: string | null = null;
  private maxRetries = 3;
  private baseBackoffMs = 2000;
  private fallbackEnabled = true;
  private useOrchestration = true; // Always use orchestration by default

  constructor() {
    console.log("GeminiAIService initialized");
  }

  /**
   * Set the API key for Gemini API
   */
  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    // Pass the API key to the orchestration service
    agentOrchestrationService.setApiKey(apiKey);
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
        // Pass the API key to the orchestration service
        agentOrchestrationService.setApiKey(data.value);
      } catch (error) {
        console.error("Error retrieving Gemini API key:", error);
        throw new Error("Failed to access Gemini AI service. Please try again later.");
      }
    }
    
    // Always use agent orchestration
    try {
      const orchestrationResult = await agentOrchestrationService.initializeProject(prompt, projectName);
      
      return {
        projectId: orchestrationResult.projectId,
        projectContext: {
          projectName: orchestrationResult.orchestrationPlan.projectName,
          description: orchestrationResult.orchestrationPlan.description,
          orchestrationPlan: orchestrationResult.orchestrationPlan,
          currentStep: orchestrationResult.currentStep
        },
        assistantMessage: orchestrationResult.assistantMessage,
        orchestrationEnabled: true,
        appData: {
          projectId: orchestrationResult.projectId,
          orchestrationPlan: orchestrationResult.orchestrationPlan,
          currentStep: orchestrationResult.currentStep
        }
      };
    } catch (error) {
      console.error("Error using agent orchestration:", error);
      // If orchestration fails, try the backup app generation method
      return this.fallbackToGenerateApp(prompt, projectName);
    }
  }
  
  /**
   * Fallback to standard app generation if orchestration fails
   */
  private async fallbackToGenerateApp(prompt: string, projectName: string) {
    // Call the generate-app function with enhanced retry logic
    let attempt = 0;
    let lastError;
    
    while (attempt < this.maxRetries) {
      try {
        console.log(`Project generation attempt ${attempt + 1}...`);
        
        const { data, error } = await supabase.functions.invoke('generate-app', {
          body: { 
            prompt: prompt,
            projectName: projectName 
          }
        });
        
        if (error) {
          console.error(`Error from generate-app function:`, error);
          throw new Error(`Error from generate-app function: ${error.message || "Unknown error"}`);
        }
        
        if (!data) {
          throw new Error("Empty response from generate-app function");
        }
        
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
          appData: data,
          orchestrationEnabled: false
        };
      } catch (error: any) {
        console.error(`Project initialization attempt ${attempt + 1} failed:`, error);
        lastError = error;
        
        // Check if this is a rate limit error or temporary failure
        const isTemporaryError = error.message && (
          error.message.includes('429') || 
          error.message.includes('timeout') ||
          error.message.includes('non-2xx') ||
          error.message.includes('quota exceeds') ||
          error.message.includes('unavailable')
        );
        
        if (isTemporaryError && attempt < this.maxRetries - 1) {
          // Wait using exponential backoff before retry
          const waitTime = this.baseBackoffMs * Math.pow(2, attempt);
          console.log(`Temporary error detected. Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          attempt++;
        } else {
          // Permanent error or out of retries
          if (this.fallbackEnabled) {
            console.log("Trying to use fallback AI service...");
            try {
              // Try to fallback to OpenAI or Anthropic instead
              return await this.fallbackToAlternativeAI(prompt, projectName);
            } catch (fallbackError) {
              console.error("Fallback also failed:", fallbackError);
              // Continue with normal error flow
              throw new Error("AI service is temporarily unavailable due to high demand. Please try again in a few minutes with a simpler prompt or try breaking your request into smaller parts.");
            }
          } else {
            throw new Error("Failed to generate app: " + (error.message || "Unknown error"));
          }
        }
      }
    }
    
    // If we exhausted all retries, throw the last error with detailed message
    if (lastError && lastError.message && (lastError.message.includes('429') || lastError.message.includes('quota'))) {
      throw new Error("AI service is temporarily unavailable due to rate limits. Please try again in a few minutes with a simpler prompt.");
    }
    
    throw lastError || new Error("Failed to initialize project after multiple attempts");
  }
  
  /**
   * Try to use OpenAI or Anthropic as a fallback if available
   */
  private async fallbackToAlternativeAI(prompt: string, projectName: string) {
    // First try OpenAI if available
    try {
      const { data: openAIData, error: openAIError } = await supabase.functions.invoke('get-env', {
        body: { key: 'OPENAI_API_KEY' }
      });
      
      if (!openAIError && openAIData?.value) {
        console.log("Attempting to use OpenAI as fallback...");
        try {
          // This would call a hypothetical openAI-based app generator
          const { data, error } = await supabase.functions.invoke('generate-app', {
            body: { 
              prompt: prompt,
              projectName: projectName,
              useOpenAI: true
            }
          });
          
          if (!error && data) {
            return {
              projectId: data.projectId,
              projectContext: {
                projectName: data.projectName,
                description: data.description,
                files: data.files,
                challenges: data.challenges || []
              },
              assistantMessage: data.explanation || "App generated with OpenAI fallback.",
              initialCode: data.files?.length > 0 ? data.files[0].content : "",
              appData: data,
              orchestrationEnabled: false
            };
          }
        } catch (error) {
          console.error("OpenAI fallback failed:", error);
        }
      }
    } catch (error) {
      console.error("Error retrieving OpenAI API key:", error);
    }
    
    // Then try Anthropic if available
    try {
      const { data: anthropicData, error: anthropicError } = await supabase.functions.invoke('get-env', {
        body: { key: 'ANTHROPIC_API_KEY' }
      });
      
      if (!anthropicError && anthropicData?.value) {
        console.log("Attempting to use Anthropic as fallback...");
        // Implementation for Anthropic would go here
      }
    } catch (error) {
      console.error("Error retrieving Anthropic API key:", error);
    }
    
    // If all fallbacks failed
    throw new Error("All AI services are currently unavailable. Please try again in a few minutes with a simpler prompt.");
  }
}

export const geminiAIService = new GeminiAIService();
