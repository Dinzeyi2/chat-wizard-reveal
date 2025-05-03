/**
 * UI Code Generator - Main Integration
 * This module integrates the Perplexity AI Design Scraper with the Claude Code Customizer
 * to create a comprehensive UI code generation system
 */

import { 
  EnhancedPerplexityUIScraper, 
  DesignCodeResult 
} from "@/utils/EnhancedPerplexityUIScraper";
import { ClaudeCodeCustomizer } from "@/utils/ClaudeCodeCustomizer";
import { supabase } from "@/integrations/supabase/client";
import { StructuredAIGuide } from "@/utils/StructuredAIGuide";

interface UICodeGeneratorConfig {
  perplexityApiKey?: string;
  claudeApiKey?: string;
  debug?: boolean;
}

interface GenerationHistoryItem {
  timestamp: string;
  prompt: string;
  componentType?: string;
  designSystem?: string;
  success: boolean;
}

export interface GenerationResult {
  success: boolean;
  prompt: string;
  result?: {
    code: {
      frontend: string | null;
      backend: string | null;
    };
    explanation: string;
  };
  metadata?: {
    componentType?: string;
    designSystem?: string;
    sourceUrl?: string;
    timestamp: string;
    usedFallback?: boolean;
  };
  error?: string;
}

export class UICodeGenerator {
  private perplexityApiKey?: string;
  private claudeApiKey?: string;
  private debug: boolean;
  private scraper: EnhancedPerplexityUIScraper | null = null;
  private customizer: ClaudeCodeCustomizer | null = null;
  private generationHistory: GenerationHistoryItem[];
  private structuredGuide: StructuredAIGuide | null = null;
  private _shouldSendFirstStepGuidance: boolean = true;
  
  constructor(config: UICodeGeneratorConfig = {}) {
    // Extract configuration
    this.perplexityApiKey = config.perplexityApiKey;
    this.claudeApiKey = config.claudeApiKey;
    this.debug = config.debug || false;
    
    // Initialize components if keys are available
    if (this.perplexityApiKey) {
      this.scraper = new EnhancedPerplexityUIScraper(this.perplexityApiKey);
    }
    
    if (this.claudeApiKey) {
      this.customizer = new ClaudeCodeCustomizer(this.claudeApiKey);
    }
    
    // Track generation history for potential reuse
    this.generationHistory = [];
  }
  
  /**
   * Get the current Claude API key
   */
  getClaudeApiKey(): string | undefined {
    return this.claudeApiKey;
  }
  
  /**
   * Set a new Claude API key
   */
  setClaudeApiKey(apiKey: string): void {
    this.claudeApiKey = apiKey;
    this.customizer = new ClaudeCodeCustomizer(apiKey);
  }
  
  /**
   * Initialize a structured AI guide for a project
   */
  initializeStructuredGuide(projectData: any): StructuredAIGuide {
    this.structuredGuide = new StructuredAIGuide(projectData);
    this._shouldSendFirstStepGuidance = true;
    return this.structuredGuide;
  }
  
  /**
   * Get the structured AI guide for a project
   */
  getStructuredGuide(): StructuredAIGuide | null {
    return this.structuredGuide;
  }
  
  /**
   * Process a message using the structured AI guide
   */
  processGuideMessage(message: string): string | null {
    if (!this.structuredGuide) {
      return null;
    }
    
    return this.structuredGuide.processUserMessage(message);
  }

  /**
   * Check if first step guidance should be sent
   */
  shouldSendFirstStepGuidance(): boolean {
    return this._shouldSendFirstStepGuidance && this.structuredGuide !== null;
  }

  /**
   * Mark first step guidance as sent
   */
  markFirstStepGuidanceSent(): void {
    this._shouldSendFirstStepGuidance = false;
  }

  /**
   * Get first step guidance message
   */
  getFirstStepGuidanceMessage(): string | null {
    if (!this.structuredGuide) {
      return null;
    }
    
    // Use autoSelectNextStep instead of getFirstStep
    const firstStep = this.structuredGuide.autoSelectNextStep();
    if (!firstStep) {
      return null;
    }
    
    return `
## Let's Start Building! Your First Task

I've created an application with some challenges for you to solve. Let's tackle them one by one!

### First Task: ${firstStep.name}

**What you need to do:**
${firstStep.description}

${firstStep.helpText || ''}

**File(s) to modify:** ${firstStep.filePaths?.join(', ') || 'Check the code to identify the issues'}

When you've completed this task, click the "I've completed this" button and I'll guide you to the next step.
    `;
  }
  
  /**
   * Generate UI code based on a user prompt
   * @param userPrompt - User's design request
   * @returns Generated code and metadata
   */
  async generateCode(userPrompt: string): Promise<GenerationResult> {
    try {
      // 1. Log the request
      this.log('Generating code for prompt:', userPrompt);
      
      // Attempt to retrieve stored API keys if not provided
      await this.retrieveApiKeys();
      
      // 2. Decide which method to use for generation
      if (!this.perplexityApiKey && !this.claudeApiKey) {
        throw new Error("Either Perplexity API key or Claude API key is required");
      }
      
      // 3. Call Supabase function for design code generation
      const response = await this.callDesignCodeFunction(userPrompt);
      
      // 4. If successful, format and return the result
      if (response.success) {
        this.log('Code generation successful');
        
        // 5. Save to history
        this.saveToHistory(userPrompt, response);
        
        // 6. Initialize structured guide if project data is available
        if (response.project) {
          this.initializeStructuredGuide(response.project);
        }
        
        return this.formatResult(userPrompt, response);
      } else {
        throw new Error(response.error || "Failed to generate code");
      }
    } catch (error: any) {
      this.log('Error generating code:', error.message);
      
      // Return error result
      return {
        success: false,
        error: error.message,
        prompt: userPrompt
      };
    }
  }
  
  /**
   * Retrieve API keys from Supabase secrets
   */
  private async retrieveApiKeys(): Promise<void> {
    if (!this.perplexityApiKey || !this.claudeApiKey) {
      try {
        // Try to get Perplexity API key
        if (!this.perplexityApiKey) {
          const { data: perplexityData, error: perplexityError } = await supabase.functions.invoke('get-env', {
            body: { key: 'PERPLEXITY_API_KEY' }
          });
          
          if (!perplexityError && perplexityData?.value) {
            this.perplexityApiKey = perplexityData.value;
            if (!this.scraper && this.perplexityApiKey) {
              this.scraper = new EnhancedPerplexityUIScraper(this.perplexityApiKey);
            }
          }
        }
        
        // Try to get Claude API key
        if (!this.claudeApiKey) {
          const { data: claudeData, error: claudeError } = await supabase.functions.invoke('get-env', {
            body: { key: 'CLAUDE_API_KEY' }
          });
          
          if (!claudeError && claudeData?.value) {
            this.claudeApiKey = claudeData.value;
            if (!this.customizer && this.claudeApiKey) {
              this.customizer = new ClaudeCodeCustomizer(this.claudeApiKey);
            }
          }
        }
      } catch (error) {
        this.log('Error retrieving API keys:', error);
      }
    }
  }
  
  /**
   * Call the Supabase design-code function
   */
  private async callDesignCodeFunction(prompt: string): Promise<any> {
    try {
      let result;
      
      // First try to find design with Perplexity
      if (this.perplexityApiKey) {
        const { data: findData, error: findError } = await supabase.functions.invoke('design-code', {
          body: { 
            prompt, 
            action: 'find' 
          }
        });
        
        if (!findError && findData && findData.success) {
          result = findData;
          
          // If we also have Claude API key, customize the found design
          if (this.claudeApiKey && result) {
            const { data: customizeData, error: customizeError } = await supabase.functions.invoke('design-code', {
              body: { 
                prompt, 
                action: 'customize',
                designData: result
              }
            });
            
            if (!customizeError && customizeData && customizeData.success) {
              return customizeData;
            }
          }
          
          return result;
        }
      }
      
      // If Perplexity fails or isn't available but Claude is, try Claude directly
      if (this.claudeApiKey) {
        // Create minimal design data for Claude
        const minimalDesign = {
          success: true,
          requirements: {
            originalPrompt: prompt,
            componentType: this.extractComponentType(prompt),
            framework: 'react',
            designSystem: 'shadcn/ui',
            styles: ['beautiful'],
            isFullStack: false,
          },
          code: null, // No code found, create from scratch
          metadata: {
            query: prompt,
            designSystem: 'shadcn/ui',
          }
        };
        
        const { data: claudeData, error: claudeError } = await supabase.functions.invoke('design-code', {
          body: { 
            prompt, 
            action: 'customize',
            designData: minimalDesign
          }
        });
        
        if (!claudeError && claudeData && claudeData.success) {
          return claudeData;
        }
        
        throw new Error(claudeError?.message || 'Failed to generate with Claude');
      }
      
      throw new Error('No API keys available for code generation');
    } catch (error: any) {
      this.log('Error calling design-code function:', error);
      throw error;
    }
  }
  
  /**
   * Extract component type from prompt
   */
  private extractComponentType(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    
    // Check for common component types
    if (lowerPrompt.includes('dashboard')) {
      return 'dashboard';
    } else if (lowerPrompt.includes('form') || lowerPrompt.includes('signup') || lowerPrompt.includes('sign up')) {
      return 'form';
    } else if (lowerPrompt.includes('table')) {
      return 'table';
    } else if (lowerPrompt.includes('card')) {
      return 'card';
    } else if (lowerPrompt.includes('navbar') || lowerPrompt.includes('navigation')) {
      return 'navbar';
    }
    
    // Default to component
    return 'component';
  }
  
  /**
   * Save generation to history for potential reuse
   */
  private saveToHistory(prompt: string, result: any): void {
    // Keep history limited to last 10 items
    if (this.generationHistory.length >= 10) {
      this.generationHistory.shift();
    }
    
    // Extract metadata from result
    let componentType, designSystem, success;
    
    if (result.originalDesign) {
      // This is a customized design
      componentType = result.originalDesign.metadata?.componentType;
      designSystem = result.originalDesign.metadata?.designSystem;
      success = true;
    } else {
      // This is a found design
      componentType = result.metadata?.componentType;
      designSystem = result.metadata?.designSystem;
      success = result.success;
    }
    
    this.generationHistory.push({
      timestamp: new Date().toISOString(),
      prompt,
      componentType,
      designSystem,
      success
    });
  }
  
  /**
   * Format the final result for the client
   */
  private formatResult(prompt: string, result: any): GenerationResult {
    // Handle customized design result
    if (result.customizedCode) {
      return {
        success: true,
        prompt,
        result: {
          code: {
            frontend: result.customizedCode.frontend || null,
            backend: result.customizedCode.backend || null
          },
          explanation: result.explanation || ''
        },
        metadata: {
          componentType: result.originalDesign?.metadata?.componentType,
          designSystem: result.originalDesign?.metadata?.designSystem,
          sourceUrl: result.originalDesign?.metadata?.query,
          timestamp: new Date().toISOString(),
          usedFallback: !result.originalDesign?.code
        }
      };
    }
    
    // Handle direct design result (without customization)
    return {
      success: true,
      prompt,
      result: {
        code: {
          frontend: result.code || null,
          backend: null
        },
        explanation: 'Generated design code'
      },
      metadata: {
        componentType: result.metadata?.componentType,
        designSystem: result.metadata?.designSystem,
        sourceUrl: result.metadata?.query,
        timestamp: new Date().toISOString()
      }
    };
  }
  
  /**
   * Log messages if debug mode is enabled
   */
  private log(...args: any[]): void {
    if (this.debug) {
      console.log('[UICodeGenerator]', ...args);
    }
  }
  
  /**
   * Get generation history
   * @returns Generation history
   */
  getHistory(): GenerationHistoryItem[] {
    return [...this.generationHistory];
  }
}
