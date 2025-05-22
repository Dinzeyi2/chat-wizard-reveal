
import { BaseAgent } from './BaseAgent';

export class UIAgent extends BaseAgent {
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
