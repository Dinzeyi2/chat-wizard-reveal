
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
  
  /**
   * Create a guide for a generated project
   * @param project The generated project
   * @returns AI guide object
   */
  createGuideForProject(project: GeneratedProject): AIGuide {
    return new AIGuide(project);
  }
}

/**
 * AI Guide - Assists users through project challenges
 */
export class AIGuide {
  private project: GeneratedProject;
  private currentChallengeIndex: number;
  private conversationHistory: Array<{
    type: 'user' | 'guide' | 'hint' | 'codeSnippet';
    content?: string;
    challengeId: string;
  }>;
  
  constructor(projectData: GeneratedProject) {
    this.project = projectData;
    this.currentChallengeIndex = 0;
    this.conversationHistory = [];
  }
  
  /**
   * Get the current challenge
   */
  getCurrentChallenge(): Challenge {
    return this.project.challenges[this.currentChallengeIndex];
  }
  
  /**
   * Get the next message to guide the user
   */
  getNextGuidanceMessage(): string {
    const currentChallenge = this.getCurrentChallenge();
    
    // If this is the first message about this challenge
    if (!this.conversationHistory.some(msg => msg.challengeId === currentChallenge.description)) {
      const message = this._generateIntroMessage(currentChallenge);
      this.conversationHistory.push({
        type: 'guide',
        content: message,
        challengeId: currentChallenge.description
      });
      return message;
    }
    
    // If we've already started discussing this challenge, provide a hint
    const hintsGiven = this.conversationHistory
      .filter(msg => msg.challengeId === currentChallenge.description && msg.type === 'hint')
      .length;
    
    if (hintsGiven < currentChallenge.hints.length) {
      const hint = currentChallenge.hints[hintsGiven];
      const message = `Here's a hint: ${hint}`;
      
      this.conversationHistory.push({
        type: 'hint',
        content: message,
        challengeId: currentChallenge.description
      });
      
      return message;
    }
    
    // If we've given all the hints, provide encouragement
    return "You're on the right track! Try implementing this solution and let me know if you encounter any specific issues.";
  }
  
  /**
   * Generate an introduction message for a challenge
   */
  private _generateIntroMessage(challenge: Challenge): string {
    const messages = [
      `Now let's work on implementing the ${challenge.description} feature for ${challenge.featureName}. This is an important part of the application that needs to be completed.`,
      `I've noticed that the ${challenge.description} functionality is missing from the ${challenge.featureName} feature. Let's implement this together.`,
      `Your next challenge is to add ${challenge.description} to the ${challenge.featureName} part of the application. This is a ${challenge.difficulty} level task.`,
      `Let's make our application better by implementing ${challenge.description} for the ${challenge.featureName} feature. I'll guide you through this process.`
    ];
    
    // Randomly select one of the introduction messages
    const intro = messages[Math.floor(Math.random() * messages.length)];
    
    // Add specific context based on the challenge
    let context = '';
    
    if (challenge.description.includes('profile image upload')) {
      context = `\n\nI've created a button in the Profile component, but it currently just shows an alert when clicked. You'll need to implement both the frontend and backend components of this feature. The frontend should allow users to select an image file, while the backend needs to handle file uploads, storage, and updating the user's profile.`;
    } else if (challenge.description.includes('Follow API')) {
      context = `\n\nThe Follow button in the user profile currently doesn't do anything. You'll need to implement the API endpoints for following/unfollowing users and update the UI accordingly. This involves creating a Follow model to track relationships between users.`;
    } else if (challenge.description.includes('password reset')) {
      context = `\n\nThe authentication system is working for login and registration, but there's no way for users to reset their password if they forget it. You'll need to implement this functionality, including sending a reset token via email and creating a form for entering a new password.`;
    } else if (challenge.description.includes('search')) {
      context = `\n\nThe application needs a search feature to find content. You'll need to implement both the frontend UI for entering search queries and the backend API for processing those queries and returning relevant results.`;
    } else {
      context = `\n\nTake a look at the existing code to understand how this feature should fit into the application. I've provided some structure, but you'll need to fill in the missing functionality.`;
    }
    
    // Add call to action
    const callToAction = `\n\nWould you like to start with the frontend or backend implementation? Or do you need more information about this challenge?`;
    
    return intro + context + callToAction;
  }
  
  /**
   * Process user message and determine next steps
   */
  processUserMessage(message: string): string {
    // Add user message to conversation history
    this.conversationHistory.push({
      type: 'user',
      content: message,
      challengeId: this.getCurrentChallenge().description
    });
    
    // Check if the message indicates the challenge is complete
    if (this._isChallengeSolutionMessage(message)) {
      // Mark current challenge as complete
      this.project.challenges[this.currentChallengeIndex].completed = true;
      
      // Move to the next challenge
      if (this.currentChallengeIndex < this.project.challenges.length - 1) {
        this.currentChallengeIndex++;
        return this._generateCompletionMessage();
      } else {
        return this._generateAllChallengesCompletedMessage();
      }
    }
    
    // Analyze the message to determine the appropriate response
    if (this._isAskingForHelp(message)) {
      return this.getNextGuidanceMessage();
    } else if (this._isAskingForCode(message)) {
      return this._provideCodeSnippet();
    } else {
      // General encouragement
      return this._generateEncouragementMessage();
    }
  }
  
  /**
   * Check if the message indicates the challenge solution is complete
   */
  private _isChallengeSolutionMessage(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const completionPhrases = [
      "i've completed", "i have completed", "finished implementing", 
      "done implementing", "implemented the feature", "feature is working",
      "it's working now", "it works now", "completed the challenge"
    ];
    
    return completionPhrases.some(phrase => lowerMessage.includes(phrase));
  }
  
  /**
   * Check if the user is asking for help
   */
  private _isAskingForHelp(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const helpPhrases = [
      "help", "hint", "stuck", "don't understand", "don't know how", 
      "not sure", "guidance", "assist", "confused", "struggling"
    ];
    
    return helpPhrases.some(phrase => lowerMessage.includes(phrase));
  }
  
  /**
   * Check if the user is asking for code examples
   */
  private _isAskingForCode(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const codePhrases = [
      "code example", "sample code", "example code", "how do i code", 
      "show me the code", "code snippet", "implementation example"
    ];
    
    return codePhrases.some(phrase => lowerMessage.includes(phrase));
  }
  
  /**
   * Generate a message when a challenge is completed
   */
  private _generateCompletionMessage(): string {
    const completedChallenge = this.project.challenges[this.currentChallengeIndex - 1];
    const nextChallenge = this.getCurrentChallenge();
    
    const messages = [
      `Great job implementing the ${completedChallenge.description} feature! You've successfully completed this challenge.`,
      `Excellent work on the ${completedChallenge.description} functionality! That's one challenge down.`,
      `You've successfully implemented ${completedChallenge.description}! The application is getting better with each feature you add.`
    ];
    
    const completion = messages[Math.floor(Math.random() * messages.length)];
    
    return `${completion}\n\nNow, let's move on to the next challenge: ${nextChallenge.description} for the ${nextChallenge.featureName} feature. This is a ${nextChallenge.difficulty} level task.\n\nWould you like to get started with this new challenge?`;
  }
  
  /**
   * Generate a message when all challenges are completed
   */
  private _generateAllChallengesCompletedMessage(): string {
    return `Congratulations! You've completed all the challenges for this project. You've successfully built a functioning application with all the required features.\n\nYou've demonstrated your skills in implementing various aspects of a full-stack application, from user authentication to complex features like ${this.project.challenges[0].description} and ${this.project.challenges[this.project.challenges.length - 1].description}.\n\nWhat would you like to do next? You could:\n\n1. Add additional features to this project\n2. Optimize the existing code\n3. Start a new project with different challenges\n\nLet me know how you'd like to proceed!`;
  }
  
  /**
   * Provide a code snippet as guidance
   */
  private _provideCodeSnippet(): string {
    const challenge = this.getCurrentChallenge();
    
    // Add this interaction to conversation history
    this.conversationHistory.push({
      type: 'codeSnippet',
      challengeId: challenge.description
    });
    
    // Return a snippet based on the challenge
    if (challenge.description.includes('profile image upload')) {
      return this._getProfileImageUploadSnippet();
    } else if (challenge.description.includes('Follow API')) {
      return this._getFollowApiSnippet();
    } else if (challenge.description.includes('Password reset')) {
      return this._getPasswordResetSnippet();
    } else {
      // Generic code snippet
      return `I'd be happy to provide some code guidance for implementing the ${challenge.description} feature. However, I'd first like to understand your approach and any specific part you're stuck on.\n\nAre you having trouble with the frontend implementation, backend implementation, or both? Let me know what part you're working on, and I can provide more targeted code examples to help you move forward.`;
    }
  }
  
  /**
   * Get profile image upload code snippet
   */
  private _getProfileImageUploadSnippet(): string {
    return `Here's a code snippet to help you implement the frontend part of the profile image upload feature:

\`\`\`tsx
import React, { useRef, useState } from 'react';

// Inside your component:
const fileInputRef = useRef<HTMLInputElement>(null);
const [uploading, setUploading] = useState(false);

const handleProfileImageClick = () => {
  // Trigger the hidden file input
  if (fileInputRef.current) {
    fileInputRef.current.click();
  }
};

const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file');
    return;
  }
  
  setUploading(true);
  
  try {
    // Create form data
    const formData = new FormData();
    formData.append('profileImage', file);
    
    // Send to server
    const response = await axios.post('/api/users/profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': \`Bearer \${token}\` // Your auth token
      }
    });
    
    // Update UI with new image URL
    if (response.data.profileImage) {
      setProfile(prevProfile => ({
        ...prevProfile,
        profileImage: response.data.profileImage
      }));
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    alert('Failed to upload image');
  } finally {
    setUploading(false);
  }
};

// In your JSX:
<input
  type="file"
  ref={fileInputRef}
  style={{ display: 'none' }}
  accept="image/*"
  onChange={handleFileChange}
/>
<button 
  onClick={handleProfileImageClick}
  disabled={uploading}
  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
>
  {uploading ? 'Uploading...' : 'Change Profile Picture'}
</button>
\`\`\`

For the backend part, you'll need to implement the API endpoint using Supabase storage:

\`\`\`typescript
// In your API handler:
import { supabase } from '@/integrations/supabase/client';

// Profile image upload handler
export async function uploadProfileImage(userId: string, file: File) {
  const fileExt = file.name.split('.').pop();
  const fileName = \`profile-\${userId}-\${Date.now()}.\${fileExt}\`;
  const filePath = \`profiles/\${fileName}\`;
  
  // Upload the file to Supabase Storage
  const { data, error } = await supabase.storage
    .from('user-uploads')
    .upload(filePath, file);
    
  if (error) {
    throw new Error('Error uploading file: ' + error.message);
  }
  
  // Get the public URL
  const { data: urlData } = supabase.storage
    .from('user-uploads')
    .getPublicUrl(filePath);
    
  // Update user profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: urlData.publicUrl })
    .eq('id', userId);
    
  if (updateError) {
    throw new Error('Error updating profile: ' + updateError.message);
  }
  
  return urlData.publicUrl;
}
\`\`\`

These code snippets should help you implement the profile image upload functionality. Would you like me to explain any part in more detail?`;
  }
  
  /**
   * Get follow API code snippet
   */
  private _getFollowApiSnippet(): string {
    return `Here's a code snippet to help you implement the Follow API functionality:

\`\`\`typescript
// types.ts
interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

// followService.ts
import { supabase } from '@/integrations/supabase/client';

// Follow a user
export const followUser = async (targetUserId: string) => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError || !userData.user) {
    throw new Error('You must be logged in to follow users');
  }
  
  const userId = userData.user.id;
  
  // Prevent following yourself
  if (userId === targetUserId) {
    throw new Error('You cannot follow yourself');
  }
  
  // Check if already following
  const { data: existingFollow } = await supabase
    .from('follows')
    .select('*')
    .eq('follower_id', userId)
    .eq('following_id', targetUserId)
    .single();
    
  if (existingFollow) {
    throw new Error('You are already following this user');
  }
  
  // Create new follow relationship
  const { data, error } = await supabase
    .from('follows')
    .insert([
      { follower_id: userId, following_id: targetUserId }
    ])
    .select()
    .single();
    
  if (error) {
    throw new Error(\`Follow error: \${error.message}\`);
  }
  
  return data;
};

// Unfollow a user
export const unfollowUser = async (targetUserId: string) => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError || !userData.user) {
    throw new Error('You must be logged in to unfollow users');
  }
  
  const userId = userData.user.id;
  
  // Delete the follow relationship
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', userId)
    .eq('following_id', targetUserId);
    
  if (error) {
    throw new Error(\`Unfollow error: \${error.message}\`);
  }
  
  return true;
};

// Get followers for a user
export const getFollowers = async (userId: string) => {
  const { data, error } = await supabase
    .from('follows')
    .select(\`
      follower_id,
      followers:profiles!follower_id(id, username, full_name, avatar_url)
    \`)
    .eq('following_id', userId);
    
  if (error) {
    throw new Error(\`Error getting followers: \${error.message}\`);
  }
  
  return data?.map(item => item.followers) || [];
};

// Get users that a user is following
export const getFollowing = async (userId: string) => {
  const { data, error } = await supabase
    .from('follows')
    .select(\`
      following_id,
      following:profiles!following_id(id, username, full_name, avatar_url)
    \`)
    .eq('follower_id', userId);
    
  if (error) {
    throw new Error(\`Error getting following: \${error.message}\`);
  }
  
  return data?.map(item => item.following) || [];
};
\`\`\`

And for the frontend React component:

\`\`\`tsx
import React, { useState, useEffect } from 'react';
import { followUser, unfollowUser } from '../services/followService';
import { Button } from "@/components/ui/button";

interface FollowButtonProps {
  targetUserId: string;
  initialFollowState?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

const FollowButton: React.FC<FollowButtonProps> = ({
  targetUserId,
  initialFollowState = false,
  onFollowChange
}) => {
  const [isFollowing, setIsFollowing] = useState<boolean>(initialFollowState);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const handleFollowAction = async () => {
    setIsLoading(true);
    
    try {
      if (isFollowing) {
        // Unfollow
        await unfollowUser(targetUserId);
        setIsFollowing(false);
      } else {
        // Follow
        await followUser(targetUserId);
        setIsFollowing(true);
      }
      
      // Call callback if provided
      if (onFollowChange) {
        onFollowChange(!isFollowing);
      }
    } catch (error) {
      console.error('Follow action error:', error);
      alert(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      onClick={handleFollowAction}
      disabled={isLoading}
      className={isFollowing ? 
        "border-2 border-blue-500 text-blue-500" : 
        "bg-blue-500 text-white hover:bg-blue-600"}
    >
      {isLoading ? "Processing..." : isFollowing ? "Following" : "Follow"}
    </Button>
  );
};

export default FollowButton;
\`\`\`

Remember to create the follows table in your Supabase database:

\`\`\`sql
create table public.follows (
  id uuid default gen_random_uuid() not null primary key,
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default now() not null,
  
  -- Ensure unique follows
  constraint unique_follow unique (follower_id, following_id)
);

-- Add RLS policies
alter table public.follows enable row level security;

-- Allow users to follow others
create policy "Users can follow others"
on public.follows for insert
to authenticated
with check (follower_id = auth.uid());

-- Allow users to unfollow
create policy "Users can unfollow"
on public.follows for delete
to authenticated
using (follower_id = auth.uid());

-- Allow users to view follows
create policy "Follows are viewable by everyone"
on public.follows for select
to anon, authenticated;

-- Create indexes for performance
create index follows_follower_id_idx on public.follows (follower_id);
create index follows_following_id_idx on public.follows (following_id);
\`\`\`

These code snippets should give you a solid foundation for implementing the Follow API functionality. Would you like me to explain any part in more detail?`;
  }
  
  /**
   * Get password reset code snippet
   */
  private _getPasswordResetSnippet(): string {
    return `Here's a code snippet to help you implement the password reset functionality:

For the frontend:

\`\`\`tsx
// ForgotPasswordForm.tsx
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: \`\${window.location.origin}/reset-password\`,
      });
      
      if (error) throw error;
      
      setIsSubmitted(true);
      toast({
        title: "Check your email",
        description: "We've sent you a password reset link",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center">
        <h3 className="text-lg font-medium">Check your email</h3>
        <p className="text-muted-foreground mt-2">
          We've sent a password reset link to {email}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Sending..." : "Send Reset Link"}
      </Button>
    </form>
  );
}

// ResetPasswordForm.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure both passwords match",
        variant: "destructive",
      });
      return;
    }
    
    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });
      
      if (error) throw error;
      
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated",
      });
      
      // Redirect to login after successful reset
      navigate('/login');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">New Password</label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Updating..." : "Reset Password"}
      </Button>
    </form>
  );
}
\`\`\`

For the page components:

\`\`\`tsx
// ForgotPasswordPage.tsx
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Forgot Password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email and we'll send you a password reset link
          </p>
        </div>
        
        <div className="mt-8 bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <ForgotPasswordForm />
        </div>
        
        <div className="text-center">
          <a href="/login" className="text-sm text-blue-600 hover:text-blue-500">
            Back to login
          </a>
        </div>
      </div>
    </div>
  );
}

// ResetPasswordPage.tsx
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Reset Password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Please enter your new password
          </p>
        </div>
        
        <div className="mt-8 bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}
\`\`\`

Don't forget to add links to the forgot password page in your login form:

\`\`\`tsx
// In your login form
<div className="text-sm">
  <a href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
    Forgot your password?
  </a>
</div>
\`\`\`

And update your routes to include the new pages:

\`\`\`tsx
// In your App.tsx or routes configuration
<Route path="/forgot-password" element={<ForgotPasswordPage />} />
<Route path="/reset-password" element={<ResetPasswordPage />} />
\`\`\`

These code snippets leverage Supabase's built-in authentication features for password reset, which handles the email sending and token verification automatically. Would you like me to explain any part in more detail?`;
  }
  
  /**
   * Generate a general encouragement message
   */
  private _generateEncouragementMessage(): string {
    const messages = [
      "How's your implementation coming along? Remember to break down the problem into smaller steps.",
      "That's a good approach! Keep going, and let me know if you run into any specific issues.",
      "You're on the right track. Don't hesitate to ask if you need any hints or guidance.",
      "Take your time with this challenge. It's important to understand each part of the implementation.",
      "Looking forward to seeing your solution! Remember that there are often multiple valid ways to implement a feature."
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  /**
   * Get project overview with challenge status
   */
  getProjectOverview(): string {
    const completedChallenges = this.project.challenges.filter(c => c.completed).length;
    const totalChallenges = this.project.challenges.length;
    
    return `
Project: ${this.project.projectName}
Description: ${this.project.description}
Stack: ${this.project.stack}
Progress: ${completedChallenges}/${totalChallenges} challenges completed

Current Challenges:
${this.project.challenges.map((challenge, index) => 
  `${index + 1}. ${challenge.description} (${challenge.featureName}) - ${challenge.completed ? '✅ Completed' : '⏳ In Progress'}`
).join('\n')}
    `;
  }
}
