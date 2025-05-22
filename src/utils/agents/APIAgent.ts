
import { BaseAgent } from './BaseAgent';

export class APIAgent extends BaseAgent {
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
