
/**
 * TeachingGuide - Provides structured learning content with progressive challenges
 * This utility helps transform AI responses into educational content that teaches
 * through active learning rather than passive code consumption
 */

interface LearningStep {
  id: string;
  title: string;
  concepts: string[];
  explanation: string;
  codeSnippets: {
    complete: string;
    partial: string;
    language: string;
    fileName?: string;
  }[];
  challenges: {
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    hints: string[];
  }[];
  selfCheckQuestions: string[];
}

interface LearningModule {
  id: string;
  title: string;
  description: string;
  steps: LearningStep[];
  prerequisites?: string[];
  estimatedCompletionTime: string;
}

export class TeachingGuide {
  private projectName: string;
  private description: string;
  private modules: LearningModule[];
  private currentModule: LearningModule | null = null;
  private currentStep: LearningStep | null = null;
  
  constructor(projectName: string, description: string) {
    this.projectName = projectName;
    this.description = description;
    this.modules = [];
  }
  
  /**
   * Add a learning module to the guide
   */
  addModule(module: LearningModule): void {
    this.modules.push(module);
  }
  
  /**
   * Get the module with the specified ID
   */
  getModule(moduleId: string): LearningModule | null {
    return this.modules.find(m => m.id === moduleId) || null;
  }
  
  /**
   * Set the current active module
   */
  setCurrentModule(moduleId: string): boolean {
    const module = this.getModule(moduleId);
    if (module) {
      this.currentModule = module;
      // Reset current step when changing modules
      this.currentStep = module.steps.length > 0 ? module.steps[0] : null;
      return true;
    }
    return false;
  }
  
  /**
   * Move to the next step in the current module
   */
  nextStep(): LearningStep | null {
    if (!this.currentModule || !this.currentStep) {
      return null;
    }
    
    const currentIndex = this.currentModule.steps.findIndex(s => s.id === this.currentStep?.id);
    if (currentIndex < this.currentModule.steps.length - 1) {
      this.currentStep = this.currentModule.steps[currentIndex + 1];
      return this.currentStep;
    }
    return null;
  }
  
  /**
   * Get the current step content
   */
  getCurrentStepContent(): string {
    if (!this.currentStep) {
      return this.getIntroduction();
    }
    
    return `
# ${this.currentStep.title}

## Concepts You'll Learn
${this.currentStep.concepts.map(c => `- ${c}`).join('\n')}

## Why This Matters
${this.currentStep.explanation}

## Code Implementation
Let's implement this step together. I'll provide some of the code, and you'll complete the rest.

${this.currentStep.codeSnippets.map(snippet => `
\`\`\`${snippet.language}
// File: ${snippet.fileName || 'implementation.js'}
// Fill in the missing parts!

${snippet.partial}
\`\`\`
`).join('\n')}

## Learning Challenges
${this.currentStep.challenges.map(challenge => `
### ${challenge.difficulty.toUpperCase()} Challenge: ${challenge.description}
${challenge.hints.map(hint => `- Hint: ${hint}`).join('\n')}
`).join('\n')}

## Check Your Understanding
${this.currentStep.selfCheckQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

When you've completed this step, let me know and I'll guide you to the next part!
`;
  }
  
  /**
   * Get the project introduction
   */
  getIntroduction(): string {
    return `
# Your Hands-On Guide: Building ${this.projectName}

${this.description}

## Learning Path Overview
${this.modules.map((module, i) => `
### Module ${i + 1}: ${module.title}
${module.description}
- Estimated time: ${module.estimatedCompletionTime}
- Contains ${module.steps.length} hands-on exercises
`).join('\n')}

## How This Guide Works
Instead of giving you complete solutions, I'll provide:
1. Clear explanations of concepts
2. Partial code snippets for you to complete
3. Guided challenges to reinforce understanding
4. Self-check questions to test your knowledge

This approach will help you truly learn the material rather than just copy-pasting code!

Let me know when you're ready to start with the first module.
`;
  }
  
  /**
   * Generate a hint without revealing the complete solution
   */
  generateHint(): string {
    if (!this.currentStep) {
      return "Let's first select a learning module to get started!";
    }
    
    const hints = this.currentStep.challenges.flatMap(c => c.hints);
    const randomHint = hints[Math.floor(Math.random() * hints.length)];
    
    return `
## Helpful Hint

${randomHint || "Try breaking down the problem into smaller steps."}

Remember: The goal is to understand the process, not just get the right answer. Take your time!
`;
  }
  
  /**
   * Create a sample teaching guide for a given project type
   */
  static createSampleGuide(projectType: string, projectName: string): TeachingGuide {
    const guide = new TeachingGuide(
      projectName,
      `A ${projectType} project that will teach you key concepts through hands-on coding.`
    );
    
    // Create a sample module with steps
    const sampleModule: LearningModule = {
      id: "module-1",
      title: "Getting Started with the Basics",
      description: "Learn the fundamental building blocks of your project",
      steps: [
        {
          id: "step-1",
          title: "Setting Up Your Project Structure",
          concepts: ["File organization", "Environment setup", "Project initialization"],
          explanation: "A well-organized project structure is crucial for maintainability and collaboration.",
          codeSnippets: [
            {
              complete: `import React from 'react';\nimport './App.css';\n\nfunction App() {\n  return (\n    <div className="App">\n      <h1>Hello, World!</h1>\n    </div>\n  );\n}\n\nexport default App;`,
              partial: `import React from 'react';\nimport './App.css';\n\nfunction App() {\n  return (\n    // Create a div with className "App" and add an h1 element inside\n    // Your code here\n  );\n}\n\n// Don't forget to export your component!\n`,
              language: "jsx",
              fileName: "App.jsx"
            }
          ],
          challenges: [
            {
              description: "Modify the App component to include a subtitle and a button",
              difficulty: "easy",
              hints: [
                "Add an h2 element after the h1",
                "Use the button element to create a button",
                "Consider adding some basic styling with className"
              ]
            }
          ],
          selfCheckQuestions: [
            "Why is it important to export your component at the end of the file?",
            "What would happen if you forgot to import React?",
            "How would you add a click handler to your button?"
          ]
        }
      ],
      estimatedCompletionTime: "20 minutes"
    };
    
    guide.addModule(sampleModule);
    return guide;
  }
}
