
export interface ImplementationStep {
  id: string;
  name: string;
  description: string;
  type?: string;
  difficulty?: string;
  filePaths?: string[];
  prerequisites?: string[];
  expectedOutcome?: string;
  hints?: string[];
}

export class StructuredAIGuide {
  private projectName: string;
  private description: string;
  private steps: ImplementationStep[];
  private currentStep: ImplementationStep | null;
  private stepProgress: Record<string, any>;

  constructor(projectData: any) {
    this.projectName = projectData.projectName || projectData.name || "Project";
    this.description = projectData.description || "A coding project";
    this.steps = projectData.challenges?.map((challenge: any) => this._convertChallengeToStep(challenge)) || [];
    this.currentStep = null;
    this.stepProgress = {};
    
    // Initialize step progress
    this.steps.forEach(step => {
      this.stepProgress[step.id] = {
        status: 'not_started',
        completionTime: null
      };
    });
  }
  
  private _convertChallengeToStep(challenge: any): ImplementationStep {
    return {
      id: challenge.id || `step-${Math.random().toString(36).substr(2, 9)}`,
      name: challenge.featureName || challenge.title || "Implementation Step",
      description: challenge.description || "Implement this feature",
      type: this._mapChallengeType(challenge.type),
      difficulty: challenge.difficulty || "intermediate",
      filePaths: challenge.filesPaths || [],
      prerequisites: challenge.prerequisites || [],
      expectedOutcome: challenge.expectedOutcome || `A working implementation of ${challenge.featureName || challenge.title}`,
      hints: challenge.hints || []
    };
  }
  
  private _mapChallengeType(type: string): string {
    if (!type) return "implementation";
    
    switch (type.toLowerCase()) {
      case "frontend":
      case "ui":
        return "frontend";
      case "backend":
      case "api":
        return "backend";
      case "integration":
        return "integration";
      case "testing":
        return "testing";
      default:
        return type;
    }
  }
  
  // Get all steps for the project
  getSteps(): ImplementationStep[] {
    return this.steps;
  }
  
  // Select a step to work on
  selectStep(stepId: string): ImplementationStep | null {
    const step = this.steps.find(s => s.id === stepId);
    
    if (step) {
      this.currentStep = step;
      
      if (this.stepProgress[stepId].status === 'not_started') {
        this.stepProgress[stepId].status = 'in_progress';
      }
      
      return step;
    }
    
    return null;
  }
  
  // Mark a step as complete
  completeStep(stepId: string): boolean {
    if (this.stepProgress[stepId]) {
      this.stepProgress[stepId].status = 'completed';
      this.stepProgress[stepId].completionTime = new Date().toISOString();
      return true;
    }
    
    return false;
  }
  
  // Get current step
  getCurrentStep(): ImplementationStep | null {
    return this.currentStep;
  }
  
  // Get progress information
  getStepProgress(): Record<string, any> {
    return this.stepProgress;
  }
  
  // Get project overview
  getProjectOverview(): string {
    const completedSteps = Object.values(this.stepProgress).filter(p => p.status === 'completed').length;
    
    return `
# ${this.projectName}

${this.description}

Progress: ${completedSteps}/${this.steps.length} steps completed

## Remaining Steps:
${this.steps
  .filter(step => this.stepProgress[step.id].status !== 'completed')
  .map(step => `- ${step.name}: ${step.description}`)
  .join('\n')}
`;
  }
  
  // Handle user message and provide guidance
  processUserMessage(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Check for progress inquiry
    if (lowerMessage.includes('progress') || 
        lowerMessage.includes('steps left') || 
        lowerMessage.includes('remaining') || 
        lowerMessage.includes('overview')) {
      return this.getProjectOverview();
    }
    
    // If we have a current step, provide guidance for that step
    if (this.currentStep) {
      return this.getStepGuidance(this.currentStep.id);
    }
    
    // Default response if no specific context
    return `I'm ready to help you implement features for ${this.projectName}. Please select a step to work on, and I'll provide specific guidance.`;
  }
  
  // Get detailed guidance for a specific step
  getStepGuidance(stepId: string): string {
    const step = this.steps.find(s => s.id === stepId);
    
    if (!step) {
      return "I couldn't find that step. Please select a valid step to work on.";
    }
    
    let guidance = `## Let's implement: ${step.name}
    
${step.description}

**Difficulty:** ${step.difficulty}
**Type:** ${step.type}
`;

    if (step.filePaths && step.filePaths.length > 0) {
      guidance += `\n**Files to work with:** ${step.filePaths.join(', ')}\n`;
    }

    if (step.hints && step.hints.length > 0) {
      guidance += `\n**Hints:**\n${step.hints.map((hint, i) => `${i+1}. ${hint}`).join('\n')}\n`;
    }
    
    // Add specific implementation guidance based on step type
    switch (step.type) {
      case 'frontend':
        guidance += `
### Implementation Steps:
1. Create the UI components needed
2. Add styling using Tailwind CSS
3. Implement any required event handlers
4. Connect the component to any data sources if needed
`;
        break;
      case 'backend':
        guidance += `
### Implementation Steps:
1. Design the API endpoints needed
2. Implement the server-side logic
3. Set up proper error handling
4. Test the endpoints with sample requests
`;
        break;
      case 'integration':
        guidance += `
### Implementation Steps:
1. Make sure both frontend and backend pieces are working individually
2. Connect the frontend to the backend API
3. Handle loading states and errors properly
4. Test the full flow end-to-end
`;
        break;
    }
    
    guidance += `\nLet me know when you're ready to start coding, or if you need more specific help with any part of the implementation!`;
    
    return guidance;
  }
}
