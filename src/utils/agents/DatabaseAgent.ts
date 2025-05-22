
import { BaseAgent } from './BaseAgent';

export class DatabaseAgent extends BaseAgent {
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
