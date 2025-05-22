/**
 * GeminiCodeGenerator - Handles the generation of intentionally incomplete code challenges
 * This module integrates with the Gemini API to create incomplete applications
 * that users can then complete as a learning exercise.
 */

import { supabase } from "@/integrations/supabase/client";
import { Challenge, GeneratedProject } from "./projectTemplates";
import { ChallengeGenerator } from "./ChallengeGenerator";
import { StructuredAIGuide } from "./StructuredAIGuide";

interface GeminiCodeRequest {
  prompt: string;
  completionLevel?: 'beginner' | 'intermediate' | 'advanced';
  challengeType?: 'frontend' | 'backend' | 'fullstack';
}

export interface ChallengeResult {
  success: boolean;
  projectId: string;
  projectName: string;
  description: string;
  prompt: string;
  files: {
    path: string;
    content: string;
    isComplete: boolean;
    challenges?: {
      description: string;
      difficulty: 'easy' | 'medium' | 'hard';
      hints: string[];
    }[];
  }[];
  challenges: {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    type: 'implementation' | 'bugfix' | 'feature';
    filesPaths: string[];
  }[];
  explanation: string;
  error?: string;
  guide?: StructuredAIGuide;
}

export class GeminiCodeGenerator {
  private apiKey?: string;
  private debug: boolean;
  private challengeGenerator: ChallengeGenerator;
  
  constructor(config: { debug?: boolean } = {}) {
    this.debug = config.debug || false;
    this.challengeGenerator = new ChallengeGenerator();
  }

  /**
   * Generate an intentionally incomplete application with specific challenges for the user
   * @param request The code generation request
   */
  async generateChallenge(request: GeminiCodeRequest): Promise<ChallengeResult> {
    try {
      this.log('Generating code challenge for prompt:', request.prompt);
      
      // Try to retrieve API key if not provided
      await this.retrieveApiKey();
      
      if (!this.apiKey) {
        throw new Error("Gemini API key is required");
      }
      
      // Call Supabase function for challenge generation
      const { data, error } = await supabase.functions.invoke('generate-challenge', {
        body: { 
          prompt: request.prompt,
          completionLevel: request.completionLevel || 'intermediate',
          challengeType: request.challengeType || 'fullstack'
        }
      });
      
      if (error) {
        throw new Error(`Error calling generate-challenge function: ${error.message}`);
      }
      
      this.log('Challenge generation successful');
      
      // Make sure to include the original prompt in the result
      const resultWithPrompt = {
        ...data as ChallengeResult,
        prompt: request.prompt
      };
      
      return resultWithPrompt;
    } catch (error: any) {
      this.log('Error generating code challenge:', error.message);
      
      // Use the local generator as a fallback
      return this.generateLocalChallenge(request.prompt, request.completionLevel || 'intermediate');
    }
  }
  
  /**
   * Generate a project directly using the local ChallengeGenerator
   * This is a fallback if the Gemini API is not available
   */
  generateLocalChallenge(prompt: string, completionLevel: 'beginner' | 'intermediate' | 'advanced'): ChallengeResult {
    try {
      this.log('Generating local challenge for:', prompt);
      
      // Determine the project type from the prompt
      const projectType = this._determineProjectType(prompt);
      
      // Generate project using local challenge generator
      const generatedProject = this.challengeGenerator.generateProject(projectType, completionLevel);
      
      // Create an AI guide for the project
      const guide = new StructuredAIGuide(generatedProject);
      
      // Convert challenges to required format
      const challenges = generatedProject.challenges.map(challenge => ({
        id: challenge.id,
        title: challenge.featureName,
        description: challenge.description,
        difficulty: challenge.difficulty,
        type: 'implementation' as const,
        filesPaths: challenge.filesPaths
      }));
      
      // Create a simple file structure based on the project
      const files = this._generateBasicFiles(generatedProject);
      
      // Intentionally mark some files as incomplete
      const partialFiles = files.map((file, index) => {
        // Make every other file intentionally incomplete for the challenge
        const isComplete = index % 2 === 0;
        return {
          ...file,
          isComplete,
          // Only add challenges to incomplete files
          challenges: !isComplete ? file.challenges || [
            {
              description: `Complete the implementation for ${file.path}`,
              difficulty: 'medium' as const,
              hints: ["Look for TODO comments in the code", "Consider the overall architecture"]
            }
          ] : file.challenges
        };
      });
      
      return {
        success: true,
        projectId: `local-${Date.now()}`,
        projectName: generatedProject.projectName,
        description: generatedProject.description,
        prompt: prompt,
        files: partialFiles,
        challenges: challenges,
        explanation: `This is a ${generatedProject.projectName} project with intentional gaps for learning. Complete the challenges to build your skills in React, TypeScript, and web development. Each challenge has hints to guide you.`,
        guide: guide
      };
    } catch (error: any) {
      this.log('Error generating local challenge:', error.message);
      
      return {
        success: false,
        projectId: "",
        projectName: "",
        description: "",
        prompt,
        files: [],
        challenges: [],
        explanation: "",
        error: error.message
      };
    }
  }
  
  /**
   * Process user message with the AI guide
   * @param projectId Project ID
   * @param message User message
   * @returns AI guide response
   */
  async processUserMessage(projectId: string, message: string): Promise<string> {
    try {
      // For local projects, we use the embedded AI guide
      if (projectId.startsWith('local-')) {
        // We would need to retrieve the guide object from storage
        // For this example, we'll return a simple response
        return "I'm here to help you with your coding challenges. Could you tell me which specific challenge you're working on?";
      }
      
      // For Gemini-generated projects, we would call the API
      const { data, error } = await supabase.functions.invoke('guide-conversation', {
        body: { 
          projectId,
          message
        }
      });
      
      if (error) {
        throw new Error(`Error calling guide-conversation function: ${error.message}`);
      }
      
      return data.response;
    } catch (error: any) {
      this.log('Error processing message with guide:', error.message);
      return "I'm having trouble processing your request. Please try again later.";
    }
  }
  
  /**
   * Determine project type based on prompt
   */
  private _determineProjectType(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('twitter') || 
        lowerPrompt.includes('social media') || 
        lowerPrompt.includes('tweet') ||
        lowerPrompt.includes('post')) {
      return 'twitterClone';
    }
    
    if (lowerPrompt.includes('ecommerce') || 
        lowerPrompt.includes('shop') || 
        lowerPrompt.includes('store') ||
        lowerPrompt.includes('product')) {
      return 'ecommerceStore';
    }
    
    if (lowerPrompt.includes('task') || 
        lowerPrompt.includes('todo') || 
        lowerPrompt.includes('project management') ||
        lowerPrompt.includes('productivity')) {
      return 'taskManager';
    }
    
    // Default to task manager if can't determine
    return 'taskManager';
  }
  
  /**
   * Generate basic file structure for a local project
   * with intentionally incomplete parts
   */
  private _generateBasicFiles(project: GeneratedProject) {
    // Generate minimal files for the project
    const files: {
      path: string;
      content: string;
      isComplete: boolean;
      challenges?: {
        description: string;
        difficulty: 'easy' | 'medium' | 'hard';
        hints: string[];
      }[];
    }[] = [
      {
        path: "src/App.tsx",
        content: `import React from 'react';\nimport { BrowserRouter, Routes, Route } from 'react-router-dom';\nimport HomePage from './pages/Home';\n\nfunction App() {\n  return (\n    <BrowserRouter>\n      <Routes>\n        <Route path="/" element={<HomePage />} />\n        {/* TODO: Add more routes here */}\n      </Routes>\n    </BrowserRouter>\n  );\n}\n\nexport default App;`,
        isComplete: false, // Intentionally mark this as incomplete
        challenges: [
          {
            description: "Add more routes to the App component",
            difficulty: "easy",
            hints: ["Consider what pages your app needs", "Add routes for features like profile, settings, etc."]
          }
        ]
      },
      {
        path: "src/pages/Home.tsx",
        content: `import React from 'react';\n\nconst HomePage = () => {\n  return (\n    <div className="container mx-auto p-4">\n      <h1 className="text-2xl font-bold mb-4">${project.projectName}</h1>\n      <p>${project.description}</p>\n      \n      {/* TODO: Implement the main interface */}\n      \n    </div>\n  );\n};\n\nexport default HomePage;`,
        isComplete: false, // Intentionally mark this as incomplete
        challenges: [
          {
            description: "Implement the main interface",
            difficulty: "easy",
            hints: ["Consider what components you'll need", "Look at the project structure for guidance"]
          }
        ]
      }
    ];
    
    // Add challenge-specific files
    project.challenges.forEach(challenge => {
      if (challenge.filesPaths && challenge.filesPaths.length > 0) {
        const path = challenge.filesPaths[0].replace('frontend/', 'src/').replace('.js', '.tsx');
        
        // Map the beginner/intermediate/advanced difficulty to easy/medium/hard
        let mappedDifficulty: 'easy' | 'medium' | 'hard';
        switch (challenge.difficulty) {
          case 'beginner':
            mappedDifficulty = 'easy';
            break;
          case 'intermediate':
            mappedDifficulty = 'medium';
            break;
          case 'advanced':
            mappedDifficulty = 'hard';
            break;
          default:
            mappedDifficulty = 'medium';
        }
        
        files.push({
          path,
          content: `import React from 'react';\n\n// TODO: Implement ${challenge.description}\n// This file needs implementation for the ${challenge.featureName} feature\n\nconst ${this._getComponentName(path)} = () => {\n  // TODO: This is intentionally incomplete\n  return (\n    <div className="p-4 border border-dashed border-amber-500 rounded-md">\n      <h2 className="text-lg font-medium mb-2">${challenge.featureName}</h2>\n      <p className="text-gray-500">This component needs implementation</p>\n      {/* \n        CHALLENGE: ${challenge.description}\n        DIFFICULTY: ${challenge.difficulty}\n        HINT: ${challenge.hints[0]}\n      */}\n    </div>\n  );\n};\n\nexport default ${this._getComponentName(path)};`,
          isComplete: false, // Intentionally mark challenge files as incomplete
          challenges: [
            {
              description: challenge.description,
              difficulty: mappedDifficulty,
              hints: challenge.hints
            }
          ]
        });
      }
    });
    
    return files;
  }
  
  /**
   * Extract component name from path
   */
  private _getComponentName(path: string): string {
    const fileName = path.split('/').pop() || '';
    const componentName = fileName.replace(/\.(tsx|jsx|js|ts)$/, '');
    return componentName;
  }
  
  /**
   * Retrieve Gemini API key from Supabase secrets
   */
  private async retrieveApiKey(): Promise<void> {
    if (!this.apiKey) {
      try {
        const { data, error } = await supabase.functions.invoke('get-env', {
          body: { key: 'GEMINI_API_KEY' }
        });
        
        if (!error && data?.value) {
          this.apiKey = data.value;
        }
      } catch (error) {
        this.log('Error retrieving Gemini API key:', error);
      }
    }
  }
  
  /**
   * Set a new Gemini API key
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }
  
  /**
   * Get the API key
   */
  getApiKey(): string | undefined {
    return this.apiKey;
  }
  
  /**
   * Log messages if debug mode is enabled
   */
  private log(...args: any[]): void {
    if (this.debug) {
      console.log('[GeminiCodeGenerator]', ...args);
    }
  }
}
