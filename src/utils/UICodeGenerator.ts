
/**
 * UI Code Generator - Main Integration
 * This module uses Claude directly to generate UI code
 */

interface UICodeGeneratorConfig {
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
    usedFallback?: boolean;
  };
  error?: string;
}

export class UICodeGenerator {
  private claudeApiKey?: string;
  private debug: boolean;
  private generationHistory: GenerationHistoryItem[];
  private claudeEndpoint: string = "https://api.anthropic.com/v1/messages";
  private model: string = "claude-3-5-sonnet-20240620";
  
  constructor(config: UICodeGeneratorConfig = {}) {
    // Extract configuration
    this.claudeApiKey = config.claudeApiKey;
    this.debug = config.debug || false;
    
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
      // Log the request
      this.log('Generating code for prompt:', userPrompt);
      
      if (!this.claudeApiKey) {
        throw new Error("Claude API key is required for code generation");
      }
      
      // Use direct Claude generation
      return await this.claudeGeneration(userPrompt);
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
   * Generate code using Claude directly
   * @param userPrompt - User's design request
   * @returns Generated code and metadata
   */
  private async claudeGeneration(userPrompt: string): Promise<GenerationResult> {
    try {
      this.log('Using Claude for direct code generation');
      
      // 1. Extract design system preferences from the prompt
      const designSystem = this.extractDesignSystemPreference(userPrompt);
      const componentType = this.extractComponentType(userPrompt);
      const isFullStack = this.isFullStackRequest(userPrompt);
      const styles = this.extractStyles(userPrompt);
      
      // 2. Create a prompt for Claude
      const claudePrompt = this.createClaudePrompt(userPrompt, componentType, designSystem, styles, isFullStack);
      
      // 3. Call Claude API directly
      const claudeResponse = await this.callClaudeAPI(claudePrompt);
      
      // 4. Extract code blocks from the response
      const result = this.processClaudeResponse(claudeResponse, componentType);
      
      // 5. Format the response
      return {
        success: true,
        prompt: userPrompt,
        result: {
          code: {
            frontend: result.frontendCode || null,
            backend: result.backendCode || null
          },
          explanation: result.explanation || 'Generated with Claude'
        },
        metadata: {
          componentType: componentType,
          designSystem: designSystem,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      this.log('Code generation failed:', error.message);
      return {
        success: false,
        error: `Code generation failed: ${error.message}`,
        prompt: userPrompt
      };
    }
  }

  /**
   * Extract design system preference from prompt
   */
  private extractDesignSystemPreference(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    
    // Check for common design systems
    if (lowerPrompt.includes('shadcn') || lowerPrompt.includes('shadcn/ui')) {
      return 'shadcn/ui';
    } else if (lowerPrompt.includes('tailwind')) {
      return 'tailwind';
    } else if (lowerPrompt.includes('chakra')) {
      return 'chakra-ui';
    } else if (lowerPrompt.includes('material')) {
      return 'material-ui';
    } else if (lowerPrompt.includes('bootstrap')) {
      return 'bootstrap';
    }
    
    // Default to shadcn/ui
    return 'shadcn/ui';
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
    } else if (lowerPrompt.includes('button')) {
      return 'button';
    } else if (lowerPrompt.includes('modal') || lowerPrompt.includes('dialog')) {
      return 'modal';
    } else if (lowerPrompt.includes('list')) {
      return 'list';
    }
    
    // Default to component
    return 'component';
  }

  /**
   * Check if this is a full stack request
   */
  private isFullStackRequest(prompt: string): boolean {
    const promptLower = prompt.toLowerCase();
    
    return promptLower.includes("full stack") || 
           promptLower.includes("fullstack") || 
           promptLower.includes("full-stack") ||
           promptLower.includes("backend") ||
           promptLower.includes("database") ||
           promptLower.includes("api");
  }

  /**
   * Extract style preferences from prompt
   */
  private extractStyles(prompt: string): string[] {
    const promptLower = prompt.toLowerCase();
    const styles = [];
    
    if (promptLower.includes("white") || promptLower.includes("light")) styles.push("white");
    if (promptLower.includes("dark") || promptLower.includes("black")) styles.push("dark");
    if (promptLower.includes("beautiful") || promptLower.includes("elegant")) styles.push("beautiful");
    if (promptLower.includes("minimal") || promptLower.includes("simple")) styles.push("minimal");
    
    // Default to beautiful if no style specified
    if (styles.length === 0) styles.push("beautiful");
    
    return styles;
  }

  /**
   * Create a prompt for Claude code generation
   */
  private createClaudePrompt(originalPrompt: string, componentType: string, designSystem: string, styles: string[], isFullStack: boolean): string {
    // Determine style preferences
    const isWhite = styles.includes('white');
    const isDark = styles.includes('dark');
    const isBeautiful = styles.includes('beautiful');
    const isMinimal = styles.includes('minimal');
    
    // Build the style instructions
    let styleInstructions = [];
    if (isWhite) styleInstructions.push("Use a clean white theme with light backgrounds");
    if (isDark) styleInstructions.push("Use a dark theme with dark backgrounds and appropriate contrast");
    if (isBeautiful) styleInstructions.push("Make the component beautiful with elegant styling and subtle animations");
    if (isMinimal) styleInstructions.push("Keep the component minimal and clean, focusing on essential elements");
    
    // Default to white and beautiful if no styles specified
    if (styleInstructions.length === 0) {
      styleInstructions.push("Use a clean white theme with light backgrounds");
      styleInstructions.push("Make the component beautiful with elegant styling and subtle animations");
    }
    
    return `
You are an expert UI developer specializing in creating beautiful React applications.

# TASK
I need you to create a ${componentType} based on my requirements.

# USER REQUIREMENTS
"${originalPrompt}"

# DESIGN SYSTEM
You should use ${designSystem} for this component.

# STYLE REQUIREMENTS
${styleInstructions.join("\n")}

# TECHNICAL REQUIREMENTS
- Create a React component that fulfills the user's requirements
- Use ${designSystem} components and styling
- Use TypeScript with proper type definitions
- Make the component fully responsive and accessible
- Ensure the code is clean, well-organized, and follows best practices
- Add appropriate TypeScript types and comments
${isFullStack ? "- Add a simple backend API endpoint code that would support this component" : ""}

# INSTRUCTIONS
1. Create a component that fulfills the user requirements
2. Style it according to the ${designSystem} design system
3. Make it responsive and accessible
4. Add comments to explain any complex logic
5. Include any necessary imports

# EXPECTED RESPONSE FORMAT
Provide the code in the following format:

\`\`\`jsx
// Frontend code here...
\`\`\`

${isFullStack ? "Then provide the backend code (if required):\n\n```javascript\n// Backend code here (if needed)...\n```" : ""}

Finally, provide a brief explanation of the component and how to use it.
`;
  }

  /**
   * Call Claude API
   */
  private async callClaudeAPI(prompt: string) {
    try {
      const response = await fetch(this.claudeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey || '',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 4000
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Claude API error (${response.status}): ${errorText}`);
      }
      
      return await response.json();
    } catch (error: any) {
      this.log('Error calling Claude API:', error);
      throw new Error(`Failed to call Claude API: ${error.message}`);
    }
  }

  /**
   * Process Claude API response
   */
  private processClaudeResponse(response: any, componentType: string) {
    try {
      // Extract content from Claude response
      const content = response.content?.[0]?.text || "";
      
      // Extract code blocks from the response
      const codeBlockRegex = /```(?:jsx|js|javascript|typescript|tsx|ts)([\s\S]*?)```/g;
      const matches = [...content.matchAll(codeBlockRegex)];
      
      if (matches.length === 0) {
        throw new Error("No code blocks found in Claude's response");
      }
      
      // Extract frontend code (first code block)
      const frontendCode = matches[0][1].trim();
      
      // Extract backend code if present (second code block)
      let backendCode = null;
      if (matches.length > 1) {
        backendCode = matches[1][1].trim();
      }
      
      // Extract explanation (text after the last code block)
      const lastCodeBlockEnd = matches[matches.length - 1].index! + matches[matches.length - 1][0].length;
      const explanation = content.substring(lastCodeBlockEnd).trim();
      
      return {
        frontendCode,
        backendCode,
        explanation
      };
    } catch (error: any) {
      this.log('Error processing Claude response:', error);
      throw new Error(`Failed to process Claude's response: ${error.message}`);
    }
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

  /**
   * Determines if the prompt is likely a request for code generation
   * This helps decide whether to use this generator or the standard chat API
   */
  static isCodeGenerationRequest(prompt: string): boolean {
    const promptLower = prompt.toLowerCase();
    const codeGenerationKeywords = [
      'create', 'generate', 'build', 'implement', 'develop', 
      'design', 'code', 'make a', 'make me', 'write', 
      'component', 'function', 'class', 'module', 'interface',
      'feature', 'ui', 'form', 'button', 'card', 'modal'
    ];
    
    return codeGenerationKeywords.some(keyword => promptLower.includes(keyword));
  }
}
