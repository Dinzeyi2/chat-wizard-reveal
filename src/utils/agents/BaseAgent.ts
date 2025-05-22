
export class BaseAgent {
  protected model: any;
  protected mockEnabled: boolean = false;
  protected mockResponses: Record<string, string> = {
    default: "This is a mock response from the AI model."
  };

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

  async generateResponse(prompt: string): Promise<string> {
    // Return mock response if mock mode is enabled
    if (this.mockEnabled) {
      console.log("Using mock response for prompt:", prompt.substring(0, 50) + "...");
      return this.getMockResponse(prompt);
    }
    
    try {
      // Use the OpenAI API directly instead of Gemini model
      const response = await fetch('/functions/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error generating response:', error);
      
      // If there's an error, fall back to mock mode
      console.log("Error in AI generation, falling back to mock response");
      return this.getMockResponse(prompt);
    }
  }
}
