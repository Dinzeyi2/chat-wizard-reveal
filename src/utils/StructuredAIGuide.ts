
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
    
    // Automatically set dependencies if not explicitly defined
    this._setupImplicitDependencies();
  }
  
  // Add a method to set up implicit dependencies based on step order
  private _setupImplicitDependencies() {
    // If explicit dependencies are not defined, assume sequential dependencies
    for (let i = 1; i < this.steps.length; i++) {
      const currentStep = this.steps[i];
      
      // If no prerequisites are defined yet, create the array
      if (!currentStep.prerequisites) {
        currentStep.prerequisites = [];
      }
      
      // If this step has no prerequisites yet, make it depend on the previous step
      if (currentStep.prerequisites.length === 0) {
        const previousStep = this.steps[i-1];
        if (previousStep) {
          currentStep.prerequisites.push(previousStep.id);
        }
      }
    }
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
  
  // Get challenge steps method that's being called in AppGeneratorDisplay.tsx
  getChallengeSteps(): ImplementationStep[] {
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
  
  // Enhanced auto-selection of next logical step for the user
  autoSelectNextStep(): ImplementationStep | null {
    // First try to find a step that's already in progress
    const inProgressStep = this.steps.find(
      step => this.stepProgress[step.id].status === 'in_progress'
    );
    
    if (inProgressStep) {
      this.currentStep = inProgressStep;
      return inProgressStep;
    }
    
    // Next, find the earliest step in the sequence that's not completed and has all prerequisites met
    for (const step of this.steps) {
      const stepInfo = this.stepProgress[step.id];
      
      if (stepInfo.status === 'not_started') {
        // Check prerequisites
        if (!step.prerequisites || step.prerequisites.length === 0) {
          // No prerequisites, this step can be started
          this.currentStep = step;
          this.stepProgress[step.id].status = 'in_progress';
          return step;
        }
        
        // Check if all prerequisites are completed
        const allPrerequisitesMet = step.prerequisites.every(prereqId => {
          return this.stepProgress[prereqId]?.status === 'completed';
        });
        
        if (allPrerequisitesMet) {
          // All prerequisites are met, this step can be started
          this.currentStep = step;
          this.stepProgress[step.id].status = 'in_progress';
          return step;
        }
      }
    }
    
    // If we get here, there are no steps that can be started right now
    // Let's check if there are any steps remaining that aren't completed
    const nonCompletedStep = this.steps.find(
      step => this.stepProgress[step.id].status !== 'completed'
    );
    
    // If there's a non-completed step with blocking prerequisites,
    // we should suggest it anyway with a warning
    if (nonCompletedStep) {
      console.log("Warning: Starting step with incomplete prerequisites:", nonCompletedStep.name);
      this.currentStep = nonCompletedStep;
      this.stepProgress[nonCompletedStep.id].status = 'in_progress';
      return nonCompletedStep;
    }
    
    // No steps remaining
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
  
  // Generate first task message for AI to send to user
  generateFirstTaskMessage(): string {
    const step = this.currentStep || this.autoSelectNextStep();
    
    if (!step) {
      return "All tasks have been completed! Great job on finishing the project!";
    }
    
    let message = `# Let's start building: ${this.projectName}\n\n`;
    message += `I'll be guiding you through implementing this project step by step.\n\n`;
    message += `## Your first task: ${step.name}\n\n`;
    message += `${step.description}\n\n`;
    
    if (step.difficulty) {
      message += `**Difficulty:** ${step.difficulty}\n`;
    }
    
    if (step.type) {
      message += `**Type:** ${step.type}\n`;
    }
    
    if (step.filePaths && step.filePaths.length > 0) {
      message += `\n**Files to work with:** ${step.filePaths.join(', ')}\n`;
    }
    
    message += `\n**Expected outcome:** ${step.expectedOutcome}\n\n`;
    
    if (step.hints && step.hints.length > 0) {
      message += `**Hints to help you:**\n`;
      step.hints.forEach((hint, index) => {
        message += `${index + 1}. ${hint}\n`;
      });
      message += '\n';
    }
    
    message += `When you've completed this task, let me know and I'll check your implementation and provide guidance for the next step.`;
    
    return message;
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
    
    // Check if user is indicating task completion
    if (lowerMessage.includes('done') ||
        lowerMessage.includes('completed') ||
        lowerMessage.includes('finished') ||
        (lowerMessage.includes('next') && lowerMessage.includes('task'))) {
      
      // Mark current step as complete if there is one
      if (this.currentStep) {
        this.completeStep(this.currentStep.id);
        
        // Select next task
        const nextStep = this.autoSelectNextStep();
        
        if (nextStep) {
          return `Great job completing the previous task!\n\n**Next task: ${nextStep.name}**\n\n${this.getStepGuidance(nextStep.id)}`;
        } else {
          return "Congratulations! You've completed all the tasks for this project!";
        }
      }
    }
    
    // If we have a current step, provide guidance for that step
    if (this.currentStep) {
      return this.getStepGuidance(this.currentStep.id);
    }
    
    // Default response if no specific context
    const nextStep = this.autoSelectNextStep();
    if (nextStep) {
      return `Let me help you implement features for ${this.projectName}. I've selected the first task for you: ${nextStep.name}\n\n${this.getStepGuidance(nextStep.id)}`;
    } else {
      return `I'm ready to help you with ${this.projectName}, but there don't seem to be any tasks defined. Let's discuss what you'd like to implement next.`;
    }
  }
  
  // Get detailed guidance for a specific step
  getStepGuidance(stepId: string): string {
    const step = this.steps.find(s => s.id === stepId);
    
    if (!step) {
      return "I couldn't find that step. Let me select another task for you to work on.";
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
    
    guidance += `\nI'm here to help if you have any questions. Just let me know when you're done with this task, and I'll check your implementation and provide guidance for the next step.`;
    
    return guidance;
  }
}
