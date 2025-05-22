
import { BaseAgent } from './BaseAgent';

export class PlannerAgent extends BaseAgent {
  async createExecutionPlan(specification: string, projectName: string): Promise<any> {
    const prompt = `
You are a Senior Project Manager and Educational Mentor AI specialized in breaking down software projects into manageable learning steps.

Project Specification: "${specification}"
Project Name: "${projectName}"

IMPORTANT: Your task is to create a comprehensive STEP-BY-STEP LEARNING PATH that breaks this project into sequential modules. 
The key difference from traditional approaches is that you must NOT provide complete solutions, but instead craft a guided learning experience.

For each step:
1. Explain the concept thoroughly with the "why" behind each implementation choice
2. Provide PARTIAL code snippets with intentional gaps for the user to complete
3. Include clear comments indicating what the user needs to implement
4. Add challenges that test understanding and encourage experimentation
5. Include self-check questions to verify understanding

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
          "partialCode": "// Partial code with intentional gaps marked by TODO comments\\nfunction example() {\\n  // TODO: Implement this part\\n}",
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
NEVER give complete solutions - always require the user to fill in important parts.
`;

    const response = await this.generateResponse(prompt);
    
    try {
      // Parse the response into JSON
      const parsedResponse = JSON.parse(response);
      
      // Process the learning path to ensure each module has proper challenges
      if (parsedResponse.learningPath) {
        parsedResponse.learningPath = parsedResponse.learningPath.map((module: any, index: number) => {
          // Ensure each module has at least one challenge
          if (!module.challenges || module.challenges.length === 0) {
            module.challenges = [{
              title: `Implement ${module.name}`,
              description: `Create the core functionality for the ${module.name.toLowerCase()} module`,
              partialCode: "// TODO: Implement the core functionality",
              hints: ["Break down the problem into smaller steps", "Start with the UI layout before adding functionality"],
              selfCheck: ["Does your implementation handle edge cases?", "Can you explain how each part works?"]
            }];
          }
          
          // Ensure each challenge has partial code that requires completion
          module.challenges = module.challenges.map((challenge: any) => {
            if (!challenge.partialCode) {
              challenge.partialCode = `// This is a partial implementation for: ${challenge.title}\n// TODO: Complete this implementation`;
            }
            
            return challenge;
          });
          
          return module;
        });
      }
      
      return parsedResponse;
    } catch (error) {
      console.error('Error parsing planner response:', error);
      // Fallback response with learning-focused structure
      return {
        projectName,
        description: "A step-by-step learning project",
        learningPath: [
          {
            moduleNumber: 1,
            name: "Understanding the Core Concepts",
            type: "fundamentals",
            description: "Learn the foundational concepts needed for this project",
            learningObjectives: ["Understand the project architecture", "Learn about key technologies", "Setup the development environment"],
            prerequisites: [],
            estimatedTime: "30-45 minutes",
            challenges: [
              {
                title: "Setup Your Project Structure",
                description: "Create the initial project structure with the necessary files and folders",
                partialCode: "// Here's the start of your project structure\n// TODO: Complete the folder structure based on the requirements",
                hints: ["Consider what components you'll need", "Think about how to organize related files together"],
                selfCheck: ["Can you explain why this structure makes sense for the project?", "Did you include all necessary config files?"]
              }
            ]
          },
          {
            moduleNumber: 2,
            name: "Building the User Interface",
            type: "ui",
            description: "Create the UI components for the project",
            learningObjectives: ["Design responsive layouts", "Implement component structure", "Apply appropriate styling"],
            prerequisites: ["Understanding the Core Concepts"],
            estimatedTime: "60 minutes",
            challenges: [
              {
                title: "Create the Main Layout Component",
                description: "Implement the main layout structure that will contain all other components",
                partialCode: "import React from 'react';\n\nfunction MainLayout({ children }) {\n  // TODO: Implement the layout structure\n  // Include header, main content area, and footer\n  return (\n    <div>\n      {/* Your implementation here */}\n    </div>\n  );\n}\n\nexport default MainLayout;",
                hints: ["Use semantic HTML elements for better accessibility", "Consider how the layout should adapt to different screen sizes"],
                selfCheck: ["Is your layout responsive?", "Did you use appropriate semantic elements?"]
              }
            ]
          }
        ],
        context: {
          projectType: "web_app",
          techStack: {
            frontend: ["React", "TypeScript", "TailwindCSS"],
            backend: ["Node.js", "Express"],
            database: ["MongoDB"],
            auth: ["JWT"]
          },
          concepts: ["Component architecture", "State management", "API integration", "Responsive design"],
          difficulty: "intermediate"
        }
      };
    }
  }
}
