
/**
 * Enhanced UI Design Scraper using Perplexity AI
 * This tool uses Perplexity AI to find and extract UI component code from design systems
 */

// Design source interface
interface DesignSource {
  name: string;
  url: string;
  priority: number;
}

// Design requirements interface
export interface DesignRequirements {
  originalPrompt: string;
  componentType: string;
  framework: string | null;
  designSystem: string | null;
  styles: string[];
  isFullStack: boolean;
}

export interface DesignCodeResult {
  success: boolean;
  requirements?: DesignRequirements;
  code?: string | null;
  metadata?: any | null;
  error?: string | null;
}

export class EnhancedPerplexityUIScraper {
  private apiKey: string;
  private perplexityEndpoint = "https://api.perplexity.ai/chat/completions";
  private maxRequestsPerMinute = 5;
  private requestTimestamps: number[] = [];
  
  // Design source collections
  private generalLibraries: DesignSource[] = [];
  private reactLibraries: DesignSource[] = [];
  private tailwindLibraries: DesignSource[] = [];
  private designSources: DesignSource[] = [];
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.initializeDesignSources();
  }
  
  /**
   * Initialize all design sources with categorization
   */
  private initializeDesignSources() {
    // General & Multi-Framework UI libraries
    this.generalLibraries = [
      { name: "shadcn/ui", url: "https://ui.shadcn.com", priority: 10 },
      { name: "preline-ui", url: "https://preline.co", priority: 9 },
      { name: "magic-ui", url: "https://magicui.design", priority: 9 },
      { name: "accenticity-ui", url: "https://accenticity.com", priority: 8 },
      { name: "eldora-ui", url: "https://eldoraui.com", priority: 8 },
      { name: "uncoverlab", url: "https://uncoverlab.com", priority: 7 },
      { name: "21st.dev", url: "https://21st.dev", priority: 8 }
    ];
    
    // React-focused UI libraries
    this.reactLibraries = [
      { name: "material-ui", url: "https://mui.com", priority: 9 },
      { name: "chakra-ui", url: "https://chakra-ui.com", priority: 9 },
      { name: "ant-design", url: "https://ant.design", priority: 8 },
      { name: "react-suite", url: "https://rsuitejs.com", priority: 7 },
      { name: "mantine", url: "https://mantine.dev", priority: 8 },
      { name: "primereact", url: "https://primereact.org", priority: 7 },
      { name: "react-bootstrap", url: "https://react-bootstrap.github.io", priority: 8 }
    ];
    
    // Tailwind CSS-focused libraries
    this.tailwindLibraries = [
      { name: "tailwind-ui", url: "https://tailwindui.com", priority: 10 },
      { name: "hyperui", url: "https://hyperui.dev", priority: 8 },
      { name: "flowbite", url: "https://flowbite.com", priority: 8 },
      { name: "daisyui", url: "https://daisyui.com", priority: 8 }
    ];
    
    // Combine all libraries into a flat array
    this.designSources = [
      ...this.generalLibraries,
      ...this.reactLibraries,
      ...this.tailwindLibraries
    ];
  }
  
  /**
   * Process a user prompt to extract UI design code
   * @param userPrompt - User's design request
   * @returns Promise<DesignCodeResult> - Found UI design code and metadata
   */
  async findDesignCode(userPrompt: string): Promise<DesignCodeResult> {
    try {
      // 1. Parse the prompt to identify requirements
      const requirements = this.parseUserPrompt(userPrompt);
      
      // 2. Generate search queries for Perplexity AI
      const searchQueries = this.generateSearchQueries(requirements);
      
      // 3. Execute searches with Perplexity AI
      const searchResults = await this.executePerplexitySearches(searchQueries);
      
      // 4. Extract code from search results
      const extractedCode = await this.extractCodeFromResults(searchResults, requirements);
      
      // 5. Return the results
      return {
        success: !!extractedCode,
        requirements,
        code: extractedCode?.code || null,
        metadata: extractedCode?.metadata || null,
        error: !extractedCode ? "Could not find matching design code" : null
      };
    } catch (error: any) {
      console.error("Error finding design code:", error);
      return {
        success: false,
        error: error.message || "Unknown error occurred"
      };
    }
  }
  
  /**
   * Parse a user prompt to identify design requirements
   */
  private parseUserPrompt(prompt: string): DesignRequirements {
    const promptLower = prompt.toLowerCase();
    
    // Component types to look for
    const componentTypes = [
      { name: "dashboard", keywords: ["dashboard", "admin panel", "analytics dashboard"] },
      { name: "form", keywords: ["form", "input form", "contact form", "sign-up form"] },
      { name: "table", keywords: ["table", "data table", "data grid", "spreadsheet"] },
      { name: "card", keywords: ["card", "product card", "pricing card", "info card"] },
      { name: "navbar", keywords: ["navbar", "navigation", "header", "menu", "nav"] },
      { name: "modal", keywords: ["modal", "dialog", "popup", "overlay", "modal dialog"] }
    ];
    
    // Frameworks to look for
    const frameworks = [
      { name: "react", keywords: ["react", "reactjs", "react.js", "react component"] },
      { name: "tailwind", keywords: ["tailwind", "tailwindcss", "tailwind css"] }
    ];
    
    // Design systems to look for
    const designSystems = [
      { name: "shadcn/ui", keywords: ["shadcn", "shadcn/ui", "shadcn ui"] },
      { name: "material-ui", keywords: ["mui", "material ui", "material-ui"] },
      { name: "tailwind-ui", keywords: ["tailwind ui", "tailwindui"] }
    ];
    
    // Style preferences to look for
    const stylePreferences = [
      { name: "white", keywords: ["white", "light", "bright", "clean", "clear"] },
      { name: "dark", keywords: ["dark", "black", "night mode", "dark mode"] },
      { name: "beautiful", keywords: ["beautiful", "pretty", "elegant", "attractive"] },
      { name: "minimal", keywords: ["minimal", "minimalist", "simple", "clean"] }
    ];
    
    // Find the best matching component type
    const componentType = this.findBestMatch(promptLower, componentTypes) || "component";
    
    // Find framework preference (if any)
    const framework = this.findBestMatch(promptLower, frameworks);
    
    // Find design system preference (if any)
    const designSystem = this.findBestMatch(promptLower, designSystems);
    
    // Find style preferences
    const styles = stylePreferences
      .filter(style => style.keywords.some(keyword => promptLower.includes(keyword)))
      .map(style => style.name);
    
    return {
      originalPrompt: prompt,
      componentType,
      framework,
      designSystem,
      styles,
      isFullStack: promptLower.includes("full stack") || 
                   promptLower.includes("fullstack") || 
                   promptLower.includes("full-stack")
    };
  }
  
  /**
   * Find the best matching category from a list
   */
  private findBestMatch(text: string, categories: {name: string, keywords: string[]}[]): string | null {
    let bestMatch = null;
    let bestScore = 0;
    
    for (const category of categories) {
      // Count how many keywords match
      const matchingKeywords = category.keywords.filter(keyword => 
        text.includes(keyword.toLowerCase())
      );
      
      const score = matchingKeywords.length;
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = category.name;
      }
    }
    
    return bestScore > 0 ? bestMatch : null;
  }
  
  /**
   * Generate search queries based on requirements
   */
  private generateSearchQueries(requirements: DesignRequirements): string[] {
    const queries: string[] = [];
    const { componentType, framework, designSystem, styles } = requirements;
    
    // Base query elements
    const styleTerms = styles.join(" ");
    
    // Create design system-specific queries if one was specified
    if (designSystem) {
      // Find the source URL for the requested design system
      const designSource = this.designSources.find(source => 
        source.name.toLowerCase() === designSystem.toLowerCase()
      );
      
      if (designSource) {
        // Create specific queries for this design system
        queries.push(
          `${designSource.url} ${componentType} component code example${styleTerms ? ' ' + styleTerms : ''}`,
          `${designSystem} ${componentType} react component code${styleTerms ? ' ' + styleTerms : ''}`
        );
      }
    }
    
    // Add framework-specific queries
    if (framework) {
      queries.push(
        `${framework} ${componentType} component code example${designSystem ? ' ' + designSystem : ''}${styleTerms ? ' ' + styleTerms : ''}`,
        `${framework} ${componentType} implementation${designSystem ? ' ' + designSystem : ''}${styleTerms ? ' ' + styleTerms : ''}`
      );
    }
    
    // Add general queries
    queries.push(
      `best ${componentType} component designs with code${framework ? ' ' + framework : ''}${styleTerms ? ' ' + styleTerms : ''}`,
      `${componentType} component code example${framework ? ' ' + framework : ''}${styleTerms ? ' ' + styleTerms : ''}`
    );
    
    // Remove duplicates and return
    return [...new Set(queries)].slice(0, 3); // Limit to top 3 queries
  }
  
  /**
   * Execute searches using Perplexity AI
   */
  private async executePerplexitySearches(queries: string[]): Promise<any[]> {
    const results = [];
    
    for (const query of queries) {
      try {
        // Respect rate limits
        await this.respectRateLimits();
        
        // Call Perplexity API
        const searchResult = await this.callPerplexityAPI(query);
        
        if (searchResult) {
          results.push({
            query,
            result: searchResult
          });
        }
      } catch (error) {
        console.warn(`Error executing search for query "${query}":`, error);
        // Continue with other queries even if one fails
      }
    }
    
    return results;
  }
  
  /**
   * Respect rate limits by delaying if necessary
   */
  private async respectRateLimits(): Promise<void> {
    const now = Date.now();
    
    // Remove timestamps older than 1 minute
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < 60000
    );
    
    // Check if we've exceeded the rate limit
    if (this.requestTimestamps.length >= this.maxRequestsPerMinute) {
      // Calculate how long to wait
      const oldestTimestamp = this.requestTimestamps[0];
      const timeToWait = 60000 - (now - oldestTimestamp) + 100; // Add 100ms buffer
      
      // Wait until we can make another request
      await new Promise(resolve => setTimeout(resolve, timeToWait));
    }
  }
  
  /**
   * Call Perplexity AI API
   */
  private async callPerplexityAPI(query: string): Promise<any> {
    try {
      // Record this request for rate limiting
      this.requestTimestamps.push(Date.now());
      
      const response = await fetch(this.perplexityEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant for finding UI component code. Focus on finding complete, well-implemented components from high-quality design systems and UI libraries."
            },
            {
              role: "user",
              content: `Find the full implementation code for ${query}. Include all necessary imports and CSS. Return the complete code with any explanations of how it works. Focus on production-quality implementations from official documentation or high-quality examples.`
            }
          ],
          temperature: 0.2,
          top_p: 0.9,
          max_tokens: 4000
        })
      });
      
      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error calling Perplexity API:", error);
      throw new Error(`Failed to search with Perplexity: ${error}`);
    }
  }
  
  /**
   * Extract code from search results
   */
  private async extractCodeFromResults(searchResults: any[], requirements: DesignRequirements): Promise<{code: string, metadata: any} | null> {
    if (!searchResults || searchResults.length === 0) {
      return null;
    }
    
    // Extract code blocks from all results
    let allCodeBlocks: string[] = [];
    let bestCodeMetadata = null;
    
    for (const result of searchResults) {
      try {
        if (result.result?.choices && result.result.choices[0]?.message?.content) {
          const content = result.result.choices[0].message.content;
          
          // Extract code blocks
          const codeBlockRegex = /```(?:jsx|tsx|js|ts|html|css|javascript|typescript)?([\s\S]+?)```/g;
          let match;
          
          while ((match = codeBlockRegex.exec(content)) !== null) {
            if (match[1]) {
              allCodeBlocks.push(match[1].trim());
            }
          }
          
          // If no code blocks found, try to extract code another way
          if (allCodeBlocks.length === 0) {
            // Look for indented code sections or other common formats
            const alternativeCodeRegex = /<([\w\s]+)>([\s\S]+?)<\/\1>|import[\s\S]+?from/g;
            while ((match = alternativeCodeRegex.exec(content)) !== null) {
              if (match[0]) {
                allCodeBlocks.push(match[0].trim());
              }
            }
          }
          
          // Save metadata about this result
          bestCodeMetadata = {
            query: result.query,
            sourceContent: content.substring(0, 200) + '...' // Just save a preview
          };
        }
      } catch (error) {
        console.error("Error extracting code from result:", error);
        // Continue with other results
      }
    }
    
    // If no code blocks found, return null
    if (allCodeBlocks.length === 0) {
      return null;
    }
    
    // Find the longest code block (likely the most complete)
    const bestCodeBlock = allCodeBlocks.sort((a, b) => b.length - a.length)[0];
    
    return {
      code: bestCodeBlock,
      metadata: bestCodeMetadata
    };
  }
}
