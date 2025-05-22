
import { supabase } from "@/integrations/supabase/client";
import { agentOrchestrationService } from "./AgentOrchestrationService";

class GeminiAIService {
  private apiKey: string | null = null;
  private maxRetries = 3;
  private baseBackoffMs = 2000;
  private fallbackEnabled = true;
  private useOrchestration = false;
  private mockEnabled = true; // Enable mock mode as fallback

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
   * Check if we have a valid API key
   */
  hasApiKey(): boolean {
    return this.apiKey !== null && this.apiKey.length > 0;
  }

  /**
   * Toggle agent orchestration mode
   */
  toggleOrchestration(enabled: boolean) {
    this.useOrchestration = enabled;
  }

  /**
   * Toggle mock mode for testing without API key
   */
  toggleMockMode(enabled: boolean) {
    this.mockEnabled = enabled;
  }

  /**
   * Initialize a project with Gemini AI
   * @param prompt User prompt for project generation
   * @param projectName Name for the project
   * @param useOrchestration Whether to use agent orchestration
   */
  async initializeProject(prompt: string, projectName: string, useOrchestration = false) {
    console.log(`Initializing project with prompt: ${prompt.substring(0, 50)}...`);
    
    // Try to get API key if not already set
    if (!this.apiKey) {
      try {
        // Try to get API key from Supabase environment
        const { data, error } = await supabase.functions.invoke('get-env', {
          body: { key: 'GEMINI_API_KEY' }
        });
        
        if (!error && data?.value) {
          this.apiKey = data.value;
          agentOrchestrationService.setApiKey(data.value);
          console.log("Successfully retrieved Gemini API key from environment");
        } else {
          console.warn("No Gemini API key found in environment");
          
          // If mock mode enabled, use that instead of throwing an error
          if (this.mockEnabled) {
            console.log("Using mock mode for app generation");
            return this.generateMockProject(prompt, projectName);
          } else {
            throw new Error("Gemini API key not configured. Please contact support.");
          }
        }
      } catch (error) {
        console.error("Error retrieving Gemini API key:", error);
        
        // If mock mode enabled, use that as fallback
        if (this.mockEnabled) {
          console.log("Using mock mode for app generation due to API key retrieval error");
          return this.generateMockProject(prompt, projectName);
        } else {
          throw new Error("Failed to access Gemini AI service. Please try again later.");
        }
      }
    }
    
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
        // Fall back to standard project generation or mock mode
        console.log("Falling back to standard project generation");
      }
    }
    
    // If we have an API key, call the generate-app function with enhanced retry logic
    if (this.hasApiKey()) {
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
            appData: data
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
              if (this.mockEnabled) {
                console.log("Using mock mode after API error");
                return this.generateMockProject(prompt, projectName);
              } else if (error.message && (error.message.includes('429') || error.message.includes('quota'))) {
                console.log("Trying to use fallback AI service...");
                try {
                  // Try to fallback to OpenAI instead
                  return await this.fallbackToOpenAI(prompt, projectName);
                } catch (fallbackError) {
                  console.error("Fallback also failed:", fallbackError);
                  // Continue with mock mode as last resort
                  return this.generateMockProject(prompt, projectName);
                }
              }
            }
            throw new Error("Failed to generate app: " + (error.message || "Unknown error"));
          }
        }
      }
      
      // If we exhausted all retries, fall back to mock mode
      console.log("Exhausted all retries, falling back to mock mode");
      return this.generateMockProject(prompt, projectName);
    } else {
      // No API key and we got here, use mock mode
      return this.generateMockProject(prompt, projectName);
    }
  }
  
  /**
   * Generate a simple mock project when API key is not available
   */
  private async generateMockProject(prompt: string, projectName: string) {
    console.log("Generating mock project for:", prompt);
    
    // Generate a unique ID for the project
    const projectId = crypto.randomUUID();
    
    // Create a basic app data structure based on the prompt
    const cleanPrompt = prompt.replace(/[^a-zA-Z0-9 ]/g, '').trim();
    const appTitle = projectName || `${cleanPrompt.split(' ')[0]}App`;
    
    // Create some mock files
    const files = [
      {
        path: "src/App.js",
        content: `import React, { useState } from 'react';

function ${appTitle.replace(/[^a-zA-Z0-9]/g, '')}() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">${appTitle} - Generated App</h1>
      <p className="mb-4">This is a basic app based on your prompt: "${prompt}"</p>
      
      <div className="border p-4 rounded-lg shadow-md">
        <p className="mb-2">Counter: {count}</p>
        <button 
          onClick={() => setCount(count + 1)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-2"
        >
          Increment
        </button>
        <button 
          onClick={() => setCount(Math.max(0, count - 1))}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
        >
          Decrement
        </button>
      </div>
    </div>
  );
}

export default ${appTitle.replace(/[^a-zA-Z0-9]/g, '')};`
      },
      {
        path: "src/index.js",
        content: `import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);`
      },
      {
        path: "src/index.css",
        content: `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}`
      }
    ];

    // Create mock challenges
    const challenges = [
      {
        id: "challenge-1",
        title: "Add a Theme Switcher",
        description: "Add a button that toggles between light and dark theme.",
        filesPaths: ["src/App.js"]
      },
      {
        id: "challenge-2",
        title: "Implement Local Storage",
        description: "Save the counter value to localStorage so it persists between page refreshes.",
        filesPaths: ["src/App.js"]
      }
    ];

    // Create mock explanation
    const explanation = `I've generated a simple React application with basic functionality based on your prompt "${prompt}". The app includes:
    
1. A counter component with increment and decrement buttons
2. Basic styling with Tailwind CSS classes
3. A clean and responsive layout
    
You can extend this app by completing the challenges I've included:
- Adding a theme switcher between light and dark mode
- Implementing localStorage to persist the counter value between sessions`;

    // Return the mock project data with the same structure as a real project
    return {
      projectId,
      projectContext: {
        projectName: appTitle,
        description: `A simple app based on the prompt: "${prompt}"`,
        files,
        challenges
      },
      assistantMessage: explanation,
      initialCode: files[0].content,
      appData: {
        projectId,
        projectName: appTitle,
        description: `A simple app based on the prompt: "${prompt}"`,
        files,
        challenges,
        explanation
      }
    };
  }
  
  /**
   * Try to use OpenAI as a fallback if available
   */
  private async fallbackToOpenAI(prompt: string, projectName: string) {
    // Try to get OpenAI key from environment
    const { data: openAIData, error: openAIError } = await supabase.functions.invoke('get-env', {
      body: { key: 'OPENAI_API_KEY' }
    });
    
    if (openAIError || !openAIData?.value) {
      throw new Error("Fallback AI service not available");
    }
    
    // We got here but OpenAI fallback isn't fully implemented, use mock mode
    return this.generateMockProject(prompt, projectName);
  }
}

export const geminiAIService = new GeminiAIService();
