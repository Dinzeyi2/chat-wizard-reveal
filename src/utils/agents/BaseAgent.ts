
export class BaseAgent {
  protected model: any;
  protected mockEnabled: boolean = false;
  protected mockResponses: Record<string, string> = {
    default: "This is a mock response from the AI model."
  };
  protected teachingModeEnabled: boolean = true; // Enable teaching mode by default

  constructor(model: any) {
    this.model = model;
  }

  /**
   * Enable or disable mock mode
   */
  enableMockMode(enabled: boolean = true): void {
    this.mockEnabled = enabled;
  }

  /**
   * Enable or disable teaching mode
   */
  enableTeachingMode(enabled: boolean = true): void {
    this.teachingModeEnabled = enabled;
  }

  /**
   * Set mock responses for testing
   */
  setMockResponses(responses: Record<string, string>): void {
    this.mockResponses = {
      ...this.mockResponses,
      ...responses
    };
  }

  /**
   * Helper method to get a mock response
   */
  protected getMockResponse(prompt: string): string {
    // Try to find a key in mockResponses that is contained in the prompt
    for (const [key, value] of Object.entries(this.mockResponses)) {
      if (prompt.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }
    
    // Return default response if no match
    return this.mockResponses.default;
  }

  /**
   * Transform a standard response into a teaching-oriented response
   * that breaks down concepts and provides challenges
   */
  protected transformToTeachingResponse(response: string, prompt: string): string {
    if (!this.teachingModeEnabled) {
      return response;
    }

    // Extract project name or topic from the prompt
    const topicMatch = prompt.match(/(?:create|make|build|develop|implement)\s+(?:a|an)?\s+([a-zA-Z0-9\s]+)/i);
    const topic = topicMatch ? topicMatch[1].trim() : "project";
    
    // Create a structured learning guide
    return `# Your Hands-On Guide: Building ${topic.charAt(0).toUpperCase() + topic.slice(1)} Step-by-Step

Let's break this down into manageable parts so you can learn while building.

## Understanding the Core Concepts

${response}

## Getting Started: Your Learning Path

I'll guide you through building this ${topic} one step at a time. For each step:
1. Read the explanation of *why* we're doing things a certain way
2. Try to complete the code snippets yourself based on the guidance
3. Test your implementation before moving to the next step

## Challenge Structure

Each part contains:
- A clear explanation of concepts
- Partially complete code snippets for you to finish
- Self-check questions to test your understanding
- Debugging tips if you get stuck

Let me know when you're ready to start with the first module, and we'll begin building your ${topic} together!`;
  }

  /**
   * Generate a response using the OpenAI API
   */
  async generateResponse(prompt: string): Promise<string> {
    // Return mock response if mock mode is enabled
    if (this.mockEnabled) {
      console.log("Using mock response for prompt:", prompt.substring(0, 50) + "...");
      return this.getMockResponse(prompt);
    }
    
    // Create a learning-oriented system prompt
    const enhancedPrompt = this.teachingModeEnabled ? 
      `You are an expert coding mentor who teaches by breaking down concepts into small steps. 
      Your task is to guide the user in building their project without giving complete solutions.
      Instead of providing full code:
      1. Break the problem into logical steps
      2. Explain concepts clearly and why they matter
      3. Provide partial code snippets that the user needs to complete
      4. Include self-check questions and learning challenges
      5. Focus on building understanding, not just delivering code
      
      User request: ${prompt}` : prompt;
    
    try {
      // Use the OpenAI API through our edge function
      const response = await fetch('/functions/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: enhancedPrompt,
          teachingMode: this.teachingModeEnabled
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform the response into a teaching-oriented format if teaching mode is enabled
      return this.teachingModeEnabled ? 
        this.transformToTeachingResponse(data.response, prompt) : 
        data.response;
    } catch (error) {
      console.error('Error generating response:', error);
      
      // If there's an error, fall back to mock mode
      console.log("Error in AI generation, falling back to mock response");
      return this.getMockResponse(prompt);
    }
  }
  
  /**
   * Create a challenge for the user based on their current implementation
   */
  createLearningChallenge(topic: string, difficulty: 'beginner'|'intermediate'|'advanced' = 'beginner'): string {
    const challenges = {
      beginner: [
        "Try modifying the code to change the appearance without breaking functionality.",
        "Add comments to explain what each function does in your own words.",
        "Identify potential edge cases this code doesn't handle yet."
      ],
      intermediate: [
        "Refactor one part of the code to make it more efficient.",
        "Add a new feature that complements the existing functionality.",
        "Create unit tests to verify the code works as expected."
      ],
      advanced: [
        "Implement a more sophisticated algorithm to improve performance.",
        "Add error handling and recovery strategies.",
        "Make the solution more scalable for larger inputs/datasets."
      ]
    };
    
    // Select random challenge based on difficulty
    const selectedChallenges = challenges[difficulty];
    const challenge = selectedChallenges[Math.floor(Math.random() * selectedChallenges.length)];
    
    return `
## Learning Challenge

**Topic:** ${topic}
**Difficulty:** ${difficulty}

${challenge}

When you complete this challenge, you'll have a deeper understanding of how ${topic} works.
`;
  }
}
