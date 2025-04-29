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
    usedFallback?: boolean;
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
      
      // Skip the Perplexity search which is causing issues and go straight to Claude
      this.log('Using direct Claude fallback for code generation');
      return await this.claudeFallbackGeneration(userPrompt);
      
    } catch (error: any) {
      this.log('Error generating code:', error.message);
      
      // Try fallback if there was an error in the main flow
      try {
        this.log('Attempting Claude fallback after error...');
        return await this.claudeFallbackGeneration(userPrompt);
      } catch (fallbackError: any) {
        // If fallback also fails, return the original error
        return {
          success: false,
          error: error.message,
          prompt: userPrompt
        };
      }
    }
  }

  /**
   * Fallback generation using Claude directly when Perplexity fails
   * @param userPrompt - User's design request
   * @returns Generated code and metadata
   */
  private async claudeFallbackGeneration(userPrompt: string): Promise<GenerationResult> {
    try {
      this.log('Using Claude fallback for direct code generation');
      
      // 1. Extract design system preferences from the prompt
      const designSystem = this.extractDesignSystemPreference(userPrompt);
      const componentType = this.extractComponentType(userPrompt);
      
      // 2. Get example code snippets for the design system to provide context
      const exampleSnippets = await this.fetchDesignSystemExamples(designSystem);
      
      // 3. Create a special prompt for Claude with example snippets
      const claudePrompt = this.createClaudeFallbackPrompt(userPrompt, designSystem, componentType, exampleSnippets);
      
      // 4. Call Claude API directly
      const claudeResponse = await this.callClaudeDirectly(claudePrompt);
      
      // 5. Format the response
      return {
        success: true,
        prompt: userPrompt,
        result: {
          code: {
            frontend: claudeResponse.code || null,
            backend: claudeResponse.backendCode || null
          },
          explanation: claudeResponse.explanation || 'Generated with Claude'
        },
        metadata: {
          componentType: componentType,
          designSystem: designSystem,
          timestamp: new Date().toISOString(),
          usedFallback: true
        }
      };
    } catch (error: any) {
      this.log('Fallback generation failed:', error.message);
      return {
        success: false,
        error: `Fallback generation failed: ${error.message}`,
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
   * Fetch example code snippets for a given design system
   */
  private async fetchDesignSystemExamples(designSystem: string): Promise<string[]> {
    // This would ideally fetch real examples from a repository or documentation
    // For now, we'll return some basic examples based on the design system
    
    // Sample examples for shadcn/ui
    const shadcnExamples = [
      `import { Button } from "@/components/ui/button"
export function ButtonDemo() {
  return (
    <Button variant="outline">Button</Button>
  )
}`,
      `import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
export function CardDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card Content</p>
      </CardContent>
      <CardFooter>
        <p>Card Footer</p>
      </CardFooter>
    </Card>
  )
}`,
      `import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
export function InputDemo() {
  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Email" />
    </div>
  )
}`
    ];
    
    // Return examples based on design system
    switch (designSystem.toLowerCase()) {
      case 'shadcn/ui':
        return shadcnExamples;
      default:
        return shadcnExamples; // Default to shadcn/ui examples
    }
  }

  /**
   * Create a prompt for Claude fallback generation
   */
  private createClaudeFallbackPrompt(userPrompt: string, designSystem: string, componentType: string, exampleSnippets: string[]): string {
    return `
You are an expert UI developer specializing in creating beautiful React applications.

# TASK
I need you to create a ${componentType} based on my requirements. I could not find an exact match, so please create it from scratch.

# USER REQUIREMENTS
"${userPrompt}"

# DESIGN SYSTEM
You should use ${designSystem} for this component.

# EXAMPLES
Here are some examples of ${designSystem} components:

${exampleSnippets.map((snippet, index) => `Example ${index + 1}:\n\`\`\`jsx\n${snippet}\n\`\`\``).join('\n\n')}

# TECHNICAL REQUIREMENTS
- Create a React component that fulfills the user's requirements
- Use ${designSystem} components and styling
- Use TypeScript with proper type definitions
- Make the component fully responsive and accessible
- Ensure the code is clean, well-organized, and follows best practices
- Add appropriate TypeScript types and comments

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

If backend code is needed, include it after the frontend code:

\`\`\`javascript
// Backend code here (if needed)...
\`\`\`

Finally, provide a brief explanation of the component and how to use it.
`;
  }

  /**
   * Call Claude API directly with a prompt
   */
  private async callClaudeDirectly(prompt: string): Promise<any> {
    try {
      // Use the existing customizer to call Claude
      // But create a minimal design result to pass to the customizer
      const minimalDesignResult: DesignCodeResult = {
        success: true,
        requirements: {
          originalPrompt: prompt,
          componentType: this.extractComponentType(prompt),
          framework: 'react',
          designSystem: this.extractDesignSystemPreference(prompt),
          styles: ['beautiful'],
          isFullStack: prompt.toLowerCase().includes('backend') || prompt.toLowerCase().includes('api'),
        },
        code: "// Placeholder code - Claude will replace this",
        metadata: {
          query: prompt,
          designSystem: this.extractDesignSystemPreference(prompt),
        }
      };
      
      // Call Claude through the customizer
      const claudeResponse = await this.customizer.customizeCode(minimalDesignResult);
      
      if (!claudeResponse || !claudeResponse.success) {
        throw new Error(claudeResponse?.error || 'Failed to generate code with Claude');
      }
      
      return {
        code: claudeResponse.customizedCode?.frontend,
        backendCode: claudeResponse.customizedCode?.backend,
        explanation: claudeResponse.explanation
      };
    } catch (error: any) {
      this.log('Error calling Claude directly:', error);
      throw error;
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
