/**
 * Enhanced UI Design Scraper using Perplexity AI
 * This tool uses Perplexity AI to find and extract UI component code from a comprehensive list of design systems
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
  requirements?: {
    originalPrompt: string;
    componentType: string;
    framework: string | null;
    designSystem: string | null;
    styles: string[];
    isFullStack: boolean;
  };
  code?: string | null;
  metadata?: any;
  error?: string | null;
}

export class EnhancedPerplexityUIScraper {
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    
    // API endpoints
    this.perplexityEndpoint = "https://api.perplexity.ai/chat/completions";
    
    // Rate limiting parameters
    this.maxRequestsPerMinute = 5;
    this.requestTimestamps = [];
    
    // Initialize design sources with categories
    this.initializeDesignSources();
  }
  
  private apiKey: string;
  private perplexityEndpoint: string;
  private maxRequestsPerMinute: number;
  private requestTimestamps: number[];
  private designSources: Array<{ name: string, url: string, priority: number }>;
  private generalLibraries: Array<{ name: string, url: string, priority: number }>;
  private reactLibraries: Array<{ name: string, url: string, priority: number }>;
  private tailwindLibraries: Array<{ name: string, url: string, priority: number }>;
  private vueLibraries: Array<{ name: string, url: string, priority: number }>;
  private otherFrameworkLibraries: Array<{ name: string, url: string, priority: number }>;
  private frameworkAgnosticLibraries: Array<{ name: string, url: string, priority: number }>;
  private designSystems: Array<{ name: string, url: string, priority: number }>;
  private componentLibraries: Array<{ name: string, url: string, priority: number }>;

  /**
   * Initialize all design sources with categorization
   */
  initializeDesignSources() {
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
      { name: "react-bootstrap", url: "https://react-bootstrap.github.io", priority: 8 },
      { name: "react-spectrum", url: "https://react-spectrum.adobe.com", priority: 7 },
      { name: "blueprintjs", url: "https://blueprintjs.com", priority: 7 },
      { name: "rebass", url: "https://rebassjs.org", priority: 6 },
      { name: "evergreen", url: "https://evergreen.segment.com", priority: 7 },
      { name: "grommet", url: "https://v2.grommet.io", priority: 6 },
      { name: "semantic-ui-react", url: "https://react.semantic-ui.com", priority: 7 },
      { name: "fluent-ui", url: "https://developer.microsoft.com/en-us/fluentui", priority: 7 },
      { name: "rsuite", url: "https://rsuitejs.com", priority: 6 }
    ];
    
    // Tailwind CSS-focused libraries
    this.tailwindLibraries = [
      { name: "tailwind-ui", url: "https://tailwindui.com", priority: 10 },
      { name: "tailwind-components", url: "https://tailwindcomponents.com", priority: 8 },
      { name: "tailwind-toolbox", url: "https://tailwindtoolbox.com", priority: 7 },
      { name: "tailblocks", url: "https://tailblocks.cc", priority: 7 },
      { name: "hyperui", url: "https://hyperui.dev", priority: 8 },
      { name: "flowbite", url: "https://flowbite.com", priority: 8 },
      { name: "daisyui", url: "https://daisyui.com", priority: 8 },
      { name: "meraki-ui", url: "https://merakiui.com", priority: 7 },
      { name: "kometa-ui", url: "https://kitwind.io/products/kometa", priority: 7 },
      { name: "wicked-blocks", url: "https://wickedblocks.dev", priority: 7 },
      { name: "treact", url: "https://treact.owaiskhan.me", priority: 6 },
      { name: "lofi-ui", url: "https://lofiui.co", priority: 7 },
      { name: "tailwind-elements", url: "https://tailwind-elements.com", priority: 7 },
      { name: "kitwind", url: "https://kitwind.io", priority: 7 },
      { name: "tailwind-awesome", url: "https://tailwindawesome.com", priority: 6 }
    ];
    
    // Vue-focused libraries
    this.vueLibraries = [
      { name: "vuetify", url: "https://vuetifyjs.com", priority: 8 },
      { name: "quasar", url: "https://quasar.dev", priority: 8 },
      { name: "element-plus", url: "https://element-plus.org", priority: 7 },
      { name: "primevue", url: "https://primevue.org", priority: 7 },
      { name: "vue-tailwind", url: "https://vue-tailwind.com", priority: 7 },
      { name: "vant-ui", url: "https://vant-ui.github.io/vant", priority: 6 },
      { name: "buefy", url: "https://buefy.org", priority: 6 }
    ];
    
    // Svelte and Angular libraries
    this.otherFrameworkLibraries = [
      { name: "svelte-material-ui", url: "https://sveltematerialui.com", priority: 6 },
      { name: "sveltestrap", url: "https://sveltestrap.js.org", priority: 6 },
      { name: "sveltekit-ui", url: "https://github.com/huntabyte/shadcn-svelte", priority: 6 },
      { name: "angular-material", url: "https://material.angular.io", priority: 7 },
      { name: "ng-zorro", url: "https://ng.ant.design", priority: 6 },
      { name: "primeng", url: "https://primeng.org", priority: 6 }
    ];
    
    // Framework-agnostic libraries
    this.frameworkAgnosticLibraries = [
      { name: "bootstrap", url: "https://getbootstrap.com", priority: 8 },
      { name: "bulma", url: "https://bulma.io", priority: 7 },
      { name: "foundation", url: "https://get.foundation", priority: 7 },
      { name: "spectre", url: "https://picturepan2.github.io/spectre", priority: 6 },
      { name: "milligram", url: "https://milligram.io", priority: 6 },
      { name: "uikit", url: "https://getuikit.com", priority: 7 }
    ];
    
    // Design systems
    this.designSystems = [
      { name: "atlassian-design", url: "https://atlassian.design", priority: 7 },
      { name: "carbon-design", url: "https://carbondesignsystem.com", priority: 8 },
      { name: "lightning-design", url: "https://www.lightningdesignsystem.com", priority: 7 },
      { name: "polaris", url: "https://polaris.shopify.com", priority: 7 },
      { name: "base-web", url: "https://baseweb.design", priority: 6 },
      { name: "material-design", url: "https://material.io", priority: 8 },
      { name: "clarity-design", url: "https://clarity.design", priority: 7 },
      { name: "elastic-ui", url: "https://elastic.github.io/eui", priority: 6 }
    ];
    
    // Component libraries and block collections
    this.componentLibraries = [
      { name: "uiverse", url: "https://uiverse.io", priority: 7 },
      { name: "copyui", url: "https://copyui.com", priority: 7 },
      { name: "blocks-ui", url: "https://blocks-ui.com", priority: 6 },
      { name: "framer-components", url: "https://framer.com/features/components", priority: 6 },
      { name: "ui-bakery", url: "https://ui.bakery.io", priority: 6 },
      { name: "shuffle", url: "https://shuffle.dev", priority: 7 },
      { name: "ui-deck", url: "https://uideck.com", priority: 6 },
      { name: "cruip", url: "https://cruip.com", priority: 6 },
      { name: "devdojo", url: "https://devdojo.com/components", priority: 6 },
      { name: "frontendor", url: "https://frontendor.com", priority: 6 },
      { name: "little-ui", url: "https://littleui.dev", priority: 6 },
      { name: "heroicons", url: "https://heroicons.com", priority: 6 },
      { name: "lucide-icons", url: "https://lucide.dev", priority: 6 }
    ];
    
    // Combine all libraries into a flat array
    this.designSources = [
      ...this.generalLibraries,
      ...this.reactLibraries,
      ...this.tailwindLibraries,
      ...this.vueLibraries,
      ...this.otherFrameworkLibraries,
      ...this.frameworkAgnosticLibraries,
      ...this.designSystems,
      ...this.componentLibraries
    ];
  }
  
  /**
   * Process a user prompt to extract UI design code
   * @param userPrompt - User's design request
   * @returns Found UI design code and metadata
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
   * @param prompt - User prompt
   * @returns Structured requirements
   */
  parseUserPrompt(prompt: string) {
    const promptLower = prompt.toLowerCase();
    
    // Component types to look for
    const componentTypes = [
      { name: "dashboard", keywords: ["dashboard", "admin panel", "analytics dashboard", "stats dashboard", "admin dashboard"] },
      { name: "form", keywords: ["form", "input form", "contact form", "sign-up form", "login form", "registration form", "survey form"] },
      { name: "table", keywords: ["table", "data table", "data grid", "spreadsheet", "datatable", "data display"] },
      { name: "card", keywords: ["card", "product card", "pricing card", "info card", "profile card", "card component"] },
      { name: "navbar", keywords: ["navbar", "navigation", "header", "menu", "nav", "navigation bar", "top bar"] },
      { name: "modal", keywords: ["modal", "dialog", "popup", "overlay", "modal dialog", "lightbox"] },
      { name: "button", keywords: ["button", "button group", "action button", "cta button", "button component"] },
      { name: "sidebar", keywords: ["sidebar", "side navigation", "side menu", "drawer", "offcanvas"] },
      { name: "tab", keywords: ["tab", "tabs", "tab panel", "tabbed interface", "tab navigation"] },
      { name: "dropdown", keywords: ["dropdown", "select", "combobox", "dropdown menu", "select menu"] },
      { name: "slider", keywords: ["slider", "range slider", "carousel", "image slider", "slideshow"] },
      { name: "toggle", keywords: ["toggle", "switch", "checkbox", "radio", "radio button"] },
      { name: "pagination", keywords: ["pagination", "page navigation", "pager"] },
      { name: "alert", keywords: ["alert", "notification", "toast", "banner", "message"] },
      { name: "avatar", keywords: ["avatar", "profile picture", "user icon"] },
      { name: "badge", keywords: ["badge", "tag", "label", "pill", "status indicator"] },
      { name: "breadcrumb", keywords: ["breadcrumb", "breadcrumb navigation", "path navigation"] },
      { name: "chart", keywords: ["chart", "graph", "data visualization", "plot", "diagram"] },
      { name: "footer", keywords: ["footer", "page footer", "site footer"] },
      { name: "hero", keywords: ["hero", "hero section", "banner", "jumbotron"] },
      { name: "accordion", keywords: ["accordion", "collapse", "expandable", "disclosure"] },
      { name: "toast", keywords: ["toast", "toast notification", "snackbar"] },
      { name: "tooltip", keywords: ["tooltip", "popover", "hover information"] },
      { name: "calendar", keywords: ["calendar", "date picker", "datepicker", "date selector"] },
      { name: "list", keywords: ["list", "list group", "item list", "list component"] }
    ];
    
    // Frameworks to look for
    const frameworks = [
      { name: "react", keywords: ["react", "reactjs", "react.js", "react component"] },
      { name: "vue", keywords: ["vue", "vuejs", "vue.js", "vue component"] },
      { name: "angular", keywords: ["angular", "angularjs", "angular component"] },
      { name: "svelte", keywords: ["svelte", "sveltekit", "svelte component"] },
      { name: "tailwind", keywords: ["tailwind", "tailwindcss", "tailwind css"] }
    ];
    
    // Design systems to look for
    const designSystems = [
      // General & Multi-Framework
      { name: "shadcn/ui", keywords: ["shadcn", "shadcn/ui", "shadcn ui"] },
      { name: "preline-ui", keywords: ["preline", "preline ui", "preline-ui"] },
      { name: "magic-ui", keywords: ["magic ui", "magic-ui", "magicui"] },
      { name: "accenticity-ui", keywords: ["accenticity", "accenticity ui", "accenticity-ui"] },
      { name: "eldora-ui", keywords: ["eldora", "eldora ui", "eldora-ui"] },
      
      // React-Focused
      { name: "material-ui", keywords: ["mui", "material ui", "material-ui"] },
      { name: "chakra-ui", keywords: ["chakra", "chakra ui", "chakra-ui"] },
      { name: "ant-design", keywords: ["ant design", "antd", "ant-design"] },
      { name: "mantine", keywords: ["mantine", "mantine ui"] },
      
      // Tailwind-Focused
      { name: "tailwind-ui", keywords: ["tailwind ui", "tailwindui"] },
      { name: "daisy-ui", keywords: ["daisy ui", "daisyui", "daisy-ui"] },
      { name: "flowbite", keywords: ["flowbite", "flowbite ui", "flowbite-ui"] },
      
      // Other popular libraries
      { name: "bootstrap", keywords: ["bootstrap", "react bootstrap", "bootstrap 5"] },
      { name: "bulma", keywords: ["bulma", "bulma css", "bulma.io"] },
      { name: "primereact", keywords: ["prime react", "primereact"] },
      { name: "vuetify", keywords: ["vuetify", "vuetify.js"] }
    ];
    
    // Style preferences to look for
    const stylePreferences = [
      { name: "white", keywords: ["white", "light", "bright", "clean", "clear", "minimal white"] },
      { name: "dark", keywords: ["dark", "black", "night mode", "dark mode", "dark theme"] },
      { name: "beautiful", keywords: ["beautiful", "pretty", "elegant", "attractive", "stunning", "gorgeous"] },
      { name: "minimal", keywords: ["minimal", "minimalist", "simple", "clean", "sleek"] },
      { name: "colorful", keywords: ["colorful", "vibrant", "multicolor", "rainbow", "vivid"] },
      { name: "professional", keywords: ["professional", "business", "corporate", "enterprise"] },
      { name: "modern", keywords: ["modern", "contemporary", "trendy", "fresh"] },
      { name: "glassmorphism", keywords: ["glass", "glassmorphism", "frosted glass", "glass effect"] },
      { name: "neumorphism", keywords: ["neumorphism", "soft ui", "neumorphic"] },
      { name: "flat", keywords: ["flat", "flat design", "flat ui"] },
      { name: "gradient", keywords: ["gradient", "gradients", "gradient background"] },
      { name: "rounded", keywords: ["rounded", "rounded corners", "curved", "soft edges"] },
      { name: "shadow", keywords: ["shadow", "shadows", "drop shadow", "box-shadow"] },
      { name: "animated", keywords: ["animated", "animation", "animations", "motion", "transitions"] }
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
                   promptLower.includes("full-stack") ||
                   promptLower.includes("backend") ||
                   promptLower.includes("back end") ||
                   promptLower.includes("back-end")
    };
  }
  
  /**
   * Find the best matching category from a list
   * @param text - Text to search in
   * @param categories - Categories with keywords
   * @returns Best matching category name or null
   */
  findBestMatch(text: string, categories: { name: string; keywords: string[] }[]) {
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
   * @param requirements - Parsed requirements
   * @returns Search queries
   */
  generateSearchQueries(requirements: any) {
    const queries = [];
    const { componentType, framework, designSystem, styles } = requirements;
    
    // Base query elements
    const styleTerms = styles.join(" ");
    
    // Step 1: Create framework-specific queries if a framework was specified
    if (framework) {
      queries.push(
        `${framework} ${componentType} component code example${designSystem ? ' ' + designSystem : ''}${styleTerms ? ' ' + styleTerms : ''}`,
        `${framework} ${componentType} implementation${designSystem ? ' ' + designSystem : ''}${styleTerms ? ' ' + styleTerms : ''}`
      );
    }
    
    // Step 2: Create design system-specific queries if one was specified
    if (designSystem) {
      // Find the source URL for the requested design system
      const designSource = this.designSources.find(source => 
        source.name.toLowerCase() === designSystem.toLowerCase()
      );
      
      if (designSource) {
        // Create specific queries for this design system
        queries.push(
          `${designSource.url} ${componentType} component code example${styleTerms ? ' ' + styleTerms : ''}`,
          `${designSystem} ${componentType} react component code${styleTerms ? ' ' + styleTerms : ''}`,
          `${designSystem} ${componentType} implementation code${styleTerms ? ' ' + styleTerms : ''}`
        );
      }
    }
    
    // Step 3: Add general high-quality design system queries
    const targetLibraries = framework === 'react' ? this.reactLibraries :
                           framework === 'vue' ? this.vueLibraries :
                           framework === 'tailwind' ? this.tailwindLibraries :
                           this.generalLibraries;
    
    // Get top design sources based on priority
    const topSources = targetLibraries
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5);
    
    // Add queries for top design systems
    for (const source of topSources) {
      queries.push(
        `${source.name} ${componentType} component code example${styleTerms ? ' ' + styleTerms : ''}`,
        `${source.url} ${componentType} code example${styleTerms ? ' ' + styleTerms : ''}`
      );
    }
    
    // Step 4: Add generic queries that might find good examples
    queries.push(
      `best ${componentType} component designs with code${framework ? ' ' + framework : ''}${styleTerms ? ' ' + styleTerms : ''}`,
      `${componentType} component code example${framework ? ' ' + framework : ''}${styleTerms ? ' ' + styleTerms : ''}`,
      `react ${componentType} component implementation${styleTerms ? ' ' + styleTerms : ''}`
    );
    
    // Step 5: Add some repository/specific site queries
    queries.push(
      `github.com ${componentType} component${framework ? ' ' + framework : ''}${styleTerms ? ' ' + styleTerms : ''}`,
      `codepen.io ${componentType} component${framework ? ' ' + framework : ''}${styleTerms ? ' ' + styleTerms : ''}`,
      `uiverse.io ${componentType} component${styleTerms ? ' ' + styleTerms : ''}`
    );
    
    // Remove duplicates and return
    return [...new Set(queries)];
  }
  
  /**
   * Execute searches using Perplexity AI
   * @param queries - Search queries
   * @returns Search results
   */
  async executePerplexitySearches(queries: string[]) {
    const results = [];
    
    // Only use the top 3 queries to avoid excessive API calls
    const topQueries = queries.slice(0, 3);
    
    for (const query of topQueries) {
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
      } catch (error: any) {
        console.warn(`Error executing search for query "${query}":`, error.message);
        // Continue with other queries even if one fails
      }
    }
    
    return results;
  }
  
  /**
   * Respect API rate limits
   */
  async respectRateLimits() {
    const now = Date.now();
    
    // Remove timestamps older than 1 minute
    this.requestTimestamps = this.requestTimestamps.filter(timestamp => 
      now - timestamp < 60000
    );
    
    // If we've reached the limit, wait until we can make another request
    if (this.requestTimestamps.length >= this.maxRequestsPerMinute) {
      const oldestTimestamp = this.requestTimestamps[0];
      const timeToWait = 60000 - (now - oldestTimestamp);
      
      if (timeToWait > 0) {
        await new Promise(resolve => setTimeout(resolve, timeToWait));
      }
      
      // Remove the oldest timestamp
      this.requestTimestamps.shift();
    }
  }
  
  /**
   * Call Perplexity API
   */
  async callPerplexityAPI(query: string) {
    try {
      // Real implementation
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
          max_tokens: 4000,
          temperature: 0.2,
          top_p: 0.9,
          frequency_penalty: 1,
          presence_penalty: 0
        })
      });
      
      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }
      
      // Record this request for rate limiting
      this.requestTimestamps.push(Date.now());
      
      return await response.json();
    } catch (error: any) {
      console.error("Error calling Perplexity API:", error);
      throw new Error(`Failed to search with Perplexity: ${error.message}`);
    }
  }
  
  /**
   * Extract code from search results
   */
  async extractCodeFromResults(searchResults: any[], requirements: any) {
    if (searchResults.length === 0) {
      return null;
    }
    
    // Process each result to extract code blocks
    for (const searchResult of searchResults) {
      try {
        const content = searchResult.result.choices[0].message.content;
        
        // Extract code blocks
        const codeBlockRegex = /```(?:jsx|js|javascript|tsx|ts|typescript|react)([\s\S]*?)```/;
        const match = content.match(codeBlockRegex);
        
        if (match && match[1]) {
          const code = match[1].trim();
          
          // Determine component type and design system from the code
          let designSystem = "unknown";
          if (content.toLowerCase().includes("shadcn")) designSystem = "shadcn/ui";
          else if (content.toLowerCase().includes("tailwind")) designSystem = "tailwindcss";
          else if (content.toLowerCase().includes("material")) designSystem = "material-ui";
          else if (content.toLowerCase().includes("chakra")) designSystem = "chakra-ui";
          
          return {
            code,
            metadata: {
              query: searchResult.query,
              designSystem,
              componentType: requirements.componentType
            }
          };
        }
      } catch (error) {
        console.warn("Error extracting code from search result:", error);
        // Continue with other results if one fails
      }
    }
    
    return null;
  }
}
