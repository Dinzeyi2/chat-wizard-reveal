
// ClaudeCodeCustomizer - Uses Claude API to customize UI component code based on user requirements

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

export class ClaudeCodeCustomizer {
  private apiKey: string;
  private claudeEndpoint: string = "https://api.anthropic.com/v1/messages";
  private model: string = "claude-3-5-sonnet-20240620"; // Using available model

  // Templates for different component types
  private promptTemplates: Record<string, (scrapedDesign: DesignCodeResult, requirements: any) => string> = {
    dashboard: this.createDashboardPrompt,
    form: this.createFormPrompt,
    table: this.createTablePrompt,
    card: this.createCardPrompt,
    navbar: this.createNavbarPrompt,
    default: this.createDefaultPrompt
  };
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  /**
   * Customize component code based on user requirements
   * @param {Object} scrapedDesign - Design data from the UI scraper
   * @returns {Promise<Object>} - Customized code
   */
  async customizeCode(scrapedDesign: DesignCodeResult) {
    try {
      if (!scrapedDesign.success || !scrapedDesign.code) {
        throw new Error("Invalid scraped design data");
      }

      // 1. Create a prompt for Claude
      const prompt = this.createPrompt(scrapedDesign);
      
      // 2. Call Claude API
      const customizedCode = await this.callClaudeAPI(prompt);
      
      // 3. Extract and format the result
      return this.processClaudeResponse(customizedCode, scrapedDesign);
    } catch (error: any) {
      console.error("Error customizing code:", error);
      return {
        success: false,
        error: error.message || "Unknown error occurred"
      };
    }
  }
  
  /**
   * Create a prompt for Claude based on the component type
   */
  private createPrompt(scrapedDesign: DesignCodeResult): string {
    if (!scrapedDesign.requirements) {
      return this.createDefaultPrompt(scrapedDesign, {});
    }
    
    // Choose the appropriate template based on component type
    const componentType = scrapedDesign.requirements.componentType;
    const promptTemplate = this.promptTemplates[componentType] || this.promptTemplates.default;
    
    // Create prompt using the template
    return promptTemplate.call(this, scrapedDesign, scrapedDesign.requirements);
  }
  
  /**
   * Create a dashboard customization prompt
   */
  private createDashboardPrompt(scrapedDesign: DesignCodeResult, requirements: any): string {
    const { styles, isFullStack, originalPrompt } = requirements;
    
    // Determine style preferences
    const isWhite = styles.includes('white');
    const isDark = styles.includes('dark');
    const isBeautiful = styles.includes('beautiful');
    const isMinimal = styles.includes('minimal');
    const isColorful = styles.includes('colorful');
    const isProfessional = styles.includes('professional');
    
    // Build the style instructions
    let styleInstructions = [];
    if (isWhite) styleInstructions.push("Use a clean white theme with light backgrounds");
    if (isDark) styleInstructions.push("Use a dark theme with dark backgrounds and appropriate contrast");
    if (isBeautiful) styleInstructions.push("Make the design beautiful and visually appealing with subtle gradients, shadows, and elegant typography");
    if (isMinimal) styleInstructions.push("Keep the design minimal and clean, focusing on essential elements");
    if (isColorful) styleInstructions.push("Use a vibrant color palette to make the dashboard visually engaging");
    if (isProfessional) styleInstructions.push("Create a professional, business-appropriate aesthetic");
    
    // Default to white and beautiful if no styles specified
    if (styleInstructions.length === 0) {
      styleInstructions.push("Use a clean white theme with light backgrounds");
      styleInstructions.push("Make the design beautiful and visually appealing with subtle gradients, shadows, and elegant typography");
    }
    
    return `
You are an expert UI developer specializing in creating beautiful React applications.

# TASK
I need you to customize and enhance the provided dashboard component code based on specific requirements.

# ORIGINAL CODE
\`\`\`jsx
${scrapedDesign.code}
\`\`\`

# USER REQUIREMENTS
"${originalPrompt}"

# STYLE REQUIREMENTS
${styleInstructions.join("\n")}

# TECHNICAL REQUIREMENTS
- Maintain the same general component structure
- Ensure the component still uses the original design system (${scrapedDesign.metadata?.designSystem || 'React'})
- Make the component fully responsive
- Ensure the code is clean, well-organized, and follows best practices
${isFullStack ? "- Add a simple backend API code example that would provide data for this dashboard" : ""}

# INSTRUCTIONS
1. Customize the existing code to match the style requirements
2. Enhance the component with better organization, comments, and responsiveness
3. Do not remove existing functionality, only enhance and style it
4. Return the complete, customized component code
${isFullStack ? "5. Include a separate code block with a simple backend implementation" : ""}

# EXPECTED RESPONSE FORMAT
Provide the customized code in the following format:

\`\`\`jsx
// Frontend code here...
\`\`\`

${isFullStack ? "Then provide the backend code (if required):\n\n```javascript\n// Backend code here...\n```" : ""}

Finally, provide a brief explanation of the changes you made.
`;
  }
  
  /**
   * Create a form customization prompt
   */
  private createFormPrompt(scrapedDesign: DesignCodeResult, requirements: any): string {
    const { styles, isFullStack, originalPrompt } = requirements;
    
    // Determine style preferences
    const isWhite = styles.includes('white');
    const isDark = styles.includes('dark');
    const isBeautiful = styles.includes('beautiful');
    const isMinimal = styles.includes('minimal');
    
    // Build the style instructions
    let styleInstructions = [];
    if (isWhite) styleInstructions.push("Use a clean white theme with light backgrounds");
    if (isDark) styleInstructions.push("Use a dark theme with dark backgrounds and appropriate contrast");
    if (isBeautiful) styleInstructions.push("Make the form beautiful with subtle animations, elegant spacing, and polished input styles");
    if (isMinimal) styleInstructions.push("Keep the form minimal and clean, focusing on essential elements");
    
    // Default to white and beautiful if no styles specified
    if (styleInstructions.length === 0) {
      styleInstructions.push("Use a clean white theme with light backgrounds");
      styleInstructions.push("Make the form beautiful with subtle animations, elegant spacing, and polished input styles");
    }
    
    return `
You are an expert UI developer specializing in creating beautiful React applications.

# TASK
I need you to customize and enhance the provided form component code based on specific requirements.

# ORIGINAL CODE
\`\`\`jsx
${scrapedDesign.code}
\`\`\`

# USER REQUIREMENTS
"${originalPrompt}"

# STYLE REQUIREMENTS
${styleInstructions.join("\n")}

# TECHNICAL REQUIREMENTS
- Maintain the same general form structure
- Ensure the component still uses the original design system (${scrapedDesign.metadata?.designSystem || 'React'})
- Implement proper form validation
- Make the form fully responsive
- Ensure the code is clean, well-organized, and follows best practices
${isFullStack ? "- Add a simple backend API endpoint code that would handle the form submission" : ""}

# INSTRUCTIONS
1. Customize the existing code to match the style requirements
2. Enhance the form with better validation, organization, and responsiveness
3. Do not remove existing functionality, only enhance and style it
4. Return the complete, customized component code
${isFullStack ? "5. Include a separate code block with a simple backend implementation" : ""}

# EXPECTED RESPONSE FORMAT
Provide the customized code in the following format:

\`\`\`jsx
// Frontend code here...
\`\`\`

${isFullStack ? "Then provide the backend code (if required):\n\n```javascript\n// Backend code here...\n```" : ""}

Finally, provide a brief explanation of the changes you made.
`;
  }
  
  /**
   * Create a table customization prompt
   */
  private createTablePrompt(scrapedDesign: DesignCodeResult, requirements: any): string {
    const { styles, isFullStack, originalPrompt } = requirements;
    
    // Determine style preferences
    const isWhite = styles.includes('white');
    const isDark = styles.includes('dark');
    const isBeautiful = styles.includes('beautiful');
    
    // Build the style instructions
    let styleInstructions = [];
    if (isWhite) styleInstructions.push("Use a clean white theme with light backgrounds");
    if (isDark) styleInstructions.push("Use a dark theme with dark backgrounds and appropriate contrast");
    if (isBeautiful) styleInstructions.push("Make the table beautiful with elegant typography, subtle hover effects, and clean borders");
    
    // Default to white and beautiful if no styles specified
    if (styleInstructions.length === 0) {
      styleInstructions.push("Use a clean white theme with light backgrounds");
      styleInstructions.push("Make the table beautiful with elegant typography, subtle hover effects, and clean borders");
    }
    
    return `
You are an expert UI developer specializing in creating beautiful React applications.

# TASK
I need you to customize and enhance the provided table component code based on specific requirements.

# ORIGINAL CODE
\`\`\`jsx
${scrapedDesign.code}
\`\`\`

# USER REQUIREMENTS
"${originalPrompt}"

# STYLE REQUIREMENTS
${styleInstructions.join("\n")}

# TECHNICAL REQUIREMENTS
- Maintain the same general table structure
- Ensure the component still uses the original design system (${scrapedDesign.metadata?.designSystem || 'React'})
- Implement sorting, filtering, and pagination if not already present
- Make the table fully responsive
- Ensure the code is clean, well-organized, and follows best practices
${isFullStack ? "- Add a simple backend API endpoint code that would provide data for this table" : ""}

# INSTRUCTIONS
1. Customize the existing code to match the style requirements
2. Enhance the table with better functionality, organization, and responsiveness
3. Do not remove existing functionality, only enhance and style it
4. Return the complete, customized component code
${isFullStack ? "5. Include a separate code block with a simple backend implementation" : ""}

# EXPECTED RESPONSE FORMAT
Provide the customized code in the following format:

\`\`\`jsx
// Frontend code here...
\`\`\`

${isFullStack ? "Then provide the backend code (if required):\n\n```javascript\n// Backend code here...\n```" : ""}

Finally, provide a brief explanation of the changes you made.
`;
  }
  
  /**
   * Create a card customization prompt
   */
  private createCardPrompt(scrapedDesign: DesignCodeResult, requirements: any): string {
    const { styles, isFullStack, originalPrompt } = requirements;
    
    // Determine style preferences
    const isWhite = styles.includes('white');
    const isDark = styles.includes('dark');
    const isBeautiful = styles.includes('beautiful');
    const isMinimal = styles.includes('minimal');
    
    // Build the style instructions
    let styleInstructions = [];
    if (isWhite) styleInstructions.push("Use a clean white theme with light backgrounds");
    if (isDark) styleInstructions.push("Use a dark theme with dark backgrounds and appropriate contrast");
    if (isBeautiful) styleInstructions.push("Make the card beautiful with elegant shadows, subtle gradients, and polished typography");
    if (isMinimal) styleInstructions.push("Keep the card minimal and clean, focusing on essential elements");
    
    // Default to white and beautiful if no styles specified
    if (styleInstructions.length === 0) {
      styleInstructions.push("Use a clean white theme with light backgrounds");
      styleInstructions.push("Make the card beautiful with elegant shadows, subtle gradients, and polished typography");
    }
    
    return `
You are an expert UI developer specializing in creating beautiful React applications.

# TASK
I need you to customize and enhance the provided card component code based on specific requirements.

# ORIGINAL CODE
\`\`\`jsx
${scrapedDesign.code}
\`\`\`

# USER REQUIREMENTS
"${originalPrompt}"

# STYLE REQUIREMENTS
${styleInstructions.join("\n")}

# TECHNICAL REQUIREMENTS
- Maintain the same general card structure
- Ensure the component still uses the original design system (${scrapedDesign.metadata?.designSystem || 'React'})
- Add hover effects and transitions for better interactivity
- Make the card fully responsive
- Ensure the code is clean, well-organized, and follows best practices
${isFullStack ? "- Add a simple backend API endpoint code that would provide data for this card" : ""}

# INSTRUCTIONS
1. Customize the existing code to match the style requirements
2. Enhance the card with better organization, interactivity, and responsiveness
3. Do not remove existing functionality, only enhance and style it
4. Return the complete, customized component code
${isFullStack ? "5. Include a separate code block with a simple backend implementation" : ""}

# EXPECTED RESPONSE FORMAT
Provide the customized code in the following format:

\`\`\`jsx
// Frontend code here...
\`\`\`

${isFullStack ? "Then provide the backend code (if required):\n\n```javascript\n// Backend code here...\n```" : ""}

Finally, provide a brief explanation of the changes you made.
`;
  }
  
  /**
   * Create a navbar customization prompt
   */
  private createNavbarPrompt(scrapedDesign: DesignCodeResult, requirements: any): string {
    const { styles, isFullStack, originalPrompt } = requirements;
    
    // Determine style preferences
    const isWhite = styles.includes('white');
    const isDark = styles.includes('dark');
    const isBeautiful = styles.includes('beautiful');
    const isMinimal = styles.includes('minimal');
    
    // Build the style instructions
    let styleInstructions = [];
    if (isWhite) styleInstructions.push("Use a clean white theme with light backgrounds");
    if (isDark) styleInstructions.push("Use a dark theme with dark backgrounds and appropriate contrast");
    if (isBeautiful) styleInstructions.push("Make the navbar beautiful with subtle animations and elegant styling");
    if (isMinimal) styleInstructions.push("Keep the navbar minimal and clean, focusing on essential elements");
    
    // Default to white and beautiful if no styles specified
    if (styleInstructions.length === 0) {
      styleInstructions.push("Use a clean white theme with light backgrounds");
      styleInstructions.push("Make the navbar beautiful with subtle animations and elegant styling");
    }
    
    return `
You are an expert UI developer specializing in creating beautiful React applications.

# TASK
I need you to customize and enhance the provided navbar component code based on specific requirements.

# ORIGINAL CODE
\`\`\`jsx
${scrapedDesign.code}
\`\`\`

# USER REQUIREMENTS
"${originalPrompt}"

# STYLE REQUIREMENTS
${styleInstructions.join("\n")}

# TECHNICAL REQUIREMENTS
- Maintain the same general navbar structure
- Ensure the component still uses the original design system (${scrapedDesign.metadata?.designSystem || 'React'})
- Implement mobile responsiveness with a hamburger menu
- Add smooth transitions for dropdowns and mobile menu
- Ensure the code is clean, well-organized, and follows best practices
${isFullStack ? "- Add a simple backend API endpoint code for user authentication if relevant" : ""}

# INSTRUCTIONS
1. Customize the existing code to match the style requirements
2. Enhance the navbar with better mobile responsiveness and transitions
3. Do not remove existing functionality, only enhance and style it
4. Return the complete, customized component code
${isFullStack ? "5. Include a separate code block with a simple backend implementation" : ""}

# EXPECTED RESPONSE FORMAT
Provide the customized code in the following format:

\`\`\`jsx
// Frontend code here...
\`\`\`

${isFullStack ? "Then provide the backend code (if required):\n\n```javascript\n// Backend code here...\n```" : ""}

Finally, provide a brief explanation of the changes you made.
`;
  }
  
  /**
   * Create a default customization prompt for any component
   */
  private createDefaultPrompt(scrapedDesign: DesignCodeResult, requirements: any): string {
    const { styles = [], isFullStack = false, originalPrompt = "" } = requirements;
    const componentType = scrapedDesign.requirements?.componentType || "component";
    
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
I need you to customize and enhance the provided ${componentType} component code based on specific requirements.

# ORIGINAL CODE
\`\`\`jsx
${scrapedDesign.code}
\`\`\`

# USER REQUIREMENTS
"${originalPrompt}"

# STYLE REQUIREMENTS
${styleInstructions.join("\n")}

# TECHNICAL REQUIREMENTS
- Maintain the same general component structure
- Ensure the component still uses the original design system (${scrapedDesign.metadata?.designSystem || 'React'})
- Improve responsiveness and interactivity
- Ensure the code is clean, well-organized, and follows best practices
${isFullStack ? "- Add a simple backend API endpoint code that would support this component" : ""}

# INSTRUCTIONS
1. Customize the existing code to match the style requirements
2. Enhance the component with better organization, responsiveness, and interactivity
3. Do not remove existing functionality, only enhance and style it
4. Return the complete, customized component code
${isFullStack ? "5. Include a separate code block with a simple backend implementation" : ""}

# EXPECTED RESPONSE FORMAT
Provide the customized code in the following format:

\`\`\`jsx
// Frontend code here...
\`\`\`

${isFullStack ? "Then provide the backend code (if required):\n\n```javascript\n// Backend code here...\n```" : ""}

Finally, provide a brief explanation of the changes you made.
`;
  }
  
  /**
   * Call Claude API to customize code
   */
  private async callClaudeAPI(prompt: string) {
    try {
      const response = await fetch(this.claudeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
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
        throw new Error(`Claude API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      console.error("Error calling Claude API:", error);
      throw new Error(`Failed to customize code with Claude: ${error.message}`);
    }
  }
  
  /**
   * Process Claude API response
   */
  private processClaudeResponse(response: any, scrapedDesign: DesignCodeResult) {
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
        success: true,
        originalDesign: scrapedDesign,
        customizedCode: {
          frontend: frontendCode,
          backend: backendCode
        },
        explanation: explanation
      };
    } catch (error: any) {
      console.error("Error processing Claude response:", error);
      return {
        success: false,
        error: error.message || "Failed to process Claude's response"
      };
    }
  }
}
