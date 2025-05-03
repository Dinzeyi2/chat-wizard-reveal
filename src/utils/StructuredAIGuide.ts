import { Challenge } from "./AIGuide";

export interface ImplementationStep {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: 'frontend' | 'backend' | 'integration' | 'testing' | 'design';
  filePaths?: string[];
  hints: string[];
}

export interface StepProgress {
  status: 'not_started' | 'in_progress' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
}

export class StructuredAIGuide {
  private project: any;
  private currentChallengeIndex: number;
  private conversationHistory: any[];
  private stepProgress: Record<string, StepProgress>;
  
  public currentStep: ImplementationStep | null;
  public waitingForStepSelection: boolean;
  
  constructor(projectData: any) {
    this.project = projectData;
    this.currentChallengeIndex = 0;
    this.conversationHistory = [];
    this.currentStep = null;
    this.stepProgress = {};
    this.waitingForStepSelection = true;
  }
  
  // Get the current challenge
  getCurrentChallenge(): Challenge {
    return this.project.challenges[this.currentChallengeIndex];
  }
  
  // Get steps for current challenge
  getChallengeSteps(): ImplementationStep[] {
    const challenge = this.getCurrentChallenge();
    
    // Define steps based on challenge type
    if (challenge.type.includes('profile') || challenge.description.includes('profile image')) {
      return [
        {
          id: 'frontend-ui',
          name: 'Frontend UI Components',
          description: 'Implement the file input and preview UI elements',
          difficulty: 'beginner',
          type: 'frontend',
          hints: [
            'Create a hidden file input triggered by a button',
            'Add image preview functionality using FileReader',
            'Style the upload button and preview container'
          ]
        },
        {
          id: 'frontend-logic',
          name: 'Frontend Upload Logic', 
          description: 'Handle file selection, validation and upload process',
          difficulty: 'intermediate',
          type: 'frontend',
          hints: [
            'Validate file type and size before uploading',
            'Create a FormData object to send the file',
            'Show loading state during upload'
          ]
        },
        {
          id: 'backend-middleware',
          name: 'Backend File Upload Middleware',
          description: 'Set up server middleware for handling file uploads',
          difficulty: 'intermediate',
          type: 'backend',
          hints: [
            'Use a library like Multer or Formidable',
            'Configure storage location and filename generation',
            'Add file size and type validation'
          ]
        },
        {
          id: 'backend-storage',
          name: 'Backend Storage Implementation',
          description: 'Implement file storage and database updating',
          difficulty: 'intermediate',
          type: 'backend',
          hints: [
            'Store uploaded files in a designated directory',
            'Update user profile with new image path',
            'Handle existing files (delete old ones)'
          ]
        },
        {
          id: 'security',
          name: 'Security and Validation',
          description: 'Add proper security measures and validation',
          difficulty: 'advanced',
          type: 'integration',
          hints: [
            'Sanitize filenames to prevent path traversal',
            'Implement server-side file type validation',
            'Add authentication checks'
          ]
        }
      ];
    } else if (challenge.type.includes('auth') || challenge.description.includes('password reset')) {
      return [
        {
          id: 'frontend-form',
          name: 'Password Reset Form',
          description: 'Create the password reset request form',
          difficulty: 'beginner',
          type: 'frontend',
          hints: [
            'Create a form with email input field',
            'Add form validation',
            'Display appropriate success/error messages'
          ]
        },
        {
          id: 'backend-email',
          name: 'Email Notification System',
          description: 'Set up system for sending password reset emails',
          difficulty: 'intermediate',
          type: 'backend',
          hints: [
            'Choose an email sending library (e.g., Nodemailer)',
            'Create an email template for password reset',
            'Set up environment variables for email credentials'
          ]
        },
        {
          id: 'backend-token',
          name: 'Reset Token Generation',
          description: 'Implement secure token generation and storage',
          difficulty: 'advanced',
          type: 'backend',
          hints: [
            'Generate a secure random token',
            'Store token with expiration time in database',
            'Create an API endpoint for token verification'
          ]
        },
        {
          id: 'frontend-reset',
          name: 'Reset Page Implementation',
          description: 'Create the page for entering a new password',
          difficulty: 'intermediate',
          type: 'frontend',
          hints: [
            'Create a form with password and confirm password fields',
            'Validate token from URL parameters',
            'Implement client-side password validation'
          ]
        }
      ];
    } else if (challenge.type.includes('search') || challenge.description.includes('search')) {
      return [
        {
          id: 'frontend-search-ui',
          name: 'Search UI Components',
          description: 'Create the search input and results display',
          difficulty: 'beginner',
          type: 'frontend',
          hints: [
            'Create a search input with appropriate styling',
            'Implement a results container with loading states',
            'Add clear and submit buttons'
          ]
        },
        {
          id: 'frontend-search-logic',
          name: 'Search Logic and State',
          description: 'Implement search query handling and state management',
          difficulty: 'intermediate',
          type: 'frontend',
          hints: [
            'Manage search query state',
            'Implement debouncing for input',
            'Handle loading, error, and empty states'
          ]
        },
        {
          id: 'backend-search-api',
          name: 'Search API Implementation',
          description: 'Create backend endpoint for processing search queries',
          difficulty: 'advanced',
          type: 'backend',
          hints: [
            'Define query parameters and validation',
            'Implement efficient database querying',
            'Add pagination for results'
          ]
        },
        {
          id: 'backend-search-indexing',
          name: 'Search Optimization',
          description: 'Optimize search with indexes and advanced techniques',
          difficulty: 'advanced',
          type: 'backend',
          hints: [
            'Create appropriate database indexes',
            'Implement full text search if needed',
            'Consider caching for frequent searches'
          ]
        }
      ];
    } else if (challenge.type.includes('follow') || challenge.description.includes('follow')) {
      return [
        {
          id: 'data-model',
          name: 'Follow Data Model',
          description: 'Create the data model for user relationships',
          difficulty: 'intermediate',
          type: 'backend',
          hints: [
            'Design a schema with follower and following references',
            'Add unique constraints to prevent duplicate follows',
            'Include timestamps for when relationships were created'
          ]
        },
        {
          id: 'follow-api',
          name: 'Follow/Unfollow API',
          description: 'Implement endpoints for following and unfollowing users',
          difficulty: 'intermediate',
          type: 'backend',
          hints: [
            'Create POST endpoint for following a user',
            'Create DELETE endpoint for unfollowing',
            'Add proper error handling for duplicates'
          ]
        },
        {
          id: 'followers-ui',
          name: 'Follow Button UI',
          description: 'Create a follow/unfollow button component',
          difficulty: 'beginner',
          type: 'frontend',
          hints: [
            'Design a toggle button with appropriate states',
            'Handle loading and error states',
            'Update UI optimistically'
          ]
        },
        {
          id: 'followers-list',
          name: 'Followers/Following Lists',
          description: 'Implement views to display user relationships',
          difficulty: 'intermediate',
          type: 'frontend',
          hints: [
            'Create a reusable list component for users',
            'Implement pagination or infinite scrolling',
            'Add filters or search functionality'
          ]
        }
      ];
    } else {
      // Generic steps for other challenge types
      return [
        {
          id: 'requirements',
          name: 'Requirements Analysis',
          description: 'Analyze and understand the feature requirements',
          difficulty: 'beginner',
          type: 'design',
          hints: [
            'Break down the feature into clear requirements',
            'Identify which components and files need changes',
            'Plan the data flow through your application'
          ]
        },
        {
          id: 'frontend',
          name: 'Frontend Implementation',
          description: 'Implement the UI and client-side logic',
          difficulty: 'intermediate',
          type: 'frontend',
          hints: [
            'Create reusable UI components',
            'Implement state management',
            'Add form validation if needed'
          ]
        },
        {
          id: 'backend',
          name: 'Backend Implementation',
          description: 'Create necessary API endpoints and services',
          difficulty: 'intermediate',
          type: 'backend',
          hints: [
            'Design API endpoints following RESTful principles',
            'Implement proper error handling',
            'Add authentication and authorization checks'
          ]
        },
        {
          id: 'testing',
          name: 'Testing',
          description: 'Test the functionality thoroughly',
          difficulty: 'intermediate',
          type: 'testing',
          hints: [
            'Test happy path scenarios',
            'Test error handling and edge cases',
            'Verify UI updates correctly based on state changes'
          ]
        }
      ];
    }
  }
  
  // Process incoming message from user
  processUserMessage(message: string): string {
    // Add user message to conversation history
    this.conversationHistory.push({
      type: 'user',
      content: message,
      timestamp: new Date()
    });
    
    // Check if we're waiting for step selection
    if (this.waitingForStepSelection) {
      // Try to determine which step the user wants to work on
      const stepSelection = this._tryParseStepSelection(message);
      
      if (stepSelection) {
        this.currentStep = stepSelection;
        this.waitingForStepSelection = false;
        this.stepProgress[stepSelection.id] = {
          status: 'in_progress',
          startedAt: new Date()
        };
        
        // Generate step-specific guidance
        const guidance = this._getInitialStepGuidance(stepSelection);
        
        this.conversationHistory.push({
          type: 'guide',
          content: guidance,
          stepId: stepSelection.id,
          timestamp: new Date()
        });
        
        return guidance;
      } else {
        // If we're waiting for step selection but the message doesn't contain a selection,
        // show the list of steps again
        return this._generateStepSelectionPrompt();
      }
    }
    
    // Check if message indicates step completion
    if (this.currentStep && this._isStepCompletionMessage(message)) {
      // Mark current step as complete
      this.stepProgress[this.currentStep.id] = {
        ...this.stepProgress[this.currentStep.id],
        status: 'completed',
        completedAt: new Date()
      };
      
      // Check if all steps are complete for this challenge
      const allStepsComplete = this._areAllStepsComplete();
      
      if (allStepsComplete) {
        // Mark current challenge as complete
        this.project.challenges[this.currentChallengeIndex].completed = true;
        
        // Move to next challenge if available
        if (this.currentChallengeIndex < this.project.challenges.length - 1) {
          this.currentChallengeIndex++;
          
          // Generate completion message
          const completionMessage = this._generateCompletionMessage();
          
          this.waitingForStepSelection = true;
          this.currentStep = null;
          
          // Add completion message to history
          this.conversationHistory.push({
            type: 'guide',
            content: completionMessage,
            timestamp: new Date()
          });
          
          return completionMessage;
        } else {
          // All challenges completed
          const allDoneMessage = this._generateAllChallengesCompletedMessage();
          
          this.conversationHistory.push({
            type: 'guide',
            content: allDoneMessage,
            timestamp: new Date()
          });
          
          return allDoneMessage;
        }
      } else {
        // Not all steps complete, prompt for next step
        this.waitingForStepSelection = true;
        this.currentStep = null;
        
        const stepPrompt = this._generateStepSelectionPrompt();
        
        this.conversationHistory.push({
          type: 'guide',
          content: stepPrompt,
          timestamp: new Date()
        });
        
        return stepPrompt;
      }
    }
    
    // If we have a current step, provide guidance for it
    if (this.currentStep) {
      // Check if asking for code example
      if (this._isAskingForCode(message)) {
        const codeSnippet = this._provideCodeSnippet();
        
        this.conversationHistory.push({
          type: 'codeSnippet',
          content: codeSnippet,
          stepId: this.currentStep.id,
          timestamp: new Date()
        });
        
        return codeSnippet;
      }
      
      // Check if asking for help with specific step
      if (this._isAskingForHelp(message)) {
        const guidance = this._getStepGuidance(this.currentStep);
        
        this.conversationHistory.push({
          type: 'guide',
          content: guidance,
          stepId: this.currentStep.id,
          timestamp: new Date()
        });
        
        return guidance;
      }
      
      // Handle specific questions about current step
      if (message.trim().endsWith('?')) {
        const answer = this._answerStepQuestion(message);
        
        this.conversationHistory.push({
          type: 'guide',
          content: answer,
          stepId: this.currentStep.id,
          timestamp: new Date()
        });
        
        return answer;
      }
      
      // General encouragement and guidance
      const encouragement = this._generateEncouragementMessage();
      
      this.conversationHistory.push({
        type: 'guide',
        content: encouragement,
        stepId: this.currentStep.id,
        timestamp: new Date()
      });
      
      return encouragement;
    }
    
    // Fallback for unexpected state
    return "I'm here to help you implement your application. Let's break down the current challenge into specific steps and work on them one by one.";
  }

  // Try to determine which step the user wants to work on based on their message
  private _tryParseStepSelection(message: string): ImplementationStep | null {
    const steps = this.getChallengeSteps();
    const lowerMessage = message.toLowerCase();
    
    // Check if message contains step number
    const numberMatch = lowerMessage.match(/step\s*(\d+)|(\d+)(?:st|nd|rd|th)?\s*step/);
    if (numberMatch) {
      const stepNumber = parseInt(numberMatch[1] || numberMatch[2]) - 1;
      if (stepNumber >= 0 && stepNumber < steps.length) {
        return steps[stepNumber];
      }
    }
    
    // Check if message contains step name or description
    for (const step of steps) {
      if (lowerMessage.includes(step.id.toLowerCase()) || 
          lowerMessage.includes(step.name.toLowerCase()) ||
          lowerMessage.includes(step.description.toLowerCase())) {
        return step;
      }
    }
    
    // Check for common keywords
    if (lowerMessage.includes('front') && !lowerMessage.includes('back')) {
      return steps.find(step => step.type === 'frontend') || null;
    }
    
    if (lowerMessage.includes('back') && !lowerMessage.includes('front')) {
      return steps.find(step => step.type === 'backend') || null;
    }
    
    if (lowerMessage.includes('ui') || lowerMessage.includes('interface')) {
      return steps.find(step => step.type === 'frontend') || null;
    }
    
    if (lowerMessage.includes('api') || lowerMessage.includes('server')) {
      return steps.find(step => step.type === 'backend') || null;
    }
    
    return null;
  }
  
  // Generate a prompt asking the user to select a step to work on
  private _generateStepSelectionPrompt(): string {
    const steps = this.getChallengeSteps();
    const challenge = this.getCurrentChallenge();
    
    // Get incomplete steps
    const incompleteSteps = steps.filter(step => 
      !this.stepProgress[step.id] || 
      this.stepProgress[step.id].status !== 'completed'
    );
    
    if (incompleteSteps.length === 0) {
      // Should never get here, but just in case
      return "It looks like you've completed all the steps for this challenge!";
    }
    
    let response = `For the "${challenge.description}" feature, here are the implementation steps we need to work on:\n\n`;
    
    steps.forEach((step, index) => {
      const status = this.stepProgress[step.id]?.status === 'completed' ? '✅ Completed' : '⏳ Pending';
      response += `${index + 1}. ${step.name} - ${step.description} (${status})\n`;
    });
    
    response += `\nWhich step would you like to work on next? Please choose one of the numbered steps that's not yet completed.`;
    
    return response;
  }
  
  // Generate initial guidance for a specific step
  private _getInitialStepGuidance(step: ImplementationStep): string {
    let guidance = `Great! Let's work on the **${step.name}** step: ${step.description}.\n\n`;
    
    if (step.id === 'frontend-ui') {
      guidance += `For the frontend UI components, you'll need to implement:

1. A hidden file input element that can be triggered by the visible button
2. A preview area to show the selected image before uploading
3. Visual feedback during the upload process (loading state)

Let's start by adding a file input element and connecting it to the button. Here's some guidance:

- Use a file input with type="file" and accept="image/*" attributes
- Hide it visually using CSS or by setting display: none
- Use a ref to reference the hidden input from your button click handler
- Add an onChange handler to the file input to handle file selection`;
    } else if (step.id === 'frontend-logic') {
      guidance += `For the frontend upload logic, you'll need to implement:

1. Validation to ensure only valid image files are selected
2. Creation of a FormData object to send the file to the server
3. State management to show loading status during upload
4. Error handling for various failure scenarios

Let's start with validation and the file upload function. Here's some guidance:

- Check the file type using file.type.startsWith('image/')
- Set size limits for the file (e.g., max 5MB)
- Create a FormData object and append the file with a field name
- Add loading state and error handling in your upload function`;
    } else if (step.id === 'backend-middleware') {
      guidance += `For the backend file upload middleware, you'll need to implement:

1. A file upload middleware (like Multer for Node.js)
2. Configuration for file storage destination
3. Filename generation strategy to avoid conflicts
4. File type and size validation at the server level

Let's start by setting up the middleware. Here's some guidance:

- Install a file upload middleware package if needed
- Configure the storage options (destination, filename generation)
- Set file size limits
- Add file type validation using mimetype checks`;
    } else {
      guidance += `For this step, you'll need to break it down into smaller tasks and implement them one by one. Here are some key considerations for the ${step.name}:

1. Understand the requirements and expected outcome
2. Identify the specific files and components that need to be modified
3. Make incremental changes and test as you go
4. Consider edge cases and error scenarios

Let me know if you need specific help with any part of this step, or if you'd like to see code examples.`;
    }
    
    guidance += `\n\nWould you like me to show you some code examples for this step, or do you want to try implementing it on your own first?`;
    
    return guidance;
  }
  
  // Check if a message indicates that a step is completed
  private _isStepCompletionMessage(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const completionPhrases = [
      "i've completed", "i have completed", "finished implementing", 
      "done implementing", "implemented the", "feature is working",
      "it's working now", "it works now", "completed the step",
      "i'm done", "i am done", "step is complete"
    ];
    
    return completionPhrases.some(phrase => lowerMessage.includes(phrase));
  }
  
  // Check if all steps for current challenge are complete
  private _areAllStepsComplete(): boolean {
    const steps = this.getChallengeSteps();
    
    return steps.every(step => 
      this.stepProgress[step.id] && 
      this.stepProgress[step.id].status === 'completed'
    );
  }
  
  // Check if user is asking for help
  private _isAskingForHelp(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const helpPhrases = [
      "help", "hint", "stuck", "don't understand", "don't know how", 
      "not sure", "guidance", "assist", "confused", "struggling",
      "how do i", "how to", "explain"
    ];
    
    return helpPhrases.some(phrase => lowerMessage.includes(phrase));
  }
  
  // Check if user is asking for code
  private _isAskingForCode(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const codePhrases = [
      "code example", "sample code", "example code", "how do i code", 
      "show me the code", "code snippet", "implementation example",
      "show code", "provide code", "code sample"
    ];
    
    return codePhrases.some(phrase => lowerMessage.includes(phrase));
  }
  
  // Answer specific questions about the current step
  private _answerStepQuestion(question: string): string {
    const step = this.currentStep;
    if (!step) return "I'm not sure what you're asking about. Please select a step to work on first.";
    
    const lowerQuestion = question.toLowerCase();
    
    // Extract some common frontend-related questions
    if (step.id.startsWith('frontend')) {
      if (lowerQuestion.includes('file input') || lowerQuestion.includes('file upload')) {
        return `To implement a file input for image upload:

1. Create a hidden input element: 
\`\`\`jsx
<input 
  type="file" 
  ref={fileInputRef} 
  style={{ display: 'none' }} 
  accept="image/*" 
  onChange={handleFileChange} 
/>
\`\`\`

2. Create a visible button that triggers the file input:
\`\`\`jsx
<button onClick={() => fileInputRef.current.click()}>
  Upload Image
</button>
\`\`\`

3. Handle the file selection:
\`\`\`jsx
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
    if (!step) return "Please select a step to work on first.";
    
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
\`\`\``;
    } else if (step.id === 'frontend-logic') {
      return `Here's a code example for implementing the frontend upload logic:

\`\`\`jsx
import React, { useState, useRef } from 'react';
import axios from 'axios';

function ImageUploader({ onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    setError(null);
    const selectedFile = e.target.files[0];
    
    // Validate file exists
    if (!selectedFile) return;
    
    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, etc.)');
      return;
    }
    
    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit');
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
    
    // Store file
    setFile(selectedFile);
  };
  
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    setUploading(true);
    setError(null);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('profileImage', file);
      
      // Send to server
      const response = await axios.post('/api/users/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Handle success
      setUploading(false);
      
      // Pass result to parent component
      if (onUploadComplete) {
        onUploadComplete(response.data);
      }
    } catch (err) {
      setUploading(false);
      
      // Handle different error types
      if (err.response) {
        // Server responded with error
        setError(err.response.data.message || 'Upload failed');
      } else if (err.request) {
        // No response received
        setError('No response from server. Please try again.');
      } else {
        // Other error
        setError('Upload failed: ' + err.message);
      }
    }
  };
  
  return (
    <div className="image-uploader">
      {error && <div className="error-message">{error}</div>}
      
      {preview && (
        <div className="preview-container">
          <img src={preview} alt="Preview" className="image-preview" />
        </div>
      )}
      
      <div className="upload-controls">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          style={{ display: 'none' }}
        />
        
        <button 
          onClick={() => fileInputRef.current.click()}
          className="select-button"
          disabled={uploading}
        >
          Select Image
        </button>
        
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="upload-button"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
    </div>
  );
}

export default ImageUploader;
\`\`\`

This implementation includes:

1. File selection with a hidden input
2. File validation (type and size)
3. Preview generation with FileReader
4. FormData creation for upload
5. Loading state during upload
6. Error handling for various scenarios
7. Parent component notification on completion

To use this component:

\`\`\`jsx
function ProfilePage() {
  const handleUploadComplete = (result) => {
    console.log('Upload complete:', result);
    // Update user profile state, etc.
  };
  
  return (
    <div className="profile-page">
      <h1>Your Profile</h1>
      <ImageUploader onUploadComplete={handleUploadComplete} />
    </div>
  );
}
\`\`\``;
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
    if (!step) return "Let's get started on implementing your application. What step would you like to work on first?";
    
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
