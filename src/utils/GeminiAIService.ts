
import { toast } from "@/hooks/use-toast";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface GeminiCodeAnalysisParams {
  code: string;
  filename: string;
  projectId: string;
  prompt?: string;
}

interface GeminiCodeResponse {
  feedback: string;
  suggestedChanges?: string;
  status: 'success' | 'error';
}

interface ProjectContext {
  projectName: string;
  description: string;
  specification: string;
  components?: Array<{name: string, description: string}>;
  dependencies?: string[];
  architecture?: string;
  challenges?: string[];
  nextSteps?: string[];
}

/**
 * Service for interacting with Gemini AI for code analysis and assistance
 */
export class GeminiAIService {
  private apiKey: string | null = null;
  private baseUrl: string = "https://generativelanguage.googleapis.com/v1beta";
  private genAI: GoogleGenerativeAI | null = null;
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || null;
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }
  
  /**
   * Set the API key for Gemini AI
   */
  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }
  
  /**
   * Get the API key (for checking if it's set)
   */
  getApiKey(): string | null {
    return this.apiKey;
  }
  
  /**
   * Analyze code changes with Gemini AI
   */
  async analyzeCode({ code, filename, projectId, prompt }: GeminiCodeAnalysisParams): Promise<GeminiCodeResponse> {
    try {
      if (!this.apiKey || !this.genAI) {
        throw new Error("Gemini API key is not set");
      }
      
      console.log(`Analyzing ${filename} for project ${projectId}`);
      
      // Use the Gemini Pro model for code analysis
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      
      // Create the analysis prompt
      const analysisPrompt = `
        You are an expert code assistant analyzing this code:

        FILENAME: ${filename}
        CODE:
        \`\`\`
        ${code}
        \`\`\`

        ${prompt || 'Provide feedback on code quality and suggestions for improvement.'}
        
        Analyze for:
        1. Code quality and best practices
        2. Potential bugs or edge cases
        3. Performance considerations
        4. Security concerns (if applicable)
        5. Suggestions for improvement

        Format your response as:
        - First, give an overall assessment
        - Then, list specific points with line numbers where applicable
        - Finally, offer constructive suggestions
      `;
      
      // Generate the analysis
      const result = await model.generateContent(analysisPrompt);
      const feedback = result.response.text();
      
      return {
        feedback,
        status: 'success'
      };
      
    } catch (error: any) {
      console.error("Error analyzing code with Gemini:", error);
      
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error.message || "Failed to analyze code. Please try again."
      });
      
      return {
        feedback: "Failed to analyze code. Check console for details.",
        status: 'error'
      };
    }
  }
  
  /**
   * Generate code suggestions based on user request
   */
  async generateSuggestion(prompt: string, currentCode: string): Promise<string | null> {
    try {
      if (!this.apiKey || !this.genAI) {
        throw new Error("Gemini API key is not set");
      }
      
      console.log(`Generating suggestion for: ${prompt}`);
      
      // Use the Gemini Pro model for code suggestions
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      
      // Create the suggestion prompt
      const suggestionPrompt = `
        You are an expert code assistant helping with this request: "${prompt}"
        
        Here's the current code:
        \`\`\`
        ${currentCode}
        \`\`\`
        
        Generate a code implementation that addresses the request.
        Focus on:
        1. Clean, readable code following best practices
        2. Proper error handling
        3. Performance considerations
        4. Including comments to explain the implementation
        
        Provide ONLY the code solution with no explanations before or after.
      `;
      
      // Generate the suggestion
      const result = await model.generateContent(suggestionPrompt);
      const suggestion = result.response.text();
      
      return suggestion;
      
    } catch (error: any) {
      console.error("Error generating suggestion with Gemini:", error);
      
      toast({
        variant: "destructive",
        title: "Suggestion Failed",
        description: error.message || "Failed to generate code suggestion."
      });
      
      return null;
    }
  }
  
  /**
   * Initialize a new project with Gemini AI
   */
  async initializeProject(specification: string, projectName: string): Promise<any> {
    try {
      if (!this.apiKey || !this.genAI) {
        throw new Error("Gemini API key is not set");
      }
      
      // Use the Gemini Pro model
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      
      // Generate project analysis
      const analysisPrompt = `
        You are an expert full-stack developer tasked with analyzing a project specification and creating a development plan.
        
        Project Specification: "${specification}"
        
        Please provide a comprehensive analysis including:
        1. A clear understanding of what the project entails
        2. The main components/features required
        3. Appropriate technologies and dependencies
        4. Project architecture
        5. Potential challenges
        
        Format your response as JSON with the following structure:
        {
          "projectName": "${projectName || 'New Project'}",
          "description": "Brief project description",
          "specification": "The original specification",
          "components": [{"name": "ComponentName", "description": "Component purpose and details"}],
          "dependencies": ["dependency1", "dependency2"],
          "architecture": "Brief architecture description",
          "challenges": ["potential challenge 1", "potential challenge 2"],
          "nextSteps": ["suggested next step 1", "suggested next step 2"]
        }
      `;
      
      const analysisResult = await model.generateContent(analysisPrompt);
      let projectContext;
      
      try {
        // Parse the JSON response
        const analysisText = analysisResult.response.text();
        projectContext = JSON.parse(analysisText);
      } catch (parseError) {
        console.error('Error parsing project analysis:', parseError);
        
        // Fallback for non-JSON responses
        projectContext = {
          projectName: projectName || 'New Project',
          description: 'Project based on user specification',
          specification: specification,
          components: [],
          dependencies: [],
          nextSteps: ['Continue implementing the core functionality']
        };
      }
      
      // Generate initial code scaffold
      const initialCodePrompt = `
        You are an AI code assistant that helps users build software projects. Your task is to create a partial implementation of a project based on this specification:
        
        "${specification}"
        
        Important guidelines:
        1. The code should be well-structured and follow best practices
        2. Include imports, basic component structure, and key functions
        3. Implement only about 30% of the functionality, leaving the rest for the user to complete
        4. Add TODO comments to guide the user on what needs to be implemented
        5. Focus on setting up the architectural patterns rather than completing all features
        
        Provide ONLY the code with no explanations before or after.
      `;
      
      const codeResult = await model.generateContent(initialCodePrompt);
      const initialCode = codeResult.response.text();
      
      // Generate assistant message
      const messagePrompt = `
        You are an AI code assistant that helps users build software projects. You've just analyzed this project specification:
        
        "${specification}"
        
        And created a partial implementation. Craft a friendly, helpful message to the user that:
        1. Acknowledges their project requirements
        2. Explains that you've created a partial implementation to get them started
        3. Highlights 2-3 key aspects of the code structure you've provided
        4. Encourages them to continue implementing the TODOs you've left
        5. Offers guidance on next steps
        
        Keep your response under 200 words and make it conversational.
      `;
      
      const messageResult = await model.generateContent(messagePrompt);
      const assistantMessage = messageResult.response.text();
      
      return {
        projectContext,
        initialCode,
        assistantMessage
      };
    } catch (error: any) {
      console.error("Error initializing project with Gemini:", error);
      
      toast({
        variant: "destructive",
        title: "Project Initialization Failed",
        description: error.message || "Failed to initialize project. Please try again."
      });
      
      throw error;
    }
  }
  
  /**
   * Analyze existing code and respond to user query
   */
  async analyzeAndRespond(message: string, code: string, projectContext: ProjectContext): Promise<any> {
    try {
      if (!this.apiKey || !this.genAI) {
        throw new Error("Gemini API key is not set");
      }
      
      // Use the Gemini Pro model
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      
      // Generate response based on code analysis
      const responsePrompt = `
        You are an AI code assistant helping a user build this project:
        
        Project Specification: "${projectContext.specification}"
        
        The user's current message is: "${message}"
        
        Current code:
        \`\`\`
        ${code}
        \`\`\`
        
        Craft a helpful response that:
        1. Addresses their specific question or request
        2. Provides guidance based on the code
        3. Is supportive and educational rather than just giving complete solutions
        4. Includes specific references to their code where relevant
        5. Suggests next steps or improvements
        
        Keep your response conversational and focused on guiding them.
      `;
      
      const responseResult = await model.generateContent(responsePrompt);
      const assistantMessage = responseResult.response.text();
      
      // Determine if code updates are needed based on the message
      let codeUpdate = null;
      
      if (message.toLowerCase().includes('help') || 
          message.toLowerCase().includes('how do i') || 
          message.toLowerCase().includes('implement') || 
          message.toLowerCase().includes('fix')) {
        
        const updatePrompt = `
          You are an AI code assistant helping a user implement this project:
          
          Project Specification: "${projectContext.specification}"
          
          Current implementation:
          \`\`\`
          ${code}
          \`\`\`
          
          The user's request is: "${message}"
          
          Based on your analysis, provide a code update that would help them progress.
          Important:
          1. Do NOT rewrite the entire codebase
          2. Only update/add the specific parts needed to address their request
          3. Preserve their existing implementation style and structure
          4. Include explanatory comments to help them understand the changes
          
          Provide ONLY the updated code with no explanations before or after.
        `;
        
        const updateResult = await model.generateContent(updatePrompt);
        codeUpdate = updateResult.response.text();
      }
      
      // Update the project context based on the conversation
      const contextUpdatePrompt = `
        You are an AI assistant tracking a software project's development. Review this new interaction and update the project context:
        
        Current project context: ${JSON.stringify(projectContext)}
        
        User message: "${message}"
        
        Your response: "${assistantMessage}"
        
        Update the project context object to reflect any new information, progress, or next steps.
        Return ONLY the updated JSON object with no additional text.
      `;
      
      const contextResult = await model.generateContent(contextUpdatePrompt);
      let updatedContext;
      
      try {
        updatedContext = JSON.parse(contextResult.response.text());
      } catch (parseError) {
        console.error('Error parsing updated context:', parseError);
        updatedContext = projectContext;
      }
      
      return {
        assistantMessage,
        updatedContext,
        codeUpdate
      };
    } catch (error: any) {
      console.error("Error analyzing and responding with Gemini:", error);
      
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error.message || "Failed to analyze and respond. Please try again."
      });
      
      throw error;
    }
  }
  
  /**
   * Process a code analysis request and provide feedback
   */
  async processCodeAnalysisRequest(code: string, filename: string, projectId: string): Promise<void> {
    try {
      const analysisResult = await this.analyzeCode({
        code,
        filename,
        projectId
      });
      
      if (analysisResult.status === 'success') {
        // Send feedback to console for the system to pick up
        console.log("AI_CODE_ANALYSIS_RESULT:", JSON.stringify({
          projectId,
          filename,
          feedback: analysisResult.feedback,
          suggestedChanges: analysisResult.suggestedChanges,
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error("Error in code analysis processing:", error);
    }
  }
}

// Export a singleton instance
export const geminiAIService = new GeminiAIService();
