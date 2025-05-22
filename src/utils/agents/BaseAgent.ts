
import { GoogleGenerativeAI } from '@google/generative-ai';

export class BaseAgent {
  protected model: any;

  constructor(model: any) {
    this.model = model;
  }

  async generateResponse(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Error generating response:', error);
      return 'Error generating response. Please try again.';
    }
  }
}
