
/**
 * Challenge Generator - Creates educational coding challenges with intentional gaps
 * This utility uses the project templates to generate challenges appropriate for user skill level
 */

import projectTemplates, { 
  Feature, 
  ProjectTemplate, 
  Challenge, 
  GeneratedProject,
  getHintsForChallenge
} from './projectTemplates';

export class ChallengeGenerator {
  private projectTemplates: Record<string, ProjectTemplate>;
  
  constructor() {
    this.projectTemplates = projectTemplates;
  }
  
  /**
   * Generate a project with appropriate challenges based on user skill level
   */
  generateProject(projectType: string, userSkillLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner'): GeneratedProject {
    if (!this.projectTemplates[projectType]) {
      throw new Error(`Project type ${projectType} not found`);
    }
    
    const projectTemplate = this.projectTemplates[projectType];
    
    // Convert first letter of project name to lowercase for generating ID
    const projectId = projectTemplate.name.toLowerCase().replace(/\s+/g, '-');
    
    const generatedProject: GeneratedProject = {
      projectName: projectTemplate.name,
      description: projectTemplate.description,
      stack: projectTemplate.stack,
      structure: this._generateFileStructure(projectTemplate, projectType),
      features: this._generateFeatures(projectTemplate.features, userSkillLevel),
      challenges: this._generateChallenges(projectTemplate.features, userSkillLevel, projectId)
    };
    
    return generatedProject;
  }
  
  /**
   * Generate file structure for the project
   */
  private _generateFileStructure(projectTemplate: ProjectTemplate, projectType: string) {
    // Base structure for React/TypeScript app with Tailwind and shadcn/ui
    const baseStructure = {
      backend: {
        "server.js": "Server entry point",
        "package.json": "Backend dependencies",
        "routes": {
          "api": {}
        },
        "models": {},
        "controllers": {},
        "middleware": {
          "auth.js": "Authentication middleware"
        },
        "config": {
          "db.js": "Database configuration"
        }
      },
      frontend: {
        "package.json": "Frontend dependencies",
        "public": {
          "index.html": "HTML entry point",
          "favicon.ico": "Favicon",
          "assets": {}
        },
        "src": {
          "index.tsx": "TypeScript entry point",
          "App.tsx": "Main App component",
          "components": {},
          "pages": {},
          "contexts": {},
          "utils": {},
          "styles": {}
        }
      }
    };
    
    // Add project-specific files based on project type
    if (projectType === "twitterClone") {
      baseStructure.backend.models["User.js"] = "User model";
      baseStructure.backend.models["Tweet.js"] = "Tweet model";
      baseStructure.backend.models["Follow.js"] = "Follow model";
      
      baseStructure.backend.routes.api["users.js"] = "User routes";
      baseStructure.backend.routes.api["tweets.js"] = "Tweet routes";
      baseStructure.backend.routes.api["auth.js"] = "Authentication routes";
      
      baseStructure.frontend.src.components["Tweet.js"] = "Tweet component";
      baseStructure.frontend.src.components["TweetForm.js"] = "Tweet creation form";
      baseStructure.frontend.src.components["UserProfile.js"] = "User profile component";
      baseStructure.frontend.src.pages["Home.js"] = "Home page with feed";
      baseStructure.frontend.src.pages["Profile.js"] = "Profile page";
      baseStructure.frontend.src.pages["Login.js"] = "Login page";
      baseStructure.frontend.src.pages["Register.js"] = "Registration page";
      baseStructure.frontend.src.contexts["AuthContext.js"] = "Authentication context";
    }
    else if (projectType === "ecommerceStore") {
      baseStructure.backend.models["User.js"] = "User model";
      baseStructure.backend.models["Product.js"] = "Product model";
      baseStructure.backend.models["Order.js"] = "Order model";
      
      baseStructure.backend.routes.api["users.js"] = "User routes";
      baseStructure.backend.routes.api["products.js"] = "Product routes";
      baseStructure.backend.routes.api["orders.js"] = "Order routes";
      baseStructure.backend.routes.api["auth.js"] = "Authentication routes";
      
      baseStructure.frontend.src.components["ProductCard.js"] = "Product card component";
      baseStructure.frontend.src.components["CartItem.js"] = "Cart item component";
      baseStructure.frontend.src.pages["ProductList.js"] = "Product listing page";
      baseStructure.frontend.src.pages["ProductDetail.js"] = "Product detail page";
      baseStructure.frontend.src.pages["Cart.js"] = "Shopping cart page";
      baseStructure.frontend.src.pages["Checkout.js"] = "Checkout page";
      baseStructure.frontend.src.pages["Login.js"] = "Login page";
      baseStructure.frontend.src.pages["Register.js"] = "Registration page";
      baseStructure.frontend.src.contexts["AuthContext.js"] = "Authentication context";
      baseStructure.frontend.src.contexts["CartContext.js"] = "Shopping cart context";
    }
    else if (projectType === "taskManager") {
      baseStructure.backend.models["User.js"] = "User model";
      baseStructure.backend.models["Task.js"] = "Task model";
      baseStructure.backend.models["Project.js"] = "Project model";
      
      baseStructure.backend.routes.api["users.js"] = "User routes";
      baseStructure.backend.routes.api["tasks.js"] = "Task routes";
      baseStructure.backend.routes.api["projects.js"] = "Project routes";
      baseStructure.backend.routes.api["auth.js"] = "Authentication routes";
      
      baseStructure.frontend.src.components["TaskItem.js"] = "Task item component";
      baseStructure.frontend.src.components["TaskForm.js"] = "Task creation form";
      baseStructure.frontend.src.components["ProjectList.js"] = "Project list component";
      baseStructure.frontend.src.pages["Dashboard.js"] = "Main dashboard";
      baseStructure.frontend.src.pages["TaskList.js"] = "Task listing page";
      baseStructure.frontend.src.pages["Login.js"] = "Login page";
      baseStructure.frontend.src.pages["Register.js"] = "Registration page";
      baseStructure.frontend.src.contexts["AuthContext.js"] = "Authentication context";
      baseStructure.frontend.src.contexts["TaskContext.js"] = "Task management context";
    }
    
    return baseStructure;
  }
  
  /**
   * Generate features based on user skill level
   */
  private _generateFeatures(templateFeatures: Feature[], userSkillLevel: 'beginner' | 'intermediate' | 'advanced'): Feature[] {
    const skillLevels = ["beginner", "intermediate", "advanced"];
    const userSkillIndex = skillLevels.indexOf(userSkillLevel);
    
    // Filter features based on skill level
    // Include all features at or below user's skill level, plus one level above
    const includedFeatures = templateFeatures.filter(feature => {
      const featureSkillIndex = skillLevels.indexOf(feature.difficulty);
      return featureSkillIndex <= userSkillIndex + 1;
    });
    
    // Mark features as complete or incomplete
    return includedFeatures.map(feature => {
      const featureSkillIndex = skillLevels.indexOf(feature.difficulty);
      
      // Features below user's skill level are more complete
      // Features at user's skill level are partially complete
      // Features above user's skill level are mostly incomplete
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
  
  /**
   * Generate specific challenges for the user
   */
  private _generateChallenges(templateFeatures: Feature[], userSkillLevel: 'beginner' | 'intermediate' | 'advanced', projectId: string): Challenge[] {
    const skillLevels = ["beginner", "intermediate", "advanced"];
    const userSkillIndex = skillLevels.indexOf(userSkillLevel);
    
    let challenges: Challenge[] = [];
    
    templateFeatures.forEach((feature, featureIndex) => {
      const featureSkillIndex = skillLevels.indexOf(feature.difficulty);
      
      // Only create challenges for features at or below user skill level + 1
      if (featureSkillIndex <= userSkillIndex + 1) {
        feature.intentionalGaps.forEach((gap, gapIndex) => {
          const challengeId = `${projectId}-challenge-${featureIndex}-${gapIndex}`;
          
          challenges.push({
            id: challengeId,
            featureName: feature.name,
            description: gap,
            difficulty: feature.difficulty,
            completed: false,
            hints: getHintsForChallenge(gap, feature.name),
            filesPaths: this._getRelevantFilePaths(feature.name, gap)
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
  
  /**
   * Get relevant file paths for a specific challenge
   */
  private _getRelevantFilePaths(featureName: string, challenge: string): string[] {
    // Map features and challenges to relevant file paths
    const featureFileMappings: Record<string, Record<string, string[]>> = {
      "Authentication": {
        "Password reset functionality": [
          "backend/routes/api/auth.js",
          "frontend/src/components/auth/PasswordReset.js",
          "frontend/src/pages/PasswordReset.js"
        ],
        "OAuth integration": [
          "backend/routes/api/auth.js",
          "backend/config/passport.js",
          "frontend/src/components/auth/SocialLogin.js"
        ]
      },
      "User Profile": {
        "Profile image upload": [
          "backend/routes/api/users.js",
          "frontend/src/components/UserProfile.js"
        ],
        "Bio character count validation": [
          "frontend/src/components/ProfileEdit.js"
        ]
      },
      "Tweet Functionality": {
        "Image attachment": [
          "backend/models/Tweet.js",
          "backend/routes/api/tweets.js",
          "frontend/src/components/TweetForm.js"
        ],
        "Character count limit": [
          "frontend/src/components/TweetForm.js"
        ],
        "Hashtag parsing": [
          "backend/models/Tweet.js",
          "backend/routes/api/tweets.js"
        ]
      },
      "Following System": {
        "Follow API implementation": [
          "backend/models/Follow.js",
          "backend/routes/api/users.js",
          "frontend/src/components/FollowButton.js"
        ],
        "Follower count cache": [
          "backend/models/User.js",
          "backend/routes/api/users.js"
        ]
      },
      "Feed Generation": {
        "Algorithm for combining followed users' tweets": [
          "backend/routes/api/tweets.js"
        ],
        "Pagination": [
          "backend/routes/api/tweets.js",
          "frontend/src/pages/Home.js"
        ]
      },
      "Notifications": {
        "Real-time notification system": [
          "backend/server.js",
          "frontend/src/components/NotificationList.js"
        ],
        "Notification storage": [
          "backend/models/Notification.js",
          "backend/routes/api/notifications.js"
        ]
      },
      "Product Catalog": {
        "Category filtering": [
          "backend/routes/api/products.js",
          "frontend/src/components/ProductList.js"
        ],
        "Search functionality": [
          "backend/routes/api/products.js",
          "frontend/src/components/ProductList.js"
        ]
      },
      "Shopping Cart": {
        "Cart persistence": [
          "frontend/src/contexts/CartContext.js"
        ],
        "Quantity updates": [
          "frontend/src/components/CartItem.js",
          "frontend/src/contexts/CartContext.js"
        ]
      },
      "Checkout Process": {
        "Payment processing integration": [
          "backend/routes/api/orders.js",
          "frontend/src/components/CheckoutForm.js"
        ],
        "Order confirmation": [
          "backend/models/Order.js",
          "backend/routes/api/orders.js"
        ]
      },
      "Order History": {
        "Order detail page": [
          "frontend/src/pages/OrderDetail.js"
        ],
        "Order status updates": [
          "backend/models/Order.js",
          "backend/routes/api/orders.js"
        ]
      },
      "Admin Dashboard": {
        "Product management": [
          "backend/routes/api/products.js",
          "frontend/src/pages/Admin/ProductManagement.js"
        ],
        "Order processing": [
          "backend/routes/api/orders.js",
          "frontend/src/pages/Admin/OrderProcessing.js"
        ],
        "User management": [
          "backend/routes/api/users.js",
          "frontend/src/pages/Admin/UserManagement.js"
        ]
      },
      "Task Creation": {
        "Due date validation": [
          "frontend/src/components/TaskForm.js"
        ],
        "Priority selection": [
          "frontend/src/components/TaskForm.js"
        ]
      },
      "Project Organization": {
        "Project creation": [
          "backend/routes/api/projects.js",
          "frontend/src/components/ProjectForm.js"
        ],
        "Project-task association": [
          "backend/models/Task.js",
          "backend/models/Project.js"
        ]
      },
      "Task Filtering": {
        "Filter implementation": [
          "frontend/src/components/TaskList.js"
        ],
        "Saved filters": [
          "frontend/src/components/FilterForm.js"
        ]
      },
      "Collaboration": {
        "Task assignment": [
          "backend/routes/api/tasks.js",
          "frontend/src/components/TaskItem.js"
        ],
        "Shared projects": [
          "backend/models/Project.js",
          "backend/routes/api/projects.js"
        ]
      },
      "Calendar View": {
        "Calendar integration": [
          "frontend/src/components/Calendar.js"
        ],
        "Event display": [
          "frontend/src/components/Calendar.js"
        ]
      }
    };
    
    // Return mapped files or generic files if mapping doesn't exist
    if (featureFileMappings[featureName] && featureFileMappings[featureName][challenge]) {
      return featureFileMappings[featureName][challenge];
    }
    
    // Return generic files related to the feature
    return [`frontend/src/components/${featureName.replace(/\s+/g, '')}.js`];
  }
}
