
import { BaseAgent } from './BaseAgent';

export class PlannerAgent extends BaseAgent {
  async createExecutionPlan(specification: string, projectName: string): Promise<any> {
    const prompt = `
You are a Senior Project Manager and Educational Mentor AI specialized in breaking down software projects into manageable learning steps.

Project Specification: "${specification}"
Project Name: "${projectName}"

Your task is to create a comprehensive step-by-step learning path that breaks this project into sequential modules. Each step should:
1. Teach a specific concept or implementation detail
2. Include partial code snippets that require the user to complete them
3. Explain the WHY behind each implementation choice
4. Provide self-check questions to verify understanding

Available Learning Modules:
- UI Building: Frontend components, user interface, styling
- API Development: Backend routes, endpoints, server logic
- Data Management: Schema design, database setup, data modeling
- Authentication: Authentication flows, authorization, user management
- Integration: Connecting frontend to backend, API integration
- Deployment: Deployment setup, environment configuration

Create a JSON response with this structure:
{
  "projectName": "${projectName}",
  "description": "Brief project description",
  "learningPath": [
    {
      "moduleNumber": 1,
      "name": "Module Name",
      "type": "learning_module_type",
      "description": "What concepts this module teaches",
      "learningObjectives": ["What the user will learn"],
      "prerequisites": ["Previous concepts required"],
      "estimatedTime": "Time estimate",
      "challenges": [
        {
          "title": "Challenge title",
          "description": "What to implement",
          "hints": ["Guiding hints that don't give away the solution"],
          "selfCheck": ["Questions to verify understanding"]
        }
      ]
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
    "concepts": ["List of main concepts to learn"],
    "difficulty": "beginner|intermediate|advanced"
  }
}

Focus on creating a learning experience that builds progressively, where each step provides educational value and hands-on practice.
`;

    const response = await this.generateResponse(prompt);
    
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Error parsing planner response:', error);
      // Fallback response with learning-focused structure
      return {
        projectName,
        description: "A step-by-step learning project",
        learningPath: [
          {
            moduleNumber: 1,
            name: "UI Fundamentals",
            type: "ui",
            description: "Learn the basics of building user interfaces",
            learningObjectives: ["Understand component structure", "Learn basic styling techniques"],
            prerequisites: [],
            estimatedTime: "30-45 minutes",
            challenges: [
              {
                title: "Build your first component",
                description: "Create a basic component with proper structure",
                hints: ["Start with a functional component", "Consider what props it might need"],
                selfCheck: ["Can you explain what each part of your component does?", "How would you modify it to accept different data?"]
              }
            ]
          }
        ],
        context: {
          projectType: "web_app",
          techStack: { frontend: ["React"], backend: ["Node.js"], database: ["MongoDB"] },
          concepts: ["Component architecture", "State management", "API integration"],
          difficulty: "beginner"
        }
      };
    }
  }
}
