
/**
 * GeminiCodeGenerator - Handles the generation of intentionally incomplete code challenges
 * This module integrates with the Gemini API to create incomplete applications
 * that users can then complete as a learning exercise.
 */

import { supabase } from "@/integrations/supabase/client";

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
}

export class GeminiCodeGenerator {
  private apiKey?: string;
  private debug: boolean;
  
  constructor(config: { debug?: boolean } = {}) {
    this.debug = config.debug || false;
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
      
      return {
        success: false,
        projectId: "",
        projectName: "",
        description: "",
        prompt: request.prompt,
        files: [],
        challenges: [],
        explanation: "",
        error: error.message,
      };
    }
  }
  
  /**
   * Retrieve Gemini API key from Supabase secrets
   */
  private async retrieveApiKey(): Promise<void> {
    if (!this.apiKey) {
      try {
        const { data, error } = await supabase.functions.invoke('get-env', {
          body: { key: 'OPENAI_API_KEY' }
        });
        
        if (!error && data?.value) {
          this.apiKey = data.value;
        }
      } catch (error) {
        this.log('Error retrieving API key:', error);
      }
    }
  }
  
  /**
   * Set a new API key
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
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
