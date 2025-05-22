
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PlannerAgent } from './PlannerAgent';
import { UIAgent } from './UIAgent';
import { APIAgent } from './APIAgent';
import { DatabaseAgent } from './DatabaseAgent';
import { AuthAgent } from './AuthAgent';
import { IntegrationAgent } from './IntegrationAgent';
import { DeploymentAgent } from './DeploymentAgent';

type MemoryItem = {
  type: string;
  data: any;
  timestamp: string;
  step: number;
};

export class AgentOrchestrator {
  private genAI: any;
  private model: any;
  private agents: Record<string, any>;
  private currentStep: number;
  private pipeline: any[];
  private context: Record<string, any>;
  private memory: MemoryItem[];

  constructor(geminiApiKey: string) {
    this.genAI = new GoogleGenerativeAI(geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Agent definitions with specialized roles
    this.agents = {
      planner: new PlannerAgent(this.model),
      ui: new UIAgent(this.model),
      api: new APIAgent(this.model),
      database: new DatabaseAgent(this.model),
      auth: new AuthAgent(this.model),
      integration: new IntegrationAgent(this.model),
      deployment: new DeploymentAgent(this.model)
    };
    
    // Orchestration state
    this.currentStep = 0;
    this.pipeline = [];
    this.context = {};
    this.memory = [];
  }

  // Initialize the orchestration pipeline based on project requirements
  async initializeOrchestration(projectSpecification: string, projectName: string) {
    console.log('🎯 Initializing Agent Orchestration...');
    
    // Step 1: Planner Agent analyzes and creates execution plan
    const plannerResult = await this.agents.planner.createExecutionPlan(
      projectSpecification, 
      projectName
    );
    
    this.pipeline = plannerResult.pipeline;
    this.context = plannerResult.context;
    this.currentStep = 0;
    
    // Add to memory
    this.addToMemory('orchestration_initialized', {
      specification: projectSpecification,
      projectName,
      pipeline: this.pipeline,
      context: this.context
    });
    
    return {
      orchestrationPlan: plannerResult,
      currentStep: this.getCurrentStepInfo(),
      totalSteps: this.pipeline.length
    };
  }

  // Execute the next step in the pipeline
  async executeNextStep(userCode = '', userMessage = '') {
    if (this.currentStep >= this.pipeline.length) {
      return {
        completed: true,
        message: '🎉 Congratulations! You have completed all steps of your project!',
        summary: this.generateProjectSummary()
      };
    }
    
    const currentStepInfo = this.pipeline[this.currentStep];
    const agentType = currentStepInfo.agent;
    const agent = this.agents[agentType];
    
    if (!agent) {
      throw new Error(`Agent type ${agentType} not found`);
    }
    
    console.log(`🤖 Executing Step ${this.currentStep + 1}/${this.pipeline.length}: ${currentStepInfo.name}`);
    
    // Execute the step with the appropriate agent
    const stepResult = await agent.executeStep(
      currentStepInfo,
      this.context,
      this.memory,
      userCode,
      userMessage
    );
    
    // Update context and memory with results
    this.context = { ...this.context, ...stepResult.contextUpdate };
    this.addToMemory(`step_${this.currentStep}_completed`, stepResult);
    
    // Move to next step if current step is completed
    if (stepResult.stepCompleted) {
      this.currentStep++;
    }
    
    return {
      completed: this.currentStep >= this.pipeline.length,
      stepResult,
      currentStep: this.getCurrentStepInfo(),
      nextStep: this.getNextStepInfo(),
      progress: {
        current: this.currentStep + 1,
        total: this.pipeline.length,
        percentage: Math.round(((this.currentStep + 1) / this.pipeline.length) * 100)
      }
    };
  }

  // Get current step information
  getCurrentStepInfo() {
    if (this.currentStep >= this.pipeline.length) return null;
    return {
      ...this.pipeline[this.currentStep],
      stepNumber: this.currentStep + 1,
      totalSteps: this.pipeline.length
    };
  }

  // Get next step information
  getNextStepInfo() {
    if (this.currentStep + 1 >= this.pipeline.length) return null;
    return {
      ...this.pipeline[this.currentStep + 1],
      stepNumber: this.currentStep + 2,
      totalSteps: this.pipeline.length
    };
  }

  // Add entry to memory for context awareness
  addToMemory(type: string, data: any) {
    this.memory.push({
      type,
      data,
      timestamp: new Date().toISOString(),
      step: this.currentStep
    });
  }

  // Generate project summary
  generateProjectSummary() {
    return {
      projectName: this.context.projectName,
      completedSteps: this.currentStep,
      totalSteps: this.pipeline.length,
      features: this.context.features || [],
      techStack: this.context.techStack || {},
      nextRecommendations: this.context.nextRecommendations || []
    };
  }

  // Reset orchestration
  reset() {
    this.currentStep = 0;
    this.pipeline = [];
    this.context = {};
    this.memory = [];
  }

  // Get the full orchestration state (for saving/restoring)
  getState() {
    return {
      currentStep: this.currentStep,
      pipeline: this.pipeline,
      context: this.context,
      memory: this.memory
    };
  }

  // Restore orchestration from a saved state
  restoreState(state: any) {
    this.currentStep = state.currentStep;
    this.pipeline = state.pipeline;
    this.context = state.context;
    this.memory = state.memory;
  }
}
