
import { BaseAgent } from './BaseAgent';

export class DeploymentAgent extends BaseAgent {
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
