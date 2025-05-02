
/**
 * ChallengeGenerator - Core system for generating coding challenges from templates
 * This module integrates with the Gemini API to create intentionally incomplete applications
 * that users can complete as educational challenges.
 */

import { GeminiCodeGenerator, ChallengeResult } from "@/utils/GeminiCodeGenerator";

// Types for project structure and challenges
export interface ProjectFeature {
  name: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  components: string[];
  intentionalGaps: string[];
}

export interface ProjectTemplate {
  name: string;
  description: string;
  stack: string;
  features: ProjectFeature[];
}

export interface ProjectStructure {
  [key: string]: ProjectTemplate;
}

export interface GeneratedChallenge {
  featureName: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  completed: boolean;
  hints: string[];
}

export class ChallengeGenerator {
  private projectStructure: ProjectStructure;
  private geminiGenerator: GeminiCodeGenerator;
  
  constructor(geminiApiKey?: string) {
    this.geminiGenerator = new GeminiCodeGenerator({ debug: true });
    if (geminiApiKey) {
      this.geminiGenerator.setApiKey(geminiApiKey);
    }
    
    // Initialize the project templates
    this.projectStructure = {
      twitterClone: {
        name: "Twitter Clone",
        description: "A social media platform with tweet functionality",
        stack: "React + Supabase",
        features: [
          {
            name: "Authentication",
            difficulty: "beginner",
            components: ["Login", "Register", "Auth Middleware"],
            intentionalGaps: ["Password reset functionality", "OAuth integration"]
          },
          {
            name: "User Profile",
            difficulty: "beginner",
            components: ["Profile Display", "Profile Edit"],
            intentionalGaps: ["Profile image upload", "Bio character count validation"]
          },
          {
            name: "Tweet Functionality",
            difficulty: "intermediate",
            components: ["Tweet Creation", "Tweet Display", "Tweet List"],
            intentionalGaps: ["Image attachment", "Character count limit", "Hashtag parsing"]
          },
          {
            name: "Following System",
            difficulty: "intermediate",
            components: ["Follow Button", "Follower List"],
            intentionalGaps: ["Follow API implementation", "Follower count cache"]
          },
          {
            name: "Feed Generation",
            difficulty: "advanced",
            components: ["Basic Feed Display"],
            intentionalGaps: ["Algorithm for combining followed users' tweets", "Pagination"]
          },
          {
            name: "Notifications",
            difficulty: "advanced",
            components: ["Notification UI"],
            intentionalGaps: ["Real-time notification system", "Notification storage"]
          }
        ]
      },
      
      ecommerceStore: {
        name: "E-commerce Store",
        description: "An online shop with product listings and shopping cart",
        stack: "React + Supabase",
        features: [
          {
            name: "Product Catalog",
            difficulty: "beginner",
            components: ["Product List", "Product Detail"],
            intentionalGaps: ["Category filtering", "Search functionality"]
          },
          {
            name: "Shopping Cart",
            difficulty: "intermediate",
            components: ["Add to Cart Button", "Cart Display"],
            intentionalGaps: ["Cart persistence", "Quantity updates"]
          },
          {
            name: "User Authentication",
            difficulty: "beginner",
            components: ["Login", "Register"],
            intentionalGaps: ["User profile management", "Address storage"]
          },
          {
            name: "Checkout Process",
            difficulty: "advanced",
            components: ["Checkout Form UI"],
            intentionalGaps: ["Payment processing integration", "Order confirmation"]
          },
          {
            name: "Order History",
            difficulty: "intermediate",
            components: ["Order List UI"],
            intentionalGaps: ["Order detail page", "Order status updates"]
          },
          {
            name: "Admin Dashboard",
            difficulty: "advanced",
            components: ["Basic Dashboard UI"],
            intentionalGaps: ["Product management", "Order processing", "User management"]
          }
        ]
      },
      
      taskManager: {
        name: "Task Manager",
        description: "A productivity app for managing tasks and projects",
        stack: "React + Supabase",
        features: [
          {
            name: "Task Creation",
            difficulty: "beginner",
            components: ["Task Form", "Task List"],
            intentionalGaps: ["Due date validation", "Priority selection"]
          },
          {
            name: "Project Organization",
            difficulty: "intermediate",
            components: ["Project List"],
            intentionalGaps: ["Project creation", "Project-task association"]
          },
          {
            name: "User Authentication",
            difficulty: "beginner",
            components: ["Login", "Register"],
            intentionalGaps: ["User settings", "Password recovery"]
          },
          {
            name: "Task Filtering",
            difficulty: "intermediate",
            components: ["Basic Filter UI"],
            intentionalGaps: ["Filter implementation", "Saved filters"]
          },
          {
            name: "Collaboration",
            difficulty: "advanced",
            components: ["User List UI"],
            intentionalGaps: ["Task assignment", "Shared projects"]
          },
          {
            name: "Calendar View",
            difficulty: "advanced",
            components: ["Calendar UI Shell"],
            intentionalGaps: ["Calendar integration", "Event display"]
          }
        ]
      }
    };
  }

  /**
   * Generate a new coding challenge project with intentional gaps
   * @param prompt User's project request
   * @param skillLevel User's skill level
   */
  async generateChallenge(prompt: string, skillLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'): Promise<ChallengeResult> {
    try {
      // Analyze the prompt to determine project type
      const projectType = this.determineProjectType(prompt);
      
      // Get the project template
      const projectTemplate = this.projectStructure[projectType];
      
      if (!projectTemplate) {
        throw new Error(`Could not determine a suitable project type for: ${prompt}`);
      }
      
      // Use Gemini to generate the base project with intentional gaps
      const result = await this.geminiGenerator.generateChallenge({
        prompt,
        completionLevel: skillLevel,
        challengeType: this.mapToGeminiChallengeType(projectType)
      });
      
      // Add hints to each challenge based on our predefined templates
      result.challenges = result.challenges.map(challenge => {
        const hints = this.generateHintsForChallenge(challenge.description, projectType);
        return {
          ...challenge,
          hints: hints || []
        };
      });
      
      return result;
    } catch (error: any) {
      console.error("Error generating challenge:", error);
      throw error;
    }
  }
  
  /**
   * Determine the project type from the user's prompt
   */
  private determineProjectType(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('twitter') || lowerPrompt.includes('social') || lowerPrompt.includes('post') || lowerPrompt.includes('tweet')) {
      return 'twitterClone';
    }
    
    if (lowerPrompt.includes('shop') || lowerPrompt.includes('ecommerce') || lowerPrompt.includes('store') || 
        lowerPrompt.includes('product') || lowerPrompt.includes('cart')) {
      return 'ecommerceStore';
    }
    
    if (lowerPrompt.includes('task') || lowerPrompt.includes('todo') || lowerPrompt.includes('todos') || 
        lowerPrompt.includes('productivity') || lowerPrompt.includes('project management')) {
      return 'taskManager';
    }
    
    // Default to Twitter clone if we can't determine the type
    return 'twitterClone';
  }
  
  /**
   * Map our project type to Gemini's expected challenge type
   */
  private mapToGeminiChallengeType(projectType: string): 'frontend' | 'backend' | 'fullstack' {
    // All our templates are full stack by default
    return 'fullstack';
  }
  
  /**
   * Generate hints for a specific challenge
   */
  private generateHintsForChallenge(challenge: string, projectType: string): string[] {
    // Common hints for different challenge types
    const hintTemplates: Record<string, string[]> = {
      "Profile image upload": [
        "You'll need to set up file upload functionality in the frontend",
        "Consider using Supabase storage for file uploads",
        "Don't forget to validate the file type and size",
        "You'll need to update the user profile to store the image URL",
        "Consider security implications of user-uploaded files"
      ],
      "Password reset functionality": [
        "You'll need to create a route for requesting a password reset",
        "Consider using email to send a reset token",
        "The token should be time-limited for security",
        "You'll need a form for users to enter their new password",
        "Don't forget to handle the password reset confirmation"
      ],
      "Follow API implementation": [
        "You'll need to create a table to track follower/following relationships",
        "Consider using a junction table with user_id and follower_id",
        "Implement endpoints for follow/unfollow actions",
        "You'll need to update the UI to reflect follow status",
        "Think about how to efficiently query for a user's followers"
      ],
      "Search functionality": [
        "Consider using database text search capabilities",
        "You'll need to create an endpoint that accepts search queries",
        "Think about how to handle partial matches",
        "You might want to implement debouncing for the search input",
        "Consider how to rank and sort search results"
      ],
      "Payment processing integration": [
        "Research payment gateway options like Stripe or PayPal",
        "You'll need to implement the client-side integration",
        "Consider security best practices for handling payment data",
        "You'll need to handle successful and failed payment scenarios",
        "Don't forget to update the order status after payment"
      ]
    };
    
    // Return specific hints if available
    for (const key in hintTemplates) {
      if (challenge.toLowerCase().includes(key.toLowerCase())) {
        return hintTemplates[key];
      }
    }
    
    // Generate generic hints if no specific hints are available
    return [
      "Start by analyzing the existing code to understand the current implementation",
      "You'll need to modify both frontend and backend components for this challenge",
      "Consider how this feature would be implemented in a real-world application",
      "Don't forget to test your implementation thoroughly",
      "Think about edge cases and error handling"
    ];
  }
}
