import projectTemplates, { Challenge } from './projectTemplates';

// Define Step interface used for implementation steps
export interface ImplementationStep {
  id: string;
  name: string;
  description: string;
  status: "not_started" | "in_progress" | "completed";
  difficulty?: string; // Added difficulty property
  type?: string;      // Added type property
}

// Define ConversationMessage interface
interface ConversationMessage {
  type: 'user' | 'guide' | 'hint' | 'codeSnippet';
  content: string;
  challengeId: string;
  stepId?: string;
}

export class StructuredAIGuide {
  private project: any; // Using any temporarily to fix the ProjectData import issue
  private currentChallengeIndex: number;
  private conversationHistory: ConversationMessage[];
  public currentStep: ImplementationStep | null;
  public stepProgress: Record<string, any>;
  public waitingForStepSelection: boolean;
  
  constructor(projectData: any) { // Using any temporarily to fix the ProjectData import issue
    this.project = projectData;
    this.currentChallengeIndex = 0;
    this.conversationHistory = [];
    this.currentStep = null; // Tracks which specific step the user is working on
    this.stepProgress = {}; // Tracks progress on each step
    this.waitingForStepSelection = false; // Flag to track if waiting for user to select a step
  }
  
  // Get the current challenge
  getCurrentChallenge() {
    return this.project.challenges[this.currentChallengeIndex];
  }
  
  // Get specific implementation steps for the current challenge
  getChallengeSteps(): ImplementationStep[] {
    const challenge = this.getCurrentChallenge();
    
    // Define steps based on the challenge type
    if (challenge.description.includes('profile image upload')) {
      return [
        {
          id: 'frontend-ui',
          name: 'Frontend UI Components',
          description: 'Implement the file input and preview UI elements',
          status: "not_started" as const,
          difficulty: 'beginner',
          type: 'frontend'
        },
        {
          id: 'frontend-logic',
          name: 'Frontend Upload Logic',
          description: 'Implement the JavaScript logic for handling file selection and upload',
          status: "not_started" as const,
          difficulty: 'beginner',
          type: 'frontend'
        },
        {
          id: 'backend-middleware',
          name: 'Backend File Upload Middleware',
          description: 'Set up the file upload middleware (e.g., Multer) on the server',
          status: "not_started" as const,
          difficulty: 'intermediate',
          type: 'backend'
        },
        {
          id: 'backend-storage',
          name: 'Backend Storage Implementation',
          description: 'Implement file storage and database updating',
          status: "not_started" as const,
          difficulty: 'intermediate',
          type: 'backend'
        },
        {
          id: 'security-validation',
          name: 'Security and Validation',
          description: 'Add file validation and security measures',
          status: "not_started" as const,
          difficulty: 'advanced',
          type: 'integration'
        }
      ];
    } else if (challenge.description.includes('Follow API')) {
      return [
        {
          id: 'data-model',
          name: 'Follow Data Model',
          description: 'Create the database model for follower relationships',
          status: "not_started" as const,
          difficulty: 'beginner',
          type: 'backend'
        },
        {
          id: 'follow-endpoints',
          name: 'Follow/Unfollow Endpoints',
          description: 'Implement the API endpoints for following and unfollowing users',
          status: "not_started" as const,
          difficulty: 'intermediate',
          type: 'backend'
        },
        {
          id: 'frontend-buttons',
          name: 'Frontend Follow Buttons',
          description: 'Implement the UI components for follow/unfollow actions',
          status: "not_started" as const,
          difficulty: 'beginner',
          type: 'frontend'
        },
        {
          id: 'follow-state',
          name: 'Follow State Management',
          description: 'Implement the logic to track and display follow status',
          status: "not_started" as const,
          difficulty: 'intermediate',
          type: 'frontend'
        },
        {
          id: 'follower-lists',
          name: 'Followers/Following Lists',
          description: 'Create views to display followers and following lists',
          status: "not_started" as const,
          difficulty: 'intermediate',
          type: 'frontend'
        }
      ];
    } else if (challenge.description.includes('search')) {
      return [
        {
          id: 'search-ui',
          name: 'Search UI Components',
          description: 'Create the search input and results display components',
          status: "not_started" as const,
          difficulty: 'beginner',
          type: 'frontend'
        },
        {
          id: 'search-endpoint',
          name: 'Search API Endpoint',
          description: 'Implement the backend API endpoint for search queries',
          status: "not_started" as const,
          difficulty: 'intermediate',
          type: 'backend'
        },
        {
          id: 'search-algorithm',
          name: 'Search Algorithm',
          description: 'Implement the search algorithm (text matching, relevance sorting, etc.)',
          status: "not_started" as const,
          difficulty: 'advanced',
          type: 'backend'
        },
        {
          id: 'result-display',
          name: 'Results Display',
          description: 'Implement the display of search results with proper formatting',
          status: "not_started" as const,
          difficulty: 'beginner',
          type: 'frontend'
        },
        {
          id: 'search-optimization',
          name: 'Search Optimization',
          description: 'Optimize the search for performance (indexing, caching, etc.)',
          status: "not_started" as const,
          difficulty: 'advanced',
          type: 'backend'
        }
      ];
    } else {
      // Generic steps for other challenges
      return [
        {
          id: 'frontend-components',
          name: 'Frontend Components',
          description: 'Implement the UI components needed for this feature',
          status: "not_started" as const,
          difficulty: 'beginner',
          type: 'frontend'
        },
        {
          id: 'frontend-logic',
          name: 'Frontend Logic',
          description: 'Implement the JavaScript logic for the feature',
          status: "not_started" as const,
          difficulty: 'beginner',
          type: 'frontend'
        },
        {
          id: 'backend-models',
          name: 'Backend Data Models',
          description: 'Create or update the database models',
          status: "not_started" as const,
          difficulty: 'intermediate',
          type: 'backend'
        },
        {
          id: 'backend-endpoints',
          name: 'Backend API Endpoints',
          description: 'Implement the API endpoints for the feature',
          status: "not_started" as const,
          difficulty: 'intermediate',
          type: 'backend'
        },
        {
          id: 'testing-validation',
          name: 'Testing and Validation',
          description: 'Add validation, error handling, and testing',
          status: "not_started" as const,
          difficulty: 'intermediate',
          type: 'testing'
        }
      ];
    }
  }
  
  // Get the next message to guide the user
  getNextGuidanceMessage() {
    const currentChallenge = this.getCurrentChallenge();
    
    // If this is the first message about this challenge
    if (!this.conversationHistory.some(msg => msg.challengeId === currentChallenge.description)) {
      // Generate introduction message
      const message = this._generateIntroMessage(currentChallenge);
      this.conversationHistory.push({
        type: 'guide',
        content: message,
        challengeId: currentChallenge.description
      });
      
      // Set waiting for step selection flag
      this.waitingForStepSelection = true;
      
      return message;
    }
    
    // If waiting for user to select a step, remind them
    if (this.waitingForStepSelection) {
      return "Please select one of the listed steps to work on first. Which step would you like to tackle?";
    }
    
    // If a step is selected, provide guidance for that specific step
    if (this.currentStep) {
      return this._getStepGuidance(this.currentStep);
    }
    
    // Default guidance
    return "Let me know which part of the implementation you'd like to work on, or if you have any questions about the challenge.";
  }
  
  // Generate an introduction message for a challenge with steps
  _generateIntroMessage(challenge: Challenge) {
    const steps = this.getChallengeSteps();
    
    // Basic intro
    let intro = `Now let's work on implementing the ${challenge.description} feature for ${challenge.featureName}. This feature is currently incomplete in the project.`;
    
    // Add challenge context based on the challenge type
    let context = '';
    
    if (challenge.description.includes('profile image upload')) {
      context = `\n\nThe profile image upload functionality is an important part of the user profile system. Currently, there is a "Change Profile Image" button in the Profile component, but it only shows an alert when clicked. The backend has a placeholder endpoint that returns "Not implemented".`;
    } else if (challenge.description.includes('Follow API')) {
      context = `\n\nThe follow functionality allows users to follow other users and see their content in their feed. Currently, there is a Follow button in the profile page, but it doesn't do anything when clicked. The backend doesn't have a data model or endpoints for this feature yet.`;
    } else if (challenge.description.includes('search')) {
      context = `\n\nThe search functionality is essential for users to find content within the application. Currently, there is no search feature implemented. We need to add both frontend and backend components for this feature.`;
    } else {
      context = `\n\nThis feature is currently missing from the application and needs to be implemented from scratch.`;
    }
    
    // Add step details
    let stepsText = `\n\nTo implement this feature, we'll need to complete the following steps:\n\n`;
    
    steps.forEach((step, index) => {
      stepsText += `${index + 1}. ${step.name}: ${step.description}\n`;
    });
    
    // Add call to action
    const callToAction = `\n\nWhich step would you like to work on first? Please choose one of the numbered steps, and we'll focus on implementing that specific part before moving on to the others.`;
    
    return intro + context + stepsText + callToAction;
  }
  
  // Process user message and determine next steps
  processUserMessage(message: string) {
    // Add user message to conversation history
    this.conversationHistory.push({
      type: 'user',
      content: message,
      challengeId: this.getCurrentChallenge().description
    });
    
    // If waiting for step selection, check if the message selects a step
    if (this.waitingForStepSelection) {
      const selectedStep = this._parseStepSelection(message);
      
      if (selectedStep) {
        // User has selected a step
        this.currentStep = selectedStep;
        this.waitingForStepSelection = false;
        this.stepProgress[selectedStep.id] = {
          status: 'in_progress',
          startedAt: new Date()
        };
        
        // Return step-specific guidance
        const stepGuidance = this._getInitialStepGuidance(selectedStep);
        
        this.conversationHistory.push({
          type: 'guide',
          content: stepGuidance,
          challengeId: this.getCurrentChallenge().description,
          stepId: selectedStep.id
        });
        
        return stepGuidance;
      } else {
        // Remind user to select a step
        return "I don't see a clear step selection in your message. Please choose one of the numbered steps listed above to get started. For example, you can say 'I'll work on step 1' or 'Let's start with the Frontend UI Components'.";
      }
    }
    
    // If user has already selected a step
    if (this.currentStep) {
      // Check if the message indicates the step is complete
      if (this._isStepCompletionMessage(message)) {
        return this._handleStepCompletion();
      }
      
      // Check if user wants to switch to a different step
      const newStepSelection = this._parseStepSelection(message);
      if (newStepSelection && newStepSelection.id !== this.currentStep.id) {
        // User wants to switch steps
        this.currentStep = newStepSelection;
        this.stepProgress[newStepSelection.id] = {
          status: 'in_progress',
          startedAt: new Date()
        };
        
        const stepGuidance = this._getInitialStepGuidance(newStepSelection);
        
        this.conversationHistory.push({
          type: 'guide',
          content: stepGuidance,
          challengeId: this.getCurrentChallenge().description,
          stepId: newStepSelection.id
        });
        
        return stepGuidance;
      }
      
      // Otherwise, provide continued guidance for the current step
      return this._processContinuedStepGuidance(message);
    }
    
    // Check if the message indicates the challenge is complete
    if (this._isChallengeSolutionMessage(message)) {
      // Mark current challenge as complete
      this.project.challenges[this.currentChallengeIndex].completed = true;
      
      // Move to the next challenge
      if (this.currentChallengeIndex < this.project.challenges.length - 1) {
        this.currentChallengeIndex++;
        this.currentStep = null;
        this.waitingForStepSelection = false;
        return this._generateCompletionMessage();
      } else {
        return this._generateAllChallengesCompletedMessage();
      }
    }
    
    // Default response
    return "I'm here to help you implement the missing features in this project. Let me know which specific part you'd like to work on, or if you have any questions about the implementation.";
  }
  
  // Parse a user message to determine which step they want to work on
  _parseStepSelection(message: string) {
    const steps = this.getChallengeSteps();
    const lowerMessage = message.toLowerCase();
    
    // Check for step number references (e.g., "step 1", "number 2")
    for (let i = 0; i < steps.length; i++) {
      const stepNumber = i + 1;
      if (
        lowerMessage.includes(`step ${stepNumber}`) ||
        lowerMessage.includes(`step#${stepNumber}`) ||
        lowerMessage.includes(`step # ${stepNumber}`) ||
        lowerMessage.includes(`number ${stepNumber}`) ||
        lowerMessage.includes(`#${stepNumber}`) ||
        lowerMessage === `${stepNumber}` ||
        lowerMessage.startsWith(`${stepNumber}.`) ||
        lowerMessage.startsWith(`${stepNumber})`)
      ) {
        return steps[i];
      }
    }
    
    // Check for step name references
    for (const step of steps) {
      if (lowerMessage.includes(step.name.toLowerCase())) {
        return step;
      }
    }
    
    // Check for partial step name references
    for (const step of steps) {
      // Create keywords from the step name
      const keywords = step.name.toLowerCase().split(' ');
      
      // Check if multiple keywords are present in the message
      const matchingKeywords = keywords.filter(keyword => 
        keyword.length > 3 && lowerMessage.includes(keyword)
      );
      
      if (matchingKeywords.length >= 2) {
        return step;
      }
    }
    
    // No clear step selection found
    return null;
  }
  
  // Check if the message indicates a step has been completed
  _isStepCompletionMessage(message: string) {
    const lowerMessage = message.toLowerCase();
    const completionPhrases = [
      "i've completed", "i have completed", "finished implementing", 
      "done implementing", "implemented the", "feature is working",
      "it's working now", "it works now", "completed the step",
      "step is complete", "step is done", "finished the step",
      "i'm done with this step", "i am done with this step",
      "this part is complete", "this part is done"
    ];
    
    return completionPhrases.some(phrase => lowerMessage.includes(phrase));
  }
  
  // Check if the message indicates the challenge solution is complete
  _isChallengeSolutionMessage(message: string) {
    const lowerMessage = message.toLowerCase();
    const challengeName = this.getCurrentChallenge().description.toLowerCase();
    
    const completionPhrases = [
      "completed all steps", "finished all steps", 
      "implemented the entire feature", "all steps are complete",
      "feature is fully implemented", "challenge is complete",
      "finished the challenge", "all parts are working"
    ];
    
    return completionPhrases.some(phrase => lowerMessage.includes(phrase)) ||
           (lowerMessage.includes("completed") && lowerMessage.includes(challengeName));
  }
  
  // Handle the completion of a step
  _handleStepCompletion() {
    const completedStep = this.currentStep;
    
    if (!completedStep) return "No step is currently selected.";
    
    // Mark the step as completed
    this.stepProgress[completedStep.id] = {
      ...this.stepProgress[completedStep.id],
      status: 'completed',
      completedAt: new Date()
    };
    
    // Check if there are remaining steps
    const steps = this.getChallengeSteps();
    const remainingSteps = steps.filter(step => 
      !this.stepProgress[step.id] || this.stepProgress[step.id].status !== 'completed'
    );
    
    if (remainingSteps.length > 0) {
      // There are remaining steps
      this.currentStep = null;
      this.waitingForStepSelection = true;
      
      let message = `Great job completing the ${completedStep.name} step!\n\n`;
      message += `You still have the following steps to complete:`;
      
      remainingSteps.forEach((step, index) => {
        message += `\n${index + 1}. ${step.name}: ${step.description}`;
      });
      
      message += `\n\nWhich step would you like to work on next?`;
      
      this.conversationHistory.push({
        type: 'guide',
        content: message,
        challengeId: this.getCurrentChallenge().description
      });
      
      return message;
    } else {
      // All steps are completed, mark the challenge as complete
      this.project.challenges[this.currentChallengeIndex].completed = true;
      
      // Move to the next challenge
      if (this.currentChallengeIndex < this.project.challenges.length - 1) {
        this.currentChallengeIndex++;
        this.currentStep = null;
        this.waitingForStepSelection = false;
        return this._generateCompletionMessage();
      } else {
        return this._generateAllChallengesCompletedMessage();
      }
    }
  }
  
  // Get initial guidance for a specific step
  _getInitialStepGuidance(step: ImplementationStep) {
    let guidance = `Great! Let's work on the **${step.name}** step: ${step.description}.\n\n`;
    
    // Add step-specific guidance
    if (step.id === 'frontend-ui') {
      guidance += `For the frontend UI components, you'll need to implement:

1. A hidden file input element that can be triggered by the visible button
2. A preview area to show the selected image before uploading
3. Visual feedback during the upload process (loading state)

Let's start by adding a file input element and connecting it to the button. Here's some guidance:

- Use a file input with type="file" and accept="image/*" attributes
- Hide it visually using CSS or by setting display: none
- Use a ref to reference the hidden input from your button click handler
- Add an onChange handler to the file input to handle file selection

Would you like me to show you some code for this implementation, or do you want to try implementing it yourself first?`;
    } else if (step.id === 'backend-middleware') {
      guidance += `For the backend file upload middleware, you'll need to:

1. Install a file upload package (Multer is recommended for Express)
2. Configure the storage options (destination folder, filename generation)
3. Set up file filters to only allow image files
4. Add size limits to prevent large file uploads
5. Create the middleware function to use in your route

Let's start by setting up Multer. First, you'll need to install it:

\`\`\`
npm install multer
\`\`\`

Then you'll need to configure it in your server file or route file. Would you like a code example for the basic setup, or do you want to try implementing it yourself first?`;
    } else if (step.id === 'search-ui') {
      guidance += `For the search UI components, you'll need to implement:

1. A search input field with appropriate styling
2. Handling user input and search submission
3. A results display area
4. Loading states during search
5. Empty state when no results are found

Let's start with creating the search input component. You'll want to consider:

- Debouncing input to prevent too many requests
- Adding a search icon and possibly a clear button
- Styling the input appropriately for your application
- Handling form submission for both button click and Enter key press

Would you like a code example to get started, or do you want to try implementing it yourself first?`;
    } else {
      // Generic guidance for other steps
      guidance += `To implement this step, you'll need to:

1. Understand the current code structure related to this feature
2. Identify the specific files that need to be modified
3. Implement the necessary changes
4. Test your implementation

Let's start by examining the relevant code. What questions do you have about this step, or would you like some code examples to get started?`;
    }
    
    return guidance;
  }
  
  // Get continued guidance for the current step based on user message
  _processContinuedStepGuidance(message: string) {
    // Analyze the message to determine the appropriate response
    const lowerMessage = message.toLowerCase();
    
    if (this._isAskingForCode(lowerMessage)) {
      return this._provideCodeSnippet();
    } else if (this._isAskingForHelp(lowerMessage)) {
      return this._provideStepHelp();
    } else if (this._isAskingQuestion(lowerMessage)) {
      return this._answerQuestion(message);
    } else {
      // Generic encouragement and continued guidance
      return this._generateEncouragementMessage();
    }
  }
  
  // Check if user is asking for code examples
  _isAskingForCode(message: string) {
    const codePhrases = [
      "code example", "sample code", "example code", "how do i code", 
      "show me the code", "code snippet", "implementation example",
      "show me how", "can you provide code", "give me code",
      "what's the code", "what is the code"
    ];
    
    return codePhrases.some(phrase => message.includes(phrase));
  }
  
  // Check if user is asking for help
  _isAskingForHelp(message: string) {
    const helpPhrases = [
      "help", "hint", "stuck", "don't understand", "don't know how", 
      "not sure", "guidance", "assist", "confused", "struggling",
      "having trouble", "difficult", "can't figure out"
    ];
    
    return helpPhrases.some(phrase => message.includes(phrase));
  }
  
  // Check if user is asking a question
  _isAskingQuestion(message: string) {
    return message.includes("?") || 
           message.startsWith("what") || 
           message.startsWith("how") || 
           message.startsWith("why") || 
           message.startsWith("when") || 
           message.startsWith("where") || 
           message.startsWith("which") || 
           message.startsWith("can") || 
           message.startsWith("do") || 
           message.startsWith("is") ||
           message.startsWith("are");
  }
  
  // Provide specific help for the current step
  _provideStepHelp() {
    const step = this.currentStep;
    
    if (!step) return "No step is currently selected.";
    
    // Step-specific help
    if (step.id === 'frontend-ui') {
      return `Here are some tips to help you implement the frontend UI components:

1. Start with the basic HTML structure:
   - Add a hidden file input element
   - Create a visible button that will trigger the file input
   - Add a container for the image preview

2. Common challenges with file inputs:
   - Remember that file inputs can't be styled easily, which is why we hide them
   - Use JavaScript to programmatically click the hidden input when the visible button is clicked
   - Make sure to check if a file was actually selected before proceeding

3. For the image preview:
   - Use the FileReader API to read the selected image file as a data URL
   - Set the src attribute of an img element to display the preview
   - Consider adding a default image or placeholder when no image is selected

4. For the loading state:
   - Add a state variable to track when the upload is in progress
   - Disable the button during upload to prevent multiple submissions
   - Consider adding a loading spinner or other visual indicator

Is there a specific part of this implementation that you're struggling with?`;
    } else if (step.id === 'backend-middleware') {
      return `Here are some tips to help you implement the backend file upload middleware:

1. Multer Configuration:
   - Set up storage options (disk storage is common for file uploads)
   - Configure filename generation to avoid collisions (using Date.now() or UUID)
   - Set file size limits (typically 5MB for profile images is reasonable)
   - Add file filters to ensure only images are uploaded

2. Common challenges with file uploads:
   - Make sure the upload directory exists before saving files
   - Validate file types properly (check both mimetype and extension)
   - Handle errors gracefully, especially for file size limits

3. Security considerations:
   - Sanitize filenames to prevent directory traversal attacks
   - Use crypto.randomBytes() to generate random filenames instead of using user-provided names
   - Set proper permissions on upload directories

4. Integration with Express routes:
   - Add the middleware to the specific route that handles file uploads
   - Access the uploaded file via req.file in your route handler

Is there a specific part of this implementation that you're struggling with?`;
    } else {
      // Generic help for other steps
      return `I understand you're looking for help with the ${step.name} step. Here are some general tips:

1. Break down the task into smaller sub-tasks
2. Start with a simple implementation and then refine it
3. Look at the existing code for similar patterns
4. Test your implementation frequently as you develop

Could you tell me more specifically what you're struggling with, and I can provide more targeted guidance?`;
    }
  }
  
  // Answer a user question based on the current step context
  _answerQuestion(question: string) {
    const step = this.currentStep;
    
    if (!step) return "No step is currently selected. Please select a step first.";
    
    const lowerQuestion = question.toLowerCase();
    
    // Step-specific question answers
    if (step.id === 'frontend-ui') {
      if (lowerQuestion.includes("file reader")) {
        return `The FileReader API is used to read files from the user's computer. Here's how you can use it to preview an image:

\`\`\`javascript
const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    // event.target.result contains the data URL representing the file
    setImagePreview(event.target.result);
  };
  reader.readAsDataURL(file);
};
\`\`\`

This code creates a FileReader instance, sets up an onload handler to update your state when the file is read, and then starts reading the file as a data URL, which can be directly used as the src attribute of an img element.`;
      } else if (lowerQuestion.includes("hidden input") || lowerQuestion.includes("file input")) {
        return `To create a hidden file input that's triggered by a visible button, you can use this pattern:

\`\`\`jsx
import React, { useRef } from 'react';

function ImageUploader() {
  const fileInputRef = useRef(null);
  
  const handleButtonClick = () => {
    // Programmatically click the hidden file input
    fileInputRef.current.click();
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Process the selected file
      console.log('File selected:', file.name);
    }
  };
  
  return (
    <div>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleFileChange}
      />
      
      {/* Visible button */}
      <button onClick={handleButtonClick}>
        Select Image
      </button>
    </div>
  );
}
\`\`\`

This code uses a ref to reference the hidden file input element, then triggers a click on it when the visible button is clicked. The onChange handler processes the selected file.`;
      }
    } else if (step.id === 'backend-middleware') {
      if (lowerQuestion.includes("multer")) {
        return `Multer is a Node.js middleware for handling multipart/form-data, which is primarily used for file uploads. Here's how to set it up for image uploads:

\`\`\`javascript
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'uploads/profile-images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/profile-images/');
  },
  filename: function(req, file, cb) {
    // Generate a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Check if the file's MIME type starts with 'image/'
  if (file.mimetype.startsWith('image/')) {
    // Accept the file
    cb(null, true);
  } else {
    // Reject the file
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Create the multer instance
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Use in a route
app.post('/api/users/profile-image', auth, upload.single('profileImage'), (req, res) => {
  // req.file contains info about the uploaded file
  // req.file.path contains the path to the uploaded file
  // Process the uploaded file...
});
\`\`\`

This code sets up Multer with disk storage, configures a unique filename generation function, adds a file filter to only accept images, and sets a 5MB file size limit.`;
      } else if (lowerQuestion.includes("file type") || lowerQuestion.includes("mimetype")) {
        return `To validate file types when uploading images, you can check the MIME type of the uploaded file. Here's how to implement it:

\`\`\`javascript
// File filter function for Multer
const fileFilter = (req, file, cb) => {
  // Check MIME type
  if (file.mimetype.startsWith('image/')) {
    // Accept the file
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// You can also be more specific with allowed types
const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
const strictFileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and GIF files are allowed!'), false);
  }
};
\`\`\`

On the frontend, you can also validate file types before uploading:

\`\`\`javascript
const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  // Check file type
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file');
    return;
  }
  
  // Continue with file processing...
};
\`\`\`

Remember that validating on both frontend and backend is important for security and user experience. The frontend validation provides immediate feedback, while the backend validation ensures security even if someone bypasses the frontend checks.`;
      }
    }
    
    // For questions not directly related to the current step
    return `I'm not sure I understand your question fully. Could you provide more details about what you're trying to accomplish with the ${step.name} step? That will help me give you a more accurate answer.`;
  }
  
  // Provide a code snippet for the current step
  _provideCodeSnippet() {
    const step = this.currentStep;
    
    if (!step) return "No step is currently selected. Please select a step first.";
    
    // Step-specific code snippets
    if (step.id === 'frontend-ui') {
      return `Here's a complete example of how to implement the frontend UI components for profile image upload:

\`\`\`jsx
import React, { useState, useRef } from 'react';
import './ProfileImageUpload.css';

function ProfileImageUpload({ currentImage, onImageUpload }) {
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const handleButtonClick = () => {
    // Trigger the hidden file input
    fileInputRef.current.click();
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    // Create a preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    // Upload the file (in a real implementation)
    handleImageUpload(file);
  };
  
  const handleImageUpload = async (file) => {
    setUploading(true);
    
    try {
      // In a real implementation, you would upload the file to your server
      // This is just a simulation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Call the parent component's handler with the file
      onImageUpload(file);
      
      // Success message
      alert('Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="profile-image-upload">
      <div className="image-container">
        <img 
          src={imagePreview || currentImage || '/default-avatar.png'} 
          alt="Profile" 
          className="profile-image"
        />
        
        {uploading && (
          <div className="upload-overlay">
            <div className="spinner"></div>
          </div>
        )}
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleFileChange}
      />
      
      <button 
        onClick={handleButtonClick}
        disabled={uploading}
        className="upload-button"
      >
        {uploading ? 'Uploading...' : 'Change Profile Image'}
      </button>
    </div>
  );
}

export default ProfileImageUpload;
\`\`\`

And here's some CSS to go with it:

\`\`\`css
.profile-image-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.image-container {
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
}

.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.spinner {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 4px solid white;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.upload-button {
  padding: 8px 16px;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.upload-button:hover {
  background-color: #3a7bc8;
}

.upload-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
\`\`\`

To use this component in your Profile component:

\`\`\`jsx
import ProfileImageUpload from './ProfileImageUpload';

function Profile({ user }) {
  const handleImageUpload = (file) => {
    // In a real implementation, you would create a FormData object
    // and send it to your server
    const formData = new FormData();
    formData.append('profileImage', file);
    
    // Call your API to upload the image
    // api.uploadProfileImage(formData);
  };
  
  return (
    <div className="profile-page">
      <h1>{user.name}</h1>
      <ProfileImageUpload
        currentImage={user.profileImage}
        onImageUpload={handleImageUpload}
      />
      {/* Other profile content */}
    </div>
  );
}
\`\`\`

This implementation includes:
1. A hidden file input triggered by a visible button
2. Image preview functionality using FileReader
3. Validation of image file types
4. Loading state during upload
5. A nice circular image container with overlay during upload

Let me know if you'd like me to explain any part of this code in more detail!`;
    } else if (step.id === 'backend-middleware') {
      return `Here's a complete example of implementing the backend file upload middleware with Multer:

\`\`\`javascript
// Required modules
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Create Express router
const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/profile-images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Generate a secure random filename
    const randomName = crypto.randomBytes(16).toString('hex');
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    // Check if extension is valid
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    if (!validExtensions.includes(fileExtension)) {
      return cb(new Error('Invalid file extension'), false);
    }
    
    cb(null, randomName + fileExtension);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Check MIME type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: fileFilter
});

// Import authentication middleware and User model
const auth = require('../../middleware/auth');
const User = require('../../models/User');

// Profile image upload endpoint
router.post('/profile-image', auth, upload.single('profileImage'), async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Get file path relative to server
    const filePath = '/uploads/profile-images/' + req.file.filename;
    
    // Update user profile with new image URL
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: filePath },
      { new: true }
    ).select('-password');
    
    // Return success response with updated user
    res.json({
      success: true,
      profileImage: filePath,
      user
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    
    // If there was a file uploaded, delete it
    if (req.file) {
      fs.unlink(req.file.path, (unlinkError) => {
        if (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      });
    }
    
    // Check for specific error types
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size exceeds 5MB limit' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// Error handler for multer errors
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size exceeds 5MB limit' });
    }
    return res.status(400).json({ message: err.message });
  } else if (err) {
    // An unknown error occurred
    return res.status(500).json({ message: err.message });
  }
  
  // If no error, continue
  next();
});

module.exports = router;
\`\`\`

In your main server.js file, you'll need to add:

\`\`\`javascript
// Set up static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Use the routes
app.use('/api/users', require('./routes/api/users'));
\`\`\`

This implementation includes:

1. Setting up Multer with disk storage
2. Creating the upload directory if it doesn't exist
3. Generating secure random filenames using crypto
4. Validating file types on both extension and MIME type
5. Setting a 5MB file size limit
6. Implementing the profile image upload endpoint
7. Error handling for various upload scenarios
8. Cleaning up uploaded files on error
9. Serving static files from the uploads directory

Let me know if you need any clarification on this implementation!`;
    } else if (step.id === 'data-model') {
      return `Here's an example of implementing a Follow model for a social media application:

\`\`\`javascript
// models/Follow.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FollowSchema = new Schema({
  follower: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  following: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create a compound index for uniqueness and query optimization
FollowSchema.index({ follower: 1, following: 1 }, { unique: true });

// Static method to check if a user is following another
FollowSchema.statics.isFollowing = async function(followerId, followingId) {
  const follow = await this.findOne({ follower: followerId, following: followingId });
  return !!follow;
};

// Static method to get follower count
FollowSchema.statics.getFollowerCount = async function(userId) {
  return await this.countDocuments({ following: userId });
};

// Static method to get following count
FollowSchema.statics.getFollowingCount = async function(userId) {
  return await this.countDocuments({ follower: userId });
};

// Static method to get followers
FollowSchema.statics.getFollowers = async function(userId, limit = 10, skip = 0) {
  return await this.find({ following: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('follower', 'name username profileImage')
    .lean();
};

// Static method to get following
FollowSchema.statics.getFollowing = async function(userId, limit = 10, skip = 0) {
  return await this.find({ follower: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('following', 'name username profileImage')
    .lean();
};

module.exports = mongoose.model('Follow', FollowSchema);
\`\`\`

You would then need to update your User model to reference the Follow model:

\`\`\`javascript
// Update in models/User.js

// Add methods to get follower and following counts
UserSchema.methods.getFollowerCount = async function() {
  const Follow = require('./Follow');
  return await Follow.getFollowerCount(this._id);
};

UserSchema.methods.getFollowingCount = async function() {
  const Follow = require('./Follow');
  return await Follow.getFollowingCount(this._id);
};

// Check if the user is following another user
UserSchema.methods.isFollowing = async function(userId) {
  const Follow = require('./Follow');
  return await Follow.isFollowing(this._id, userId);
};
\`\`\`

This implementation includes:

1. A Follow schema with follower and following fields (references to User model)
2. A compound index for uniqueness (a user can't follow another user multiple times)
3. Static methods for checking follow status and counting followers/following
4. Static methods for retrieving followers and following lists with pagination
5. Methods added to the User model for convenience

The model is designed to be efficient for common operations like:
- Checking if a user follows another user
- Getting follower/following counts
- Retrieving follower/following lists with pagination
- Enforcing uniqueness at the database level

Let me know if you'd like me to explain any part of this implementation in more detail!`;
    } else {
      // Generic code snippet
      return `I'd be happy to provide some code examples for the ${step.name} step. However, I'd like to understand more specifically what part you need help with. 

Are you looking for examples related to:
- Frontend components and UI design
- Backend API implementation
- Database models and queries
- Form handling and validation
- Authentication and security
- Or something else?

Let me know what specific aspect you're working on, and I can provide a more targeted code example to help you implement that part.`;
    }
  }
  
  // Generate a general encouragement message
  _generateEncouragementMessage() {
    const step = this.currentStep;
    
    if (!step) return "What would you like to focus on first? Choose a step to get started.";
    
    const messages = [
      `How's your implementation of the ${step.name} coming along? Remember to break it down into smaller steps if it feels overwhelming.`,
      `You're making good progress on the ${step.name} step! Let me know if you have any specific questions or if you'd like code examples.`,
      `Working on the ${step.name} can be challenging, but you're on the right track. Feel free to ask for guidance if you get stuck.`,
      `The ${step.name} implementation is an important part of the feature. Take your time to understand the requirements and test your solution thoroughly.`,
      `I'm here to help you with the ${step.name} implementation. Let me know when you're ready for the next step or if you need assistance.`
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  // Get continued guidance for a specific step
  _getStepGuidance(step: ImplementationStep) {
    // Count how many times we've given guidance for this step
    const stepMessages = this.conversationHistory.filter(msg => 
      msg.type === 'guide' && msg.stepId === step.id
    );
    
    // If we've never given guidance for this step, provide initial guidance
    if (stepMessages.length === 0) {
      return this._getInitialStepGuidance(step);
    }
    
    // Otherwise, provide continued guidance
    return `I'm here to help you with the ${step.name} step. What specific part are you working on, or do you have any questions?`;
  }
  
  // Generate a message when a challenge is completed
  _generateCompletionMessage() {
    const completedChallenge = this.project.challenges[this.currentChallengeIndex - 1];
    const nextChallenge = this.getCurrentChallenge();
    
    const messages = [
      `Great job implementing the ${completedChallenge.description} feature! You've successfully completed all the steps for this challenge.`,
      `Excellent work on the ${completedChallenge.description} functionality! That's one challenge fully implemented.`,
      `You've successfully completed the ${completedChallenge.description} feature! The application is getting better with each feature you add.`
    ];
    
    const completion = messages[Math.floor(Math.random() * messages.length)];
    
    // Reset step tracking
    this.currentStep = null;
    this.waitingForStepSelection = true;
    this.stepProgress = {};
    
    return `${completion}\n\nNow, let's move on to the next challenge: ${nextChallenge.description} for the ${nextChallenge.featureName} feature.\n\nLet me break this down into steps that we'll need to implement:`;
  }
  
  // Generate a message when all challenges are completed
  _generateAllChallengesCompletedMessage() {
    return `Congratulations! You've completed all the challenges for this project. You've successfully built a functioning application with all the required features.\n\nYou've demonstrated your skills in implementing various aspects of a full-stack application, from user authentication to complex features like ${this.project.challenges[0].description} and ${this.project.challenges[this.project.challenges.length - 1].description}.\n\nWhat would you like to do next? You could:\n\n1. Add additional features to this project\n2. Optimize the existing code\n3. Start a new project with different challenges\n\nLet me know how you'd like to proceed!`;
  }
  
  // Get project overview with challenge and step status
  getProjectOverview() {
    const completedChallenges = this.project.challenges.filter(c => c.completed).length;
    const totalChallenges = this.project.challenges.length;
    
    let overview = `
Project: ${this.project.name}
Description: ${this.project.description}
Stack: ${this.project.stack}
Progress: ${completedChallenges}/${totalChallenges} challenges completed

Challenges:
${this.project.challenges.map((challenge, index) => 
  `${index + 1}. ${challenge.description} (${challenge.featureName}) - ${challenge.completed ? '✅ Completed' : '⏳ In Progress'}`
).join('\n')}
    `;
    
    // If there's a current challenge, show steps
    if (this.getCurrentChallenge() && !this.getCurrentChallenge().completed) {
      const steps = this.getChallengeSteps();
      
      overview += `\nCurrent Challenge Steps:\n`;
      steps.forEach((step, index) => {
        const status = this.stepProgress[step.id] 
          ? (this.stepProgress[step.id].status === 'completed' ? '✅ Completed' : '🔄 In Progress')
          : '⏳ Not Started';
        
        overview += `${index + 1}. ${step.name} - ${status}\n`;
      });
    }
    
    return overview;
  }
}
