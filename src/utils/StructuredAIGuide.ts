export interface Challenge {
  id: string;
  title: string;
  description: string;
  featureName: string;
  difficulty: string;
  type: string;
  filesPaths: string[];
  completed: boolean;
  hints: string[];
}

export interface ImplementationStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  challengeId: string;
  filesPaths: string[];
  concepts?: string[];
  expectedDuration?: string;
  taskInstructions?: string;
  codeExample?: string;
}

export interface ProjectData {
  name: string;
  description: string;
  stack: string;
  challenges: Challenge[];
  projectName?: string;
}

export interface ConversationMessage {
  type: 'user' | 'guide' | 'codeSnippet';
  content: string;
  challengeId: string;
}

export class StructuredAIGuide {
  private project: ProjectData;
  private currentChallengeIndex: number;
  private conversationHistory: ConversationMessage[];
  private implementationSteps: ImplementationStep[];
  private currentStepIndex: number;
  
  constructor(projectData: ProjectData) {
    this.project = projectData;
    this.currentChallengeIndex = 0;
    this.conversationHistory = [];
    
    // Generate implementation steps for all challenges
    this.implementationSteps = this._generateImplementationSteps();
    this.currentStepIndex = 0;
  }
  
  /**
   * Generate implementation steps for all challenges
   */
  private _generateImplementationSteps(): ImplementationStep[] {
    const allSteps: ImplementationStep[] = [];
    
    this.project.challenges.forEach(challenge => {
      // Generate 3-5 steps for each challenge based on its type
      const stepsForChallenge = this._generateStepsForChallenge(challenge);
      allSteps.push(...stepsForChallenge);
    });
    
    return allSteps;
  }
  
  /**
   * Generate steps for a specific challenge
   */
  private _generateStepsForChallenge(challenge: Challenge): ImplementationStep[] {
    const steps: ImplementationStep[] = [];
    const baseId = challenge.id;
    
    // Common step patterns based on challenge type
    if (challenge.type === 'implementation') {
      steps.push(
        {
          id: `${baseId}-step-1`,
          title: `Understand the ${challenge.featureName} Requirements`,
          description: `Analyze what functionality the ${challenge.featureName} feature needs to provide and its user interactions.`,
          completed: false,
          challengeId: challenge.id,
          filesPaths: challenge.filesPaths,
          concepts: ["Requirements Analysis", "Feature Planning"],
          expectedDuration: "10-15 minutes",
          taskInstructions: `Review the code and documentation for the ${challenge.featureName} feature. Identify what functionality is missing and what user interactions need to be implemented.`
        },
        {
          id: `${baseId}-step-2`,
          title: `Build the ${challenge.featureName} UI Components`,
          description: `Create the necessary React components for the ${challenge.featureName} feature.`,
          completed: false,
          challengeId: challenge.id,
          filesPaths: challenge.filesPaths.filter(path => path.includes('components') || path.includes('.tsx')),
          concepts: ["React Components", "JSX", "Tailwind CSS Styling"],
          expectedDuration: "20-30 minutes",
          taskInstructions: `Implement the UI components needed for the ${challenge.featureName} feature. Make sure to create any necessary inputs, buttons, and layout elements.`
        },
        {
          id: `${baseId}-step-3`,
          title: `Implement ${challenge.featureName} Logic`,
          description: `Add the necessary state management and business logic for the ${challenge.featureName} feature.`,
          completed: false,
          challengeId: challenge.id,
          filesPaths: challenge.filesPaths,
          concepts: ["React Hooks", "State Management", "Event Handling"],
          expectedDuration: "25-35 minutes",
          taskInstructions: `Implement the business logic for the ${challenge.featureName} feature. This includes state management, event handlers, and any necessary data processing.`
        },
        {
          id: `${baseId}-step-4`,
          title: `Test and Refine ${challenge.featureName}`,
          description: `Test the ${challenge.featureName} feature, fix any bugs, and refine the implementation.`,
          completed: false,
          challengeId: challenge.id,
          filesPaths: challenge.filesPaths,
          concepts: ["Debugging", "Testing", "Code Refinement"],
          expectedDuration: "15-20 minutes",
          taskInstructions: `Test the ${challenge.featureName} feature thoroughly. Identify and fix any bugs or issues. Refine the implementation to improve performance, user experience, and code quality.`
        }
      );
    } else if (challenge.type === 'bugfix') {
      steps.push(
        {
          id: `${baseId}-step-1`,
          title: `Identify the Bug in ${challenge.featureName}`,
          description: `Locate and understand the bug in the ${challenge.featureName} feature.`,
          completed: false,
          challengeId: challenge.id,
          filesPaths: challenge.filesPaths,
          concepts: ["Debugging", "Error Identification"],
          expectedDuration: "10-15 minutes",
          taskInstructions: `Review the code for the ${challenge.featureName} feature. Look for any error messages, unexpected behavior, or logical issues. Use console.log statements or the browser developer tools to help identify the problem.`
        },
        {
          id: `${baseId}-step-2`,
          title: `Fix the Bug in ${challenge.featureName}`,
          description: `Implement a solution to fix the bug in the ${challenge.featureName} feature.`,
          completed: false,
          challengeId: challenge.id,
          filesPaths: challenge.filesPaths,
          concepts: ["Debugging", "Error Resolution", "Code Correction"],
          expectedDuration: "15-25 minutes",
          taskInstructions: `Implement a solution to fix the identified bug. Make sure to test your solution thoroughly to ensure it resolves the issue without creating new problems.`
        },
        {
          id: `${baseId}-step-3`,
          title: `Test and Verify ${challenge.featureName} Fix`,
          description: `Test the ${challenge.featureName} feature to ensure the bug is fixed.`,
          completed: false,
          challengeId: challenge.id,
          filesPaths: challenge.filesPaths,
          concepts: ["Testing", "Verification", "Quality Assurance"],
          expectedDuration: "10-15 minutes",
          taskInstructions: `Test the ${challenge.featureName} feature thoroughly to verify that the bug is fixed. Check for any regressions or new issues that may have been introduced by your fix.`
        }
      );
    } else if (challenge.type === 'feature') {
      steps.push(
        {
          id: `${baseId}-step-1`,
          title: `Plan ${challenge.featureName} Feature`,
          description: `Plan the implementation of the ${challenge.featureName} feature.`,
          completed: false,
          challengeId: challenge.id,
          filesPaths: challenge.filesPaths,
          concepts: ["Feature Planning", "Design", "Architecture"],
          expectedDuration: "15-20 minutes",
          taskInstructions: `Plan how you will implement the ${challenge.featureName} feature. Consider what components you'll need, what state management will be required, and how the feature will integrate with the rest of the application.`
        },
        {
          id: `${baseId}-step-2`,
          title: `Implement ${challenge.featureName} UI`,
          description: `Create the user interface for the ${challenge.featureName} feature.`,
          completed: false,
          challengeId: challenge.id,
          filesPaths: challenge.filesPaths.filter(path => path.includes('components') || path.includes('.tsx')),
          concepts: ["React Components", "JSX", "Tailwind CSS Styling"],
          expectedDuration: "20-30 minutes",
          taskInstructions: `Implement the UI components for the ${challenge.featureName} feature. Focus on creating a clean, intuitive interface that aligns with the rest of the application's design.`
        },
        {
          id: `${baseId}-step-3`,
          title: `Add ${challenge.featureName} Functionality`,
          description: `Implement the core functionality for the ${challenge.featureName} feature.`,
          completed: false,
          challengeId: challenge.id,
          filesPaths: challenge.filesPaths,
          concepts: ["React Hooks", "State Management", "API Integration"],
          expectedDuration: "25-35 minutes",
          taskInstructions: `Implement the core functionality for the ${challenge.featureName} feature. This includes state management, event handlers, API calls, and any necessary data processing.`
        },
        {
          id: `${baseId}-step-4`,
          title: `Test and Optimize ${challenge.featureName}`,
          description: `Test the ${challenge.featureName} feature and optimize its performance.`,
          completed: false,
          challengeId: challenge.id,
          filesPaths: challenge.filesPaths,
          concepts: ["Testing", "Performance Optimization", "Refinement"],
          expectedDuration: "15-25 minutes",
          taskInstructions: `Test the ${challenge.featureName} feature thoroughly. Optimize its performance and make any necessary refinements to improve the user experience.`
        },
        {
          id: `${baseId}-step-5`,
          title: `Document ${challenge.featureName} Feature`,
          description: `Document how the ${challenge.featureName} feature works.`,
          completed: false,
          challengeId: challenge.id,
          filesPaths: challenge.filesPaths,
          concepts: ["Documentation", "Code Comments"],
          expectedDuration: "10-15 minutes",
          taskInstructions: `Add comments to your code explaining how the ${challenge.featureName} feature works. Consider adding a brief documentation section in the README or a separate documentation file.`
        }
      );
    }
    
    // Default steps if none were added based on type
    if (steps.length === 0) {
      steps.push(
        {
          id: `${baseId}-step-1`,
          title: `Understand the ${challenge.featureName} Challenge`,
          description: `Analyze what needs to be done for the ${challenge.featureName} challenge.`,
          completed: false,
          challengeId: challenge.id,
          filesPaths: challenge.filesPaths,
          concepts: ["Analysis", "Planning"],
          expectedDuration: "10-15 minutes",
          taskInstructions: `Review the code and understand what needs to be done for the ${challenge.featureName} challenge.`
        },
        {
          id: `${baseId}-step-2`,
          title: `Implement ${challenge.featureName} Solution`,
          description: `Implement a solution for the ${challenge.featureName} challenge.`,
          completed: false,
          challengeId: challenge.id,
          filesPaths: challenge.filesPaths,
          concepts: ["Implementation", "Coding", "Problem Solving"],
          expectedDuration: "20-30 minutes",
          taskInstructions: `Implement your solution for the ${challenge.featureName} challenge. Be sure to test it thoroughly.`
        },
        {
          id: `${baseId}-step-3`,
          title: `Review and Refine ${challenge.featureName}`,
          description: `Review your solution for the ${challenge.featureName} challenge and refine it.`,
          completed: false,
          challengeId: challenge.id,
          filesPaths: challenge.filesPaths,
          concepts: ["Code Review", "Refinement"],
          expectedDuration: "15-20 minutes",
          taskInstructions: `Review your solution for the ${challenge.featureName} challenge. Look for ways to improve it, such as optimizing performance, enhancing readability, or adding additional features.`
        }
      );
    }
    
    return steps;
  }
  
  /**
   * Get all implementation steps
   */
  getImplementationSteps(): ImplementationStep[] {
    return this.implementationSteps;
  }
  
  /**
   * Get steps for a specific challenge
   */
  getStepsForChallenge(challengeId: string): ImplementationStep[] {
    return this.implementationSteps.filter(step => step.challengeId === challengeId);
  }
  
  /**
   * Get all challenges
   */
  getChallengeSteps(): ImplementationStep[] {
    return this.implementationSteps;
  }
  
  /**
   * Get current step
   */
  getCurrentStep(): ImplementationStep {
    return this.implementationSteps[this.currentStepIndex];
  }
  
  /**
   * Mark a step as completed and move to the next step
   */
  completeStep(stepId: string): ImplementationStep | null {
    // Find the step with the given ID
    const stepIndex = this.implementationSteps.findIndex(step => step.id === stepId);
    
    if (stepIndex !== -1) {
      // Mark the step as completed
      this.implementationSteps[stepIndex].completed = true;
      
      // Find the next uncompleted step
      for (let i = 0; i < this.implementationSteps.length; i++) {
        if (!this.implementationSteps[i].completed) {
          this.currentStepIndex = i;
          return this.implementationSteps[i];
        }
      }
      
      // All steps are completed
      return null;
    }
    
    return null;
  }
  
  /**
   * Generate the first task message for the user
   */
  generateFirstTaskMessage(): string {
    const firstStep = this.implementationSteps[0];
    
    if (firstStep) {
      return `
## Let's start with your first task: ${firstStep.title}

${firstStep.description}

**What you need to do:**
${firstStep.taskInstructions}

**Key concepts to understand:**
${firstStep.concepts?.join(', ') || 'N/A'}

**Relevant files:** 
${firstStep.filesPaths.join('\n')}

**Estimated time:** ${firstStep.expectedDuration}

When you've completed this task, let me know and we'll move on to the next step.
      `;
    }
    
    return "Let's get started with implementing this project! Please review the code and let me know if you have any questions.";
  }
  
  getCurrentChallenge(): Challenge {
    return this.project.challenges[this.currentChallengeIndex];
  }
  
  getNextGuidanceMessage(): string {
    const currentChallenge = this.getCurrentChallenge();
    
    // If this is the first message about this challenge
    if (!this.conversationHistory.some(msg => msg.challengeId === currentChallenge.description)) {
      const message = this._generateIntroMessage(currentChallenge);
      this.conversationHistory.push({
        type: 'guide',
        content: message,
        challengeId: currentChallenge.description
      });
      return message;
    }
    
    // If we've already started discussing this challenge, provide a hint
    const hintsGiven = this.conversationHistory
      .filter(msg => msg.challengeId === currentChallenge.description && msg.type === 'hint')
      .length;
    
    if (hintsGiven < currentChallenge.hints.length) {
      const hint = currentChallenge.hints[hintsGiven];
      const message = `Here's a hint: ${hint}`;
      
      this.conversationHistory.push({
        type: 'hint',
        content: message,
        challengeId: currentChallenge.description
      });
      
      return message;
    }
    
    // If we've given all the hints, provide encouragement
    return "You're on the right track! Try implementing this solution and let me know if you encounter any specific issues.";
  }
  
  private _generateIntroMessage(challenge: Challenge): string {
    const messages = [
      `Now let's work on implementing the ${challenge.description} feature for ${challenge.featureName}. This is an important part of the application that needs to be completed.`,
      `I've noticed that the ${challenge.description} functionality is missing from the ${challenge.featureName} feature. Let's implement this together.`,
      `Your next challenge is to add ${challenge.description} to the ${challenge.featureName} part of the application. This is a ${challenge.difficulty} level task.`,
      `Let's make our application better by implementing ${challenge.description} for the ${challenge.featureName} feature. I'll guide you through this process.`
    ];
    
    // Randomly select one of the introduction messages
    const intro = messages[Math.floor(Math.random() * messages.length)];
    
    // Add specific context based on the challenge
    let context = '';
    
    if (challenge.description.includes('profile image upload')) {
      context = `\n\nI've created a button in the Profile component, but it currently just shows an alert when clicked. You'll need to implement both the frontend and backend components of this feature. The frontend should allow users to select an image file, while the backend needs to handle file uploads, storage, and updating the user's profile.`;
    } else if (challenge.description.includes('Follow API')) {
      context = `\n\nThe Follow button in the user profile currently doesn't do anything. You'll need to implement the API endpoints for following/unfollowing users and update the UI accordingly. This involves creating a Follow model to track relationships between users.`;
    } else if (challenge.description.includes('password reset')) {
      context = `\n\nThe authentication system is working for login and registration, but there's no way for users to reset their password if they forget it. You'll need to implement this functionality, including sending a reset token via email and creating a form for entering a new password.`;
    } else if (challenge.description.includes('search')) {
      context = `\n\nThe application needs a search feature to find content. You'll need to implement both the frontend UI for entering search queries and the backend API for processing those queries and returning relevant results.`;
    } else {
      context = `\n\nTake a look at the existing code to understand how this feature should fit into the application. I've provided some structure, but you'll need to fill in the missing functionality.`;
    }
    
    // Add call to action
    const callToAction = `\n\nWould you like to start with the frontend or backend implementation? Or do you need more information about this challenge?`;
    
    return intro + context + callToAction;
  }
  
  processUserMessage(message: string): string {
    // Add user message to conversation history
    this.conversationHistory.push({
      type: 'user',
      content: message,
      challengeId: this.getCurrentChallenge().description
    });
    
    // Check if the message indicates the challenge is complete
    if (this._isChallengeSolutionMessage(message)) {
      // Mark current challenge as complete
      this.project.challenges[this.currentChallengeIndex].completed = true;
      
      // Move to the next challenge
      if (this.currentChallengeIndex < this.project.challenges.length - 1) {
        this.currentChallengeIndex++;
        return this._generateCompletionMessage();
      } else {
        return this._generateAllChallengesCompletedMessage();
      }
    }
    
    // Analyze the message to determine the appropriate response
    if (this._isAskingForHelp(message)) {
      return this.getNextGuidanceMessage();
    } else if (this._isAskingForCode(message)) {
      return this._provideCodeSnippet();
    } else {
      // General encouragement
      return this._generateEncouragementMessage();
    }
  }
  
  private _isChallengeSolutionMessage(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const completionPhrases = [
      "i've completed", "i have completed", "finished implementing", 
      "done implementing", "implemented the feature", "feature is working",
      "it's working now", "it works now", "completed the challenge"
    ];
    
    return completionPhrases.some(phrase => lowerMessage.includes(phrase));
  }
  
  private _isAskingForHelp(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const helpPhrases = [
      "help", "hint", "stuck", "don't understand", "don't know how", 
      "not sure", "guidance", "assist", "confused", "struggling"
    ];
    
    return helpPhrases.some(phrase => lowerMessage.includes(phrase));
  }
  
  private _isAskingForCode(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const codePhrases = [
      "code example", "sample code", "example code", "how do i code", 
      "show me the code", "code snippet", "implementation example"
    ];
    
    return codePhrases.some(phrase => lowerMessage.includes(phrase));
  }
  
  private _generateCompletionMessage(): string {
    const completedChallenge = this.project.challenges[this.currentChallengeIndex - 1];
    const nextChallenge = this.getCurrentChallenge();
    
    const messages = [
      `Great job implementing the ${completedChallenge.description} feature! You've successfully completed this challenge.`,
      `Excellent work on the ${completedChallenge.description} functionality! That's one challenge down.`,
      `You've successfully implemented ${completedChallenge.description}! The application is getting better with each feature you add.`
    ];
    
    const completion = messages[Math.floor(Math.random() * messages.length)];
    
    return `${completion}\n\nNow, let's move on to the next challenge: ${nextChallenge.description} for the ${nextChallenge.featureName} feature. This is a ${nextChallenge.difficulty} level task.\n\nWould you like to get started with this new challenge?`;
  }
  
  private _generateAllChallengesCompletedMessage(): string {
    return `Congratulations! You've completed all the challenges for this project. You've successfully built a functioning application with all the required features.\n\nYou've demonstrated your skills in implementing various aspects of a full-stack application, from user authentication to complex features like ${this.project.challenges[0].description} and ${this.project.challenges[this.project.challenges.length - 1].description}.\n\nWhat would you like to do next? You could:\n\n1. Add additional features to this project\n2. Optimize the existing code\n3. Start a new project with different challenges\n\nLet me know how you'd like to proceed!`;
  }
  
  private _provideCodeSnippet(): string {
    const challenge = this.getCurrentChallenge();
    
    // Add this interaction to conversation history
    this.conversationHistory.push({
      type: 'codeSnippet',
      content: 'Code snippet provided',
      challengeId: challenge.description
    });
    
    // Based on the challenge type, provide appropriate code snippet
    // This would be expanded with more code examples for different challenge types
    if (challenge.description.includes('profile image upload')) {
      return "Here's a code snippet for implementing profile image upload...";
    } else if (challenge.description.includes('Follow API')) {
      return "Here's a code snippet to help you implement the Follow API...";
    }
    
    return "Here's some sample code to help you with this challenge...";
  }
  
  private _generateEncouragementMessage(): string {
    const messages = [
      "How's your implementation coming along? Remember to break down the problem into smaller steps.",
      "That's a good approach! Keep going, and let me know if you run into any specific issues.",
      "You're on the right track. Don't hesitate to ask if you need any hints or guidance.",
      "Take your time with this challenge. It's important to understand each part of the implementation.",
      "Looking forward to seeing your solution! Remember that there are often multiple valid ways to implement a feature."
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  getProjectOverview(): string {
    const completedChallenges = this.project.challenges.filter(c => c.completed).length;
    const totalChallenges = this.project.challenges.length;
    
    const projectName = this.project.name || this.project.projectName || "Code Challenge";
    const description = this.project.description || "A coding challenge project";
    const stack = this.project.stack || "Full Stack";
    
    const overview = `
Project: ${projectName}
Description: ${description}
Stack: ${stack}
Progress: ${completedChallenges}/${totalChallenges} challenges completed

Current Challenges:
${this.project.challenges.map((challenge, index) => 
  `${index + 1}. ${challenge.description} (${challenge.featureName}) - ${challenge.completed ? '✅ Completed' : '⏳ In Progress'}`
).join('\n')}
    `;
    
    return overview;
  }
}
