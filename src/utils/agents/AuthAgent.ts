
import { BaseAgent } from './BaseAgent';

export class AuthAgent extends BaseAgent {
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
