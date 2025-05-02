
/**
 * Project Templates for CodeCraft Challenges
 * These templates define the structure and challenges for generated projects
 */

export interface IntentionalGap {
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  hints: string[];
}

export interface Feature {
  name: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  components: string[];
  intentionalGaps: string[];
  completionPercentage?: number;
}

export interface ProjectTemplate {
  name: string;
  description: string;
  stack: string;
  features: Feature[];
}

export interface GeneratedProject {
  projectName: string;
  description: string;
  stack: string;
  structure: any;
  features: Feature[];
  challenges: Challenge[];
}

export interface Challenge {
  id: string;
  featureName: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  completed: boolean;
  hints: string[];
  filesPaths: string[];
}

// Template definitions for different project types
const projectTemplates: Record<string, ProjectTemplate> = {
  twitterClone: {
    name: "Twitter Clone",
    description: "A social media platform with tweet functionality",
    stack: "MERN", // MongoDB, Express, React, Node
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
    stack: "MERN",
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
    stack: "MERN",
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

/**
 * Get specific hints for a challenge
 */
export const getHintsForChallenge = (challenge: string, featureName: string): string[] => {
  // Define common hints for different challenge types
  const hintTemplates: Record<string, string[]> = {
    "Profile image upload": [
      "You'll need to set up file upload middleware on the backend",
      "Consider using a package like multer for handling file uploads",
      "Don't forget to validate the file type and size",
      "You'll need to update the user model to store the image URL",
      "Consider security implications of user-uploaded files"
    ],
    "Password reset functionality": [
      "You'll need to create a route for requesting a password reset",
      "Consider using email to send a reset token",
      "The token should be time-limited for security",
      "You'll need a form for users to enter their new password",
      "Don't forget to hash the new password before saving"
    ],
    "Follow API implementation": [
      "You'll need to create a model to track follower/following relationships",
      "Consider using MongoDB's references to link users",
      "Implement endpoints for follow/unfollow actions",
      "You'll need to update the UI to reflect follow status",
      "Think about how to efficiently query for a user's followers"
    ],
    "Search functionality": [
      "Consider using MongoDB's text search capabilities",
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
  
  // Return specific hints if available, or generate generic ones
  if (hintTemplates[challenge]) {
    return hintTemplates[challenge];
  }
  
  // Generate generic hints based on the challenge and feature
  return [
    `Start by analyzing the existing ${featureName} code to understand the current implementation`,
    `You'll need to modify both frontend and backend components for this challenge`,
    `Consider how this feature would be implemented in a real-world application`,
    `Don't forget to test your implementation thoroughly`,
    `Think about edge cases and error handling`
  ];
};

export default projectTemplates;
