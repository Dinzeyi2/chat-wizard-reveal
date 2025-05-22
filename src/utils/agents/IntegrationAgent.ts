
import { BaseAgent } from './BaseAgent';

export class IntegrationAgent extends BaseAgent {
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
