
export interface Challenge {
  id: string;
  title: string;
  description: string;
  featureName: string;
  difficulty: string;
  type: string;
  filesPaths: string[];
  completed: boolean;
  hints: string[];
}

export interface ConversationMessage {
  type: 'user' | 'guide' | 'hint' | 'codeSnippet';
  content: string;
  challengeId: string;
}

export class AIGuide {
  private project: { challenges: Challenge[] };
  private currentChallengeIndex: number;
  private conversationHistory: ConversationMessage[];
  
  constructor(projectData: { challenges: Challenge[] }) {
    this.project = projectData;
    this.currentChallengeIndex = 0;
    this.conversationHistory = [];
  }
  
  getCurrentChallenge(): Challenge {
    return this.project.challenges[this.currentChallengeIndex];
  }
  
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
  
  private _isChallengeSolutionMessage(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const completionPhrases = [
      "i've completed", "i have completed", "finished implementing", 
      "done implementing", "implemented the feature", "feature is working",
      "it's working now", "it works now", "completed the challenge"
    ];
    
    return completionPhrases.some(phrase => lowerMessage.includes(phrase));
  }
  
  private _isAskingForHelp(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const helpPhrases = [
      "help", "hint", "stuck", "don't understand", "don't know how", 
      "not sure", "guidance", "assist", "confused", "struggling"
    ];
    
    return helpPhrases.some(phrase => lowerMessage.includes(phrase));
  }
  
  private _isAskingForCode(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const codePhrases = [
      "code example", "sample code", "example code", "how do i code", 
      "show me the code", "code snippet", "implementation example"
    ];
    
    return codePhrases.some(phrase => lowerMessage.includes(phrase));
  }
  
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
  
  private _generateAllChallengesCompletedMessage(): string {
    return `Congratulations! You've completed all the challenges for this project. You've successfully built a functioning application with all the required features.\n\nYou've demonstrated your skills in implementing various aspects of a full-stack application, from user authentication to complex features like ${this.project.challenges[0].description} and ${this.project.challenges[this.project.challenges.length - 1].description}.\n\nWhat would you like to do next? You could:\n\n1. Add additional features to this project\n2. Optimize the existing code\n3. Start a new project with different challenges\n\nLet me know how you'd like to proceed!`;
  }
  
  private _provideCodeSnippet(): string {
    const challenge = this.getCurrentChallenge();
    
    // Add this interaction to conversation history
    this.conversationHistory.push({
      type: 'codeSnippet',
      content: 'Code snippet provided',
      challengeId: challenge.description
    });
    
    // Based on the challenge type, provide appropriate code snippet
    // This would be expanded with more code examples for different challenge types
    if (challenge.description.includes('profile image upload')) {
      return "Here's a code snippet for implementing profile image upload...";
    } else if (challenge.description.includes('Follow API')) {
      return "Here's a code snippet to help you implement the Follow API...";
    }
    
    return "Here's some sample code to help you with this challenge...";
  }
  
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
  
  getProjectOverview(): string {
    const completedChallenges = this.project.challenges.filter(c => c.completed).length;
    const totalChallenges = this.project.challenges.length;
    
    const overview = `
Project: ${this.project.name || "Code Challenge"}
Description: ${this.project.description || "A coding challenge project"}
Stack: ${this.project.stack || "Full Stack"}
Progress: ${completedChallenges}/${totalChallenges} challenges completed

Current Challenges:
${this.project.challenges.map((challenge, index) => 
  `${index + 1}. ${challenge.description} (${challenge.featureName}) - ${challenge.completed ? '✅ Completed' : '⏳ In Progress'}`
).join('\n')}
    `;
    
    return overview;
  }
}
