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

interface GenerationResult {
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
  };
  error?: string;
}

export class UICodeGenerator {
  private perplexityApiKey?: string;
  private claudeApiKey?: string;
  private debug: boolean;
  private scraper: EnhancedPerplexityUIScraper;
  private customizer: ClaudeCodeCustomizer;
  private generationHistory: GenerationHistoryItem[];
  
  constructor(config: UICodeGeneratorConfig = {}) {
    // Extract configuration
    this.perplexityApiKey = config.perplexityApiKey;
    this.claudeApiKey = config.claudeApiKey;
    this.debug = config.debug || false;
    
    // Initialize components
    this.scraper = new EnhancedPerplexityUIScraper(this.perplexityApiKey || '');
    this.customizer = new ClaudeCodeCustomizer(this.claudeApiKey || '');
    
    // Track generation history for potential reuse
    this.generationHistory = [];
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
      
      // 2. Find design using Perplexity AI
      this.log('Searching for UI design with Perplexity AI...');
      const scrapedDesign = await this.scraper.findDesignCode(userPrompt);
      
      if (!scrapedDesign || !scrapedDesign.success) {
        throw new Error(scrapedDesign?.error || 'Failed to find UI design');
      }
      
      this.log('Design found:', scrapedDesign.metadata);
      
      // 3. Customize the design with Claude
      this.log('Customizing code with Claude...');
      const customizedCode = await this.customizer.customizeCode(scrapedDesign);
      
      if (!customizedCode || !customizedCode.success) {
        throw new Error(customizedCode?.error || 'Failed to customize code');
      }
      
      this.log('Code customization complete');
      
      // 4. Save to history
      this.saveToHistory(userPrompt, scrapedDesign, customizedCode);
      
      // 5. Format and return the result
      return this.formatResult(userPrompt, scrapedDesign, customizedCode);
      
    } catch (error: any) {
      this.log('Error generating code:', error.message);
      
      return {
        success: false,
        error: error.message,
        prompt: userPrompt
      };
    }
  }
  
  /**
   * Save generation to history for potential reuse
   */
  private saveToHistory(prompt: string, scrapedDesign: DesignCodeResult, customizedCode: any): void {
    // Keep history limited to last 10 items
    if (this.generationHistory.length >= 10) {
      this.generationHistory.shift();
    }
    
    this.generationHistory.push({
      timestamp: new Date().toISOString(),
      prompt,
      componentType: scrapedDesign.metadata?.componentType,
      designSystem: scrapedDesign.metadata?.designSystem,
      success: customizedCode.success
    });
  }
  
  /**
   * Format the final result for the client
   */
  private formatResult(prompt: string, scrapedDesign: DesignCodeResult, customizedCode: any): GenerationResult {
    return {
      success: true,
      prompt,
      result: {
        code: {
          frontend: customizedCode.customizedCode?.frontend || null,
          backend: customizedCode.customizedCode?.backend || null
        },
        explanation: customizedCode.explanation || ''
      },
      metadata: {
        componentType: scrapedDesign.metadata?.componentType,
        designSystem: scrapedDesign.metadata?.designSystem,
        sourceUrl: scrapedDesign.metadata?.query,
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
