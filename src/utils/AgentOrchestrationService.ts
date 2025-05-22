
import { supabase } from "@/integrations/supabase/client";
import { AgentOrchestrator } from "./agents/AgentOrchestrator";
import { v4 as uuidv4 } from 'uuid';

export class AgentOrchestrationService {
  private apiKey: string | null = null;
  private orchestrator: AgentOrchestrator | null = null;
  private projectStates: Map<string, any> = new Map();

  constructor() {
    console.log("AgentOrchestrationService initialized");
  }

  // Set the API key and initialize orchestrator
  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    this.orchestrator = new AgentOrchestrator(apiKey);
  }

  // Initialize a new project with orchestration
  async initializeProject(prompt: string, projectName: string) {
    console.log(`Initializing project with orchestration: ${prompt.substring(0, 50)}...`);
    
    if (!this.apiKey || !this.orchestrator) {
      // Try to get API key from Supabase environment
      try {
        const { data, error } = await supabase.functions.invoke('get-env', {
          body: { key: 'GEMINI_API_KEY' }
        });
        
        if (error || !data?.value) {
          console.error("Failed to get Gemini API key from environment");
          throw new Error("Gemini API key not configured. Please contact support.");
        }
        
        this.setApiKey(data.value);
      } catch (error) {
        console.error("Error retrieving Gemini API key:", error);
        throw new Error("Failed to access Agent Orchestration service. Please try again later.");
      }
    }
    
    try {
      // Use the edge function to initialize the orchestration
      const { data, error } = await supabase.functions.invoke('agent-orchestration', {
        body: { 
          action: 'initialize',
          specification: prompt,
          projectName: projectName 
        }
      });
      
      if (error) {
        console.error(`Error from agent-orchestration function:`, error);
        throw new Error(`Error from agent-orchestration function: ${error.message || "Unknown error"}`);
      }
      
      if (!data) {
        throw new Error("Empty response from agent-orchestration function");
      }
      
      // Generate a project ID
      const projectId = uuidv4();
      
      // Store the orchestration state
      this.projectStates.set(projectId, data.state);
      
      // Create initial assistant message
      const assistantMessage = this.createInitialAssistantMessage(
        data.orchestrationPlan, 
        data.currentStep
      );
      
      return {
        projectId,
        orchestrationPlan: data.orchestrationPlan,
        currentStep: data.currentStep,
        assistantMessage,
        orchestrationEnabled: true // Always true now, no toggle needed
      };
    } catch (error: any) {
      console.error('Error initializing project with orchestration:', error);
      throw new Error(`Failed to initialize project with orchestration: ${error.message || "Unknown error"}`);
    }
  }
  
  // Create initial assistant message
  private createInitialAssistantMessage(orchestrationPlan: any, currentStep: any): string {
    return `
🎯 **${orchestrationPlan.projectName} - Agent Orchestration Initialized**

I've broken down your project into ${orchestrationPlan.pipeline.length} manageable steps using specialized AI agents:

**Current Step (${currentStep.stepNumber}/${currentStep.totalSteps}):** ${currentStep.name}
**Agent:** ${currentStep.agent.toUpperCase()} Agent
**Goal:** ${currentStep.description}

**What you need to do:**
${currentStep.userGuidance || "Follow the step-by-step guidance from the specialized AI agents."}

**Deliverables for this step:**
${currentStep.deliverables?.map((item: string, idx: number) => `${idx + 1}. ${item}`).join('\n') || "Implementation of the current step's requirements."}

I've provided this breakdown to help make the development process more manageable. Each step will be guided by a specialized AI agent that's an expert in that particular domain.

The UI above shows your progress through the project pipeline. Let me know when you're ready to proceed with the first step!
    `;
  }

  // Execute next step in the orchestration process
  async executeNextStep(projectId: string, userCode: string = '', userMessage: string = '') {
    // Implementation would interact with the Supabase function
    // This is a placeholder for the functionality
    return {
      assistantMessage: "Next step response would appear here",
      currentStep: { stepNumber: 1, totalSteps: 5 },
      progress: 20,
      completed: false
    };
  }
}

// Create singleton instance
export const agentOrchestrationService = new AgentOrchestrationService();
