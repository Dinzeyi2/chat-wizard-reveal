
import { supabase } from "@/integrations/supabase/client";
import { agentOrchestrationService } from "./AgentOrchestrationService";

class GeminiAIService {
  private apiKey: string | null = null;
  private maxRetries = 3;
  private baseBackoffMs = 2000;
  private fallbackEnabled = true;
  private useOrchestration = false;
  private lastError: Error | null = null;
  private isLoadingKey = false;
  private mockedResponse = false;

  constructor() {
    console.log("GeminiAIService initialized");
    // Try to load API key early
    this.loadApiKeyFromEnvironment().catch(err => {
      console.error("Failed to load API key during initialization:", err);
    });
  }

  /**
   * Load API key from environment
   */
  private async loadApiKeyFromEnvironment(): Promise<string | null> {
    if (this.isLoadingKey) {
      console.log("Already loading API key, returning...");
      return null;
    }
    
    try {
      this.isLoadingKey = true;
      
      // Hardcoded API key for development/demo use (will be replaced in production)
      const demoKey = "AIza1234567890DemoKeyForTesting";
      this.apiKey = demoKey;
      
      try {
        const { data, error } = await supabase.functions.invoke('get-env', {
          body: { key: 'GEMINI_API_KEY' }
        });
        
        if (!error && data?.value) {
          this.apiKey = data.value;
          // Pass the API key to the orchestration service
          agentOrchestrationService.setApiKey(data.value);
          console.log("API key loaded from environment");
          return data.value;
        } else {
          console.log("Using demo API key for development");
        }
      } catch (error) {
        console.error("Error retrieving Gemini API key:", error);
        console.log("Using demo API key for development");
      }
      
      // Pass the demo API key to the orchestration service if needed
      agentOrchestrationService.setApiKey(demoKey);
      return demoKey;
    } catch (error) {
      console.error("Error in loadApiKeyFromEnvironment:", error);
      return null;
    } finally {
      this.isLoadingKey = false;
    }
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
   * Enable mocked response mode for development/testing
   */
  enableMockedResponse(enable = true) {
    this.mockedResponse = enable;
  }

  /**
   * Get current API key, loading from environment if needed
   */
  async getApiKey(): Promise<string> {
    if (this.apiKey) {
      return this.apiKey;
    }
    
    const key = await this.loadApiKeyFromEnvironment();
    if (!key) {
      throw new Error("Gemini API key not configured. Please contact support or check your environment settings.");
    }
    
    return key;
  }

  /**
   * Toggle agent orchestration mode
   */
  toggleOrchestration(enabled: boolean) {
    this.useOrchestration = enabled;
  }

  /**
   * Get the last error that occurred
   */
  getLastError(): Error | null {
    return this.lastError;
  }

  /**
   * Clear the last error
   */
  clearLastError() {
    this.lastError = null;
  }

  /**
   * Create a mock response for development and testing
   */
  private createMockResponse(prompt: string, projectName: string) {
    console.log("Creating mock response for development/testing purposes");
    return {
      projectId: "mock-project-" + Date.now(),
      projectContext: {
        projectName: projectName || "MockProject",
        description: "This is a mock project generated for development purposes.",
        files: [
          {
            path: "src/App.tsx",
            content: `import React from 'react';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to ${projectName}</h1>
        <p>This is a mock app generated based on: "${prompt.substring(0, 50)}..."</p>
      </header>
    </div>
  );
}

export default App;`
          }
        ],
        challenges: [
          {
            id: "mock-challenge-1",
            title: "Add a Nav Component",
            description: "Create a navigation component for this application."
          }
        ]
      },
      assistantMessage: "I've created a mock project for demonstration purposes. In a production environment, this would be a real app based on your prompt.",
      initialCode: `// Mock code generated for development purposes
import React from 'react';

function App() {
  return (
    <div className="App">
      <h1>Welcome to ${projectName}</h1>
    </div>
  );
}`,
      appData: {
        projectName,
        description: "Mock project for development",
        files: [],
        challenges: []
      }
    };
  }

  /**
   * Initialize a project with Gemini AI
   * @param prompt User prompt for project generation
   * @param projectName Name for the project
   * @param useOrchestration Whether to use agent orchestration
   */
  async initializeProject(prompt: string, projectName: string, useOrchestration = false) {
    console.log(`Initializing project with prompt: ${prompt.substring(0, 50)}...`);
    this.clearLastError();
    
    try {
      // If using mocked response (for dev/testing)
      if (this.mockedResponse) {
        return this.createMockResponse(prompt, projectName);
      }
      
      // Ensure we have an API key
      await this.getApiKey();
      
      // Use agent orchestration if specified
      if (useOrchestration || this.useOrchestration) {
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
          // Fallback to standard project generation
          console.log("Falling back to standard project generation");
        }
      }
      
      // Call the generate-app function with enhanced retry logic
      let attempt = 0;
      let lastError;
      
      while (attempt < this.maxRetries) {
        try {
          console.log(`Project generation attempt ${attempt + 1}...`);
          
          const { data, error } = await supabase.functions.invoke('generate-app', {
            body: { 
              prompt: prompt,
              projectName: projectName,
              model: "gemini-1.5-pro", // Use the Gemini 2.5 Pro model
              mockResponse: this.mockedResponse
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
            appData: data
          };
        } catch (error: any) {
          console.error(`Project initialization attempt ${attempt + 1} failed:`, error);
          lastError = error;
          this.lastError = error;
          
          // Check if this is a rate limit error or temporary failure
          const isTemporaryError = error.message && (
            error.message.includes('429') || 
            error.message.includes('timeout') ||
            error.message.includes('non-2xx') ||
            error.message.includes('quota exceeds') ||
            error.message.includes('unavailable') ||
            error.message.includes('access')
          );
          
          if (isTemporaryError && attempt < this.maxRetries - 1) {
            // Wait using exponential backoff before retry
            const waitTime = this.baseBackoffMs * Math.pow(2, attempt);
            console.log(`Temporary error detected. Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            attempt++;
          } else {
            // Permanent error or out of retries
            if (this.fallbackEnabled && error.message && (error.message.includes('429') || error.message.includes('quota') || error.message.includes('access'))) {
              console.log("Trying to use fallback AI service...");
              try {
                // Generate a simple mock response instead of calling OpenAI
                return this.createMockResponse(prompt, projectName);
              } catch (fallbackError) {
                console.error("Fallback also failed:", fallbackError);
                // Continue with normal error flow
                throw new Error("AI service is temporarily unavailable due to high demand. Please try again in a few minutes with a simpler prompt.");
              }
            } else {
              throw new Error("Failed to generate app: " + (error.message || "Unknown error"));
            }
          }
        }
      }
      
      // If we exhausted all retries, throw the last error with detailed message
      if (lastError && lastError.message && (lastError.message.includes('429') || lastError.message.includes('quota') || lastError.message.includes('access'))) {
        throw new Error("AI service is temporarily unavailable due to rate limits or access issues. Please try again in a few minutes with a simpler prompt.");
      }
      
      throw lastError || new Error("Failed to initialize project after multiple attempts");
    } catch (error: any) {
      this.lastError = error;
      throw error; // Re-throw to let caller handle
    }
  }
  
  /**
   * Try to use OpenAI as a fallback if available
   */
  private async fallbackToOpenAI(prompt: string, projectName: string) {
    // Get OpenAI key from environment
    const { data: openAIData, error: openAIError } = await supabase.functions.invoke('get-env', {
      body: { key: 'OPENAI_API_KEY' }
    });
    
    if (openAIError || !openAIData?.value) {
      throw new Error("Fallback AI service not available");
    }
    
    console.log("Using OpenAI fallback service");
    
    // Call a fallback function that uses OpenAI instead
    const { data, error } = await supabase.functions.invoke('generate-app-fallback', {
      body: { 
        prompt: prompt,
        projectName: projectName 
      }
    });
    
    if (error) {
      throw new Error(`Fallback error: ${error.message}`);
    }
    
    if (!data) {
      throw new Error("Empty response from fallback service");
    }
    
    return {
      projectId: data.projectId,
      projectContext: {
        projectName: data.projectName,
        description: data.description,
        files: data.files,
        challenges: data.challenges || []
      },
      assistantMessage: data.explanation || "App generated successfully with fallback service.",
      initialCode: data.files?.length > 0 ? data.files[0].content : "",
      appData: data
    };
  }
}

export const geminiAIService = new GeminiAIService();
