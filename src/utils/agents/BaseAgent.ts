
import { GoogleGenerativeAI } from '@google/generative-ai';

export class BaseAgent {
  protected model: any;
  protected mockMode: boolean = false;

  constructor(model: any) {
    this.model = model;
    
    // Initialize with fallback if model is not available
    if (!this.model) {
      console.warn("Model not available, enabling mock mode");
      this.mockMode = true;
    }
  }

  setMockMode(enabled: boolean) {
    this.mockMode = enabled;
  }

  async generateResponse(prompt: string): Promise<string> {
    try {
      // If in mock mode, return a fallback response
      if (this.mockMode) {
        return this.generateMockResponse(prompt);
      }
      
      // Normal generation via the model
      if (!this.model) {
        throw new Error("AI model not initialized");
      }
      
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Error generating response:', error);
      
      // Fallback to mock response if real generation fails
      return this.generateMockResponse(prompt);
    }
  }
  
  protected generateMockResponse(prompt: string): string {
    // Generate a simple mock response based on the prompt
    const promptLower = prompt.toLowerCase();
    
    if (promptLower.includes('plan') || promptLower.includes('strategy')) {
      return "Based on your request, I've created a strategic plan with multiple steps to achieve your goals. This plan considers the best practices and modern approaches in this domain.";
    }
    
    if (promptLower.includes('design') || promptLower.includes('ui')) {
      return "I've analyzed your UI requirements and created a design approach that emphasizes usability, accessibility, and modern aesthetics while meeting all your functional requirements.";
    }
    
    if (promptLower.includes('code') || promptLower.includes('implement')) {
      return "I've generated implementation code that follows best practices, is well-structured, and implements all the requested functionality. The code is clean, maintainable, and properly documented.";
    }
    
    // Default response
    return "I've processed your request and generated a helpful response that addresses your needs while following best practices in this domain.";
  }
}
