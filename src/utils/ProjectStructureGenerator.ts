
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

export const projectStructure: ProjectStructure = {
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

export class AppGenerator {
  private projectTemplates: ProjectStructure;
  
  constructor() {
    this.projectTemplates = projectStructure;
  }
  
  generateProject(projectType: string, userSkillLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner') {
    if (!this.projectTemplates[projectType]) {
      throw new Error(`Project type ${projectType} not found`);
    }
    
    const projectTemplate = this.projectTemplates[projectType];
    const generatedProject = {
      name: projectTemplate.name,
      description: projectTemplate.description,
      stack: projectTemplate.stack,
      structure: this._generateFileStructure(projectTemplate, projectType),
      features: this._generateFeatures(projectTemplate.features, userSkillLevel),
      challenges: this._generateChallenges(projectTemplate.features, userSkillLevel)
    };
    
    return generatedProject;
  }
  
  private _generateFileStructure(projectTemplate: ProjectTemplate, projectType: string) {
    // Implementation would be similar to the provided code
    // This is a placeholder for the file structure generation logic
    return {
      backend: {
        "server.js": "Server entry point",
        // Additional backend files...
      },
      frontend: {
        "src": {
          "components": {},
          "pages": {},
          // Additional frontend files...
        }
      }
    };
  }
  
  private _generateFeatures(templateFeatures: ProjectFeature[], userSkillLevel: string) {
    const skillLevels = ["beginner", "intermediate", "advanced"];
    const userSkillIndex = skillLevels.indexOf(userSkillLevel);
    
    // Filter features based on skill level
    const includedFeatures = templateFeatures.filter(feature => {
      const featureSkillIndex = skillLevels.indexOf(feature.difficulty);
      return featureSkillIndex <= userSkillIndex + 1;
    });
    
    // Mark features as complete or incomplete
    return includedFeatures.map(feature => {
      const featureSkillIndex = skillLevels.indexOf(feature.difficulty);
      
      let completionPercentage;
      if (featureSkillIndex < userSkillIndex) {
        completionPercentage = 90; // Almost complete, minor challenges
      } else if (featureSkillIndex === userSkillIndex) {
        completionPercentage = 70; // Partially complete, moderate challenges
      } else {
        completionPercentage = 40; // Mostly incomplete, major challenges
      }
      
      return {
        ...feature,
        completionPercentage
      };
    });
  }
  
  private _generateChallenges(templateFeatures: ProjectFeature[], userSkillLevel: string) {
    const skillLevels = ["beginner", "intermediate", "advanced"];
    const userSkillIndex = skillLevels.indexOf(userSkillLevel);
    
    let challenges = [];
    
    templateFeatures.forEach(feature => {
      const featureSkillIndex = skillLevels.indexOf(feature.difficulty);
      
      // Only create challenges for features at or below user skill level + 1
      if (featureSkillIndex <= userSkillIndex + 1) {
        feature.intentionalGaps.forEach(gap => {
          challenges.push({
            id: `challenge-${challenges.length + 1}`,
            featureName: feature.name,
            title: gap,
            description: gap,
            difficulty: feature.difficulty,
            type: 'implementation',
            filesPaths: this._generateFilePathsForChallenge(feature.name, gap),
            completed: false,
            hints: this._generateHintsForChallenge(gap, feature.name)
          });
        });
      }
    });
    
    // Sort challenges by difficulty
    challenges.sort((a, b) => {
      const difficultyOrder = { "beginner": 0, "intermediate": 1, "advanced": 2 };
      return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    });
    
    return challenges;
  }
  
  private _generateFilePathsForChallenge(featureName: string, challenge: string): string[] {
    // Simple mapping of feature and challenge to relevant file paths
    // In a real implementation, this would be more sophisticated
    const paths = [];
    
    if (challenge.includes("image upload")) {
      paths.push("frontend/src/components/ImageUpload.js");
      paths.push("backend/routes/api/upload.js");
    } else if (challenge.includes("Follow API")) {
      paths.push("backend/models/Follow.js");
      paths.push("backend/routes/api/follows.js");
      paths.push("frontend/src/components/FollowButton.js");
    } else if (challenge.includes("password reset")) {
      paths.push("backend/routes/api/auth.js");
      paths.push("frontend/src/pages/ResetPassword.js");
    }
    
    // If no specific paths were assigned, add generic ones based on feature name
    if (paths.length === 0) {
      const sanitizedFeature = featureName.replace(/\s+/g, '');
      paths.push(`frontend/src/components/${sanitizedFeature}.js`);
      paths.push(`backend/routes/api/${sanitizedFeature.toLowerCase()}.js`);
    }
    
    return paths;
  }
  
  private _generateHintsForChallenge(challenge: string, featureName: string): string[] {
    // Define common hints for different challenge types
    const hintTemplates: { [key: string]: string[] } = {
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
      // Add more hint templates as needed
    };
    
    // Return specific hints if available, or generate generic ones
    for (const key in hintTemplates) {
      if (challenge.includes(key)) {
        return hintTemplates[key];
      }
    }
    
    // Generate generic hints based on the challenge and feature
    return [
      `Start by analyzing the existing ${featureName} code to understand the current implementation`,
      `You'll need to modify both frontend and backend components for this challenge`,
      `Consider how this feature would be implemented in a real-world application`,
      `Don't forget to test your implementation thoroughly`,
      `Think about edge cases and error handling`
    ];
  }
}
