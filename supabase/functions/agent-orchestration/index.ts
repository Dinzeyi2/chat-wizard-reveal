import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.1.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock agent classes for the server-side implementation
class BaseAgent {
  protected model: any;

  constructor(model: any) {
    this.model = model;
  }

  async generateResponse(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Error generating response:', error);
      return 'Error generating response. Please try again.';
    }
  }
}

class PlannerAgent extends BaseAgent {
  async createExecutionPlan(specification: string, projectName: string): Promise<any> {
    const prompt = `
You are a Senior Project Manager AI Agent specialized in breaking down software projects into manageable steps.

Project Specification: "${specification}"
Project Name: "${projectName}"

Your task is to create a comprehensive execution pipeline that breaks this project into sequential steps. Each step should be handled by a specialized agent.

Available Agents:
- UI Agent: Frontend components, user interface, styling
- API Agent: Backend routes, endpoints, server logic
- Database Agent: Schema design, database setup, data modeling
- Auth Agent: Authentication, authorization, user management
- Integration Agent: Connecting frontend to backend, API integration
- Deployment Agent: Deployment setup, environment configuration

Create a JSON response with this structure:
{
  "projectName": "${projectName}",
  "description": "Brief project description",
  "pipeline": [
    {
      "stepNumber": 1,
      "name": "Step Name",
      "agent": "agent_type",
      "description": "What this step accomplishes",
      "deliverables": ["What the user should implement"],
      "dependencies": ["Previous step requirements"],
      "estimatedTime": "Time estimate",
      "userGuidance": "Specific instructions for the user"
    }
  ],
  "context": {
    "projectType": "web_app|mobile_app|api|etc",
    "techStack": {
      "frontend": ["React", "TypeScript", "TailwindCSS"],
      "backend": ["Node.js", "Express"],
      "database": ["PostgreSQL", "MongoDB"],
      "auth": ["JWT", "OAuth"]
    },
    "features": ["List of main features"],
    "complexity": "simple|medium|complex"
  }
}

Focus on creating a logical sequence where each step builds upon the previous one.
`;

    const response = await this.generateResponse(prompt);
    
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Error parsing planner response:', error);
      // Fallback response
      return {
        projectName,
        description: "Software project",
        pipeline: [
          {
            stepNumber: 1,
            name: "UI Planning",
            agent: "ui",
            description: "Create user interface components",
            deliverables: ["Component structure", "Basic styling"],
            dependencies: [],
            estimatedTime: "30-45 minutes",
            userGuidance: "Start by creating the main layout and navigation"
          }
        ],
        context: {
          projectType: "web_app",
          techStack: { frontend: ["React"], backend: ["Node.js"], database: ["MongoDB"] },
          features: ["Basic functionality"],
          complexity: "medium"
        }
      };
    }
  }
}

class UIAgent extends BaseAgent {
  async executeStep(stepInfo: any, context: any, memory: any[], userCode: string, userMessage: string): Promise<any> {
    const prompt = `
You are a UI/Frontend Development Agent. You're helping a user build: ${context.projectName}

Current Step: ${stepInfo.name}
Step Description: ${stepInfo.description}
User's Current Code:
\`\`\`
${userCode}
\`\`\`

User's Message/Question: "${userMessage}"

Project Context: ${JSON.stringify(context)}

Your role is to:
1. Analyze the user's current UI implementation
2. Provide specific guidance on what they need to implement next
3. Suggest improvements or corrections
4. Guide them toward completing this step

Provide a response that includes:
- Analysis of their current code
- Specific next steps they should take
- Code examples or patterns they should follow (partial implementations only)
- Whether this step is completed or needs more work

Remember: You provide guidance and partial code examples, but the user writes most of the code themselves.

Response format:
{
  "analysis": "Analysis of current code",
  "guidance": "Specific instructions for the user",
  "codeExample": "Small code snippet to guide them (optional)",
  "nextSteps": ["Step 1", "Step 2"],
  "stepCompleted": false,
  "contextUpdate": {
    "uiComponents": ["list of components they've built"],
    "uiProgress": "progress description"
  }
}
`;

    const response = await this.generateResponse(prompt);
    
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Error parsing UI agent response:', error);
      return {
        analysis: "Analyzing your UI implementation...",
        guidance: "Continue building your user interface components.",
        nextSteps: ["Add more components", "Improve styling"],
        stepCompleted: false,
        contextUpdate: {}
      };
    }
  }
}

class APIAgent extends BaseAgent {
  async executeStep(stepInfo: any, context: any, memory: any[], userCode: string, userMessage: string): Promise<any> {
    const prompt = `
You are an API/Backend Development Agent. You're helping a user build: ${context.projectName}

Current Step: ${stepInfo.name}
Step Description: ${stepInfo.description}
User's Current Code:
\`\`\`
${userCode}
\`\`\`

User's Message/Question: "${userMessage}"

Project Context: ${JSON.stringify(context)}
Previous UI Implementation: ${JSON.stringify(context.uiComponents || [])}

Your role is to:
1. Analyze the user's current backend implementation
2. Ensure API endpoints match the frontend requirements
3. Guide them in creating RESTful routes
4. Help with middleware, error handling, and best practices

Provide guidance on:
- API endpoint structure
- Request/response patterns
- Error handling
- Authentication integration (if applicable)
- Database integration patterns

Response format:
{
  "analysis": "Analysis of current backend code",
  "guidance": "Specific API development instructions",
  "codeExample": "Example API route or middleware (partial)",
  "nextSteps": ["API step 1", "API step 2"],
  "stepCompleted": false,
  "contextUpdate": {
    "apiEndpoints": ["list of endpoints they've built"],
    "apiProgress": "progress description"
  }
}
`;

    const response = await this.generateResponse(prompt);
    
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Error parsing API agent response:', error);
      return {
        analysis: "Analyzing your API implementation...",
        guidance: "Continue building your backend routes and endpoints.",
        nextSteps: ["Add more endpoints", "Implement error handling"],
        stepCompleted: false,
        contextUpdate: {}
      };
    }
  }
}

class DatabaseAgent extends BaseAgent {
  async executeStep(stepInfo: any, context: any, memory: any[], userCode: string, userMessage: string): Promise<any> {
    const prompt = `
You are a Database Design Agent. You're helping a user build: ${context.projectName}

Current Step: ${stepInfo.name}
Step Description: ${stepInfo.description}
User's Current Code:
\`\`\`
${userCode}
\`\`\`

User's Message/Question: "${userMessage}"

Project Context: ${JSON.stringify(context)}
API Endpoints: ${JSON.stringify(context.apiEndpoints || [])}

Your role is to:
1. Analyze the user's current database implementation
2. Ensure schema matches API and UI requirements
3. Guide them in creating efficient database structures
4. Help with relationships, indexes, and constraints

Provide guidance on:
- Database schema design
- Table relationships
- Data validation
- Query optimization
- Migration strategies

Response format:
{
  "analysis": "Analysis of current database code",
  "guidance": "Specific database development instructions",
  "codeExample": "Example schema or query (partial)",
  "nextSteps": ["DB step 1", "DB step 2"],
  "stepCompleted": false,
  "contextUpdate": {
    "dbTables": ["list of tables they've created"],
    "dbProgress": "progress description"
  }
}
`;

    const response = await this.generateResponse(prompt);
    
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Error parsing Database agent response:', error);
      return {
        analysis: "Analyzing your database implementation...",
        guidance: "Continue building your database schema and connections.",
        nextSteps: ["Add more tables", "Set up relationships"],
        stepCompleted: false,
        contextUpdate: {}
      };
    }
  }
}

class AuthAgent extends BaseAgent {
  async executeStep(stepInfo: any, context: any, memory: any[], userCode: string, userMessage: string): Promise<any> {
    const prompt = `
You are an Authentication/Authorization Agent. You're helping a user build: ${context.projectName}

Current Step: ${stepInfo.name}
Step Description: ${stepInfo.description}
User's Current Code:
\`\`\`
${userCode}
\`\`\`

User's Message/Question: "${userMessage}"

Project Context: ${JSON.stringify(context)}

Your role is to:
1. Analyze the user's current authentication implementation
2. Guide them in implementing secure login/registration
3. Help with session management, JWT tokens, or OAuth
4. Ensure proper security practices

Provide guidance on:
- User registration/login flows
- Password hashing and security
- Session management
- Protected routes
- Role-based access control

Response format:
{
  "analysis": "Analysis of current auth code",
  "guidance": "Specific authentication development instructions",
  "codeExample": "Example auth middleware or route (partial)",
  "nextSteps": ["Auth step 1", "Auth step 2"],
  "stepCompleted": false,
  "contextUpdate": {
    "authFeatures": ["list of auth features implemented"],
    "authProgress": "progress description"
  }
}
`;

    const response = await this.generateResponse(prompt);
    
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Error parsing Auth agent response:', error);
      return {
        analysis: "Analyzing your authentication implementation...",
        guidance: "Continue building your authentication system.",
        nextSteps: ["Add login functionality", "Implement protection"],
        stepCompleted: false,
        contextUpdate: {}
      };
    }
  }
}

class IntegrationAgent extends BaseAgent {
  async executeStep(stepInfo: any, context: any, memory: any[], userCode: string, userMessage: string): Promise<any> {
    const prompt = `
You are an Integration Agent. You're helping a user build: ${context.projectName}

Current Step: ${stepInfo.name}
Step Description: ${stepInfo.description}
User's Current Code:
\`\`\`
${userCode}
\`\`\`

User's Message/Question: "${userMessage}"

Project Context: ${JSON.stringify(context)}

Your role is to:
1. Analyze how well the frontend and backend are connected
2. Guide them in implementing API calls from the frontend
3. Help with state management and data flow
4. Ensure proper error handling between layers

Provide guidance on:
- API integration patterns
- State management (Redux, Context, etc.)
- Error handling across layers
- Data validation
- Loading states and UX

Response format:
{
  "analysis": "Analysis of current integration",
  "guidance": "Specific integration instructions",
  "codeExample": "Example API call or state management (partial)",
  "nextSteps": ["Integration step 1", "Integration step 2"],
  "stepCompleted": false,
  "contextUpdate": {
    "integrationPoints": ["list of integrated features"],
    "integrationProgress": "progress description"
  }
}
`;

    const response = await this.generateResponse(prompt);
    
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Error parsing Integration agent response:', error);
      return {
        analysis: "Analyzing your frontend-backend integration...",
        guidance: "Continue connecting your frontend and backend.",
        nextSteps: ["Add API calls", "Handle loading states"],
        stepCompleted: false,
        contextUpdate: {}
      };
    }
  }
}

class DeploymentAgent extends BaseAgent {
  async executeStep(stepInfo: any, context: any, memory: any[], userCode: string, userMessage: string): Promise<any> {
    const prompt = `
You are a Deployment Agent. You're helping a user build: ${context.projectName}

Current Step: ${stepInfo.name}
Step Description: ${stepInfo.description}
User's Current Code:
\`\`\`
${userCode}
\`\`\`

User's Message/Question: "${userMessage}"

Project Context: ${JSON.stringify(context)}

Your role is to:
1. Analyze the user's current deployment setup
2. Guide them in preparing for production deployment
3. Help with environment configuration
4. Ensure proper build processes and optimization

Provide guidance on:
- Environment configuration
- Build optimization
- Deployment platforms (Vercel, Netlify, Heroku, etc.)
- Database deployment
- Security considerations

Response format:
{
  "analysis": "Analysis of current deployment setup",
  "guidance": "Specific deployment instructions",
  "codeExample": "Example config files or deployment scripts (partial)",
  "nextSteps": ["Deployment step 1", "Deployment step 2"],
  "stepCompleted": false,
  "contextUpdate": {
    "deploymentConfig": ["list of deployment configurations"],
    "deploymentProgress": "progress description"
  }
}
`;

    const response = await this.generateResponse(prompt);
    
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Error parsing Deployment agent response:', error);
      return {
        analysis: "Analyzing your deployment setup...",
        guidance: "Continue preparing your project for deployment.",
        nextSteps: ["Configure environment", "Set up build process"],
        stepCompleted: false,
        contextUpdate: {}
      };
    }
  }
}

class AgentOrchestrator {
  private genAI: any;
  private model: any;
  private agents: Record<string, any>;
  private currentStep = 0;
  private pipeline: any[] = [];
  private context: Record<string, any> = {};
  private memory: any[] = [];

  constructor(geminiApiKey: string) {
    this.genAI = new GoogleGenerativeAI(geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Agent definitions with specialized roles
    this.agents = {
      planner: new PlannerAgent(this.model),
      ui: new UIAgent(this.model),
      api: new APIAgent(this.model),
      database: new DatabaseAgent(this.model),
      auth: new AuthAgent(this.model),
      integration: new IntegrationAgent(this.model),
      deployment: new DeploymentAgent(this.model)
    };
  }

  async initializeOrchestration(projectSpecification: string, projectName: string) {
    console.log('🎯 Initializing Agent Orchestration...');
    
    // Step 1: Planner Agent analyzes and creates execution plan
    const plannerResult = await this.agents.planner.createExecutionPlan(
      projectSpecification, 
      projectName
    );
    
    this.pipeline = plannerResult.pipeline;
    this.context = plannerResult.context;
    this.currentStep = 0;
    
    // Add to memory
    this.addToMemory('orchestration_initialized', {
      specification: projectSpecification,
      projectName,
      pipeline: this.pipeline,
      context: this.context
    });
    
    return {
      orchestrationPlan: plannerResult,
      currentStep: this.getCurrentStepInfo(),
      totalSteps: this.pipeline.length
    };
  }

  async executeNextStep(userCode = '', userMessage = '') {
    if (this.currentStep >= this.pipeline.length) {
      return {
        completed: true,
        message: '🎉 Congratulations! You have completed all steps of your project!',
        summary: this.generateProjectSummary()
      };
    }
    
    const currentStepInfo = this.pipeline[this.currentStep];
    const agentType = currentStepInfo.agent;
    const agent = this.agents[agentType];
    
    if (!agent) {
      throw new Error(`Agent type ${agentType} not found`);
    }
    
    console.log(`🤖 Executing Step ${this.currentStep + 1}/${this.pipeline.length}: ${currentStepInfo.name}`);
    
    // Execute the step with the appropriate agent
    const stepResult = await agent.executeStep(
      currentStepInfo,
      this.context,
      this.memory,
      userCode,
      userMessage
    );
    
    // Update context and memory with results
    this.context = { ...this.context, ...stepResult.contextUpdate };
    this.addToMemory(`step_${this.currentStep}_completed`, stepResult);
    
    // Move to next step if current step is completed
    if (stepResult.stepCompleted) {
      this.currentStep++;
    }
    
    return {
      completed: this.currentStep >= this.pipeline.length,
      stepResult,
      currentStep: this.getCurrentStepInfo(),
      nextStep: this.getNextStepInfo(),
      progress: {
        current: this.currentStep + 1,
        total: this.pipeline.length,
        percentage: Math.round(((this.currentStep + 1) / this.pipeline.length) * 100)
      }
    };
  }

  getCurrentStepInfo() {
    if (this.currentStep >= this.pipeline.length) return null;
    return {
      ...this.pipeline[this.currentStep],
      stepNumber: this.currentStep + 1,
      totalSteps: this.pipeline.length
    };
  }

  getNextStepInfo() {
    if (this.currentStep + 1 >= this.pipeline.length) return null;
    return {
      ...this.pipeline[this.currentStep + 1],
      stepNumber: this.currentStep + 2,
      totalSteps: this.pipeline.length
    };
  }

  addToMemory(type: string, data: any) {
    this.memory.push({
      type,
      data,
      timestamp: new Date().toISOString(),
      step: this.currentStep
    });
  }

  generateProjectSummary() {
    return {
      projectName: this.context.projectName,
      completedSteps: this.currentStep,
      totalSteps: this.pipeline.length,
      features: this.context.features || [],
      techStack: this.context.techStack || {},
      nextRecommendations: this.context.nextRecommendations || []
    };
  }
  
  getState() {
    return {
      currentStep: this.currentStep,
      pipeline: this.pipeline,
      context: this.context,
      memory: this.memory
    };
  }
  
  restoreState(state: any) {
    this.currentStep = state.currentStep;
    this.pipeline = state.pipeline;
    this.context = state.context;
    this.memory = state.memory;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    
    const { action, specification, projectName, userCode, userMessage, state } = await req.json();

    const orchestrator = new AgentOrchestrator(geminiApiKey);

    if (action === 'initialize') {
      // Initialize a new project with orchestration
      const result = await orchestrator.initializeOrchestration(specification, projectName);
      
      return new Response(JSON.stringify({
        success: true,
        orchestrationPlan: result.orchestrationPlan,
        currentStep: result.currentStep,
        state: orchestrator.getState(),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else if (action === 'execute-step') {
      // Restore state if provided
      if (state) {
        orchestrator.restoreState(state);
      }
      
      // Execute the next step
      const result = await orchestrator.executeNextStep(userCode || '', userMessage || '');
      
      return new Response(JSON.stringify({
        success: true,
        result,
        state: orchestrator.getState(),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else if (action === 'get-state') {
      // Restore state if provided
      if (state) {
        orchestrator.restoreState(state);
      }
      
      return new Response(JSON.stringify({
        success: true,
        state: orchestrator.getState(),
        currentStep: orchestrator.getCurrentStepInfo(),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ 
      error: 'Invalid action' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in agent-orchestration function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An error occurred in the agent-orchestration function' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
