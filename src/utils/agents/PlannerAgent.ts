
import { BaseAgent } from './BaseAgent';

export class PlannerAgent extends BaseAgent {
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
