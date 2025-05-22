
import { GoogleGenerativeAI } from '@google/generative-ai';
import { toast } from '@/hooks/use-toast';

interface VisionServiceConfig {
  apiKey?: string;
  debug?: boolean;
  onVisionResponse?: (response: string) => void;
  onError?: (error: Error) => void;
}

export class GeminiVisionService {
  private apiKey?: string;
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private debug: boolean;
  private onVisionResponse: ((response: string) => void) | undefined;
  private onError: ((error: Error) => void) | undefined;
  private isEnabled: boolean = false;
  private isProcessing: boolean = false;
  private lastProcessedContent: string = '';
  private captureInterval: number | null = null;

  constructor(config: VisionServiceConfig = {}) {
    this.apiKey = config.apiKey;
    this.debug = config.debug || false;
    this.onVisionResponse = config.onVisionResponse;
    this.onError = config.onError;

    if (this.apiKey) {
      this.initialize();
    }
  }

  private initialize() {
    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey!);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
      this.log('Gemini Vision Service initialized');
      this.isEnabled = true;
    } catch (error) {
      console.error('Failed to initialize Gemini Vision:', error);
      this.isEnabled = false;
    }
  }

  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.initialize();
  }

  public isVisionEnabled(): boolean {
    return this.isEnabled;
  }

  public startCapturing(captureCallback: () => string | null): void {
    if (!this.isEnabled || !this.apiKey) {
      toast({
        title: "Gemini Vision Not Available",
        description: "Please set your Gemini API key to enable Vision features.",
        variant: "destructive"
      });
      return;
    }

    if (this.captureInterval) {
      clearInterval(this.captureInterval);
    }

    this.log('Starting vision capture every 5 seconds');
    
    // Set up interval to capture editor content every 5 seconds
    this.captureInterval = window.setInterval(() => {
      const content = captureCallback();
      if (content && content !== this.lastProcessedContent && !this.isProcessing) {
        this.processEditorContent(content);
      }
    }, 5000);

    toast({
      title: "Gemini Vision Activated",
      description: "Now monitoring your code edits in real-time."
    });
  }

  public stopCapturing(): void {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
      this.log('Vision capture stopped');
      
      toast({
        title: "Gemini Vision Deactivated",
        description: "No longer monitoring your code edits."
      });
    }
  }

  public async processEditorContent(content: string): Promise<void> {
    if (!this.isEnabled || !this.apiKey || this.isProcessing) {
      return;
    }

    try {
      this.isProcessing = true;
      this.log('Processing editor content:', content.substring(0, 100) + '...');

      // Store the content we're processing to avoid reprocessing
      this.lastProcessedContent = content;

      // Format the content for better visualization
      const formattedContent = `\`\`\`\n${content}\n\`\`\``;

      // Create a chat session
      const chat = this.model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: "Here's the code I'm currently working on in the editor. Just acknowledge you can see it but don't analyze it unless I ask you to:" }],
          },
          {
            role: "model",
            parts: [{ text: "I can see your code editor is active. I'm ready to help with your code when needed. Just let me know what you'd like me to do with it." }],
          }
        ],
      });

      // Send the content to Gemini
      const result = await chat.sendMessage(formattedContent);
      const response = result.response;
      const responseText = response.text();

      this.log('Received vision response:', responseText);

      // Call the response handler if provided
      if (this.onVisionResponse) {
        this.onVisionResponse(responseText);
      }

      // Log status to console for the AI to pick up
      console.log("GEMINI_VISION_UPDATE:", JSON.stringify({
        timestamp: new Date().toISOString(),
        contentLength: content.length,
        responseReceived: true
      }));

    } catch (error: any) {
      console.error('Error in Gemini Vision processing:', error);
      if (this.onError) {
        this.onError(error);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private log(...args: any[]): void {
    if (this.debug) {
      console.log('[GeminiVision]', ...args);
    }
  }
}

// Create a singleton instance
let geminiVisionInstance: GeminiVisionService | null = null;

export const getGeminiVisionService = (config?: VisionServiceConfig): GeminiVisionService => {
  if (!geminiVisionInstance) {
    geminiVisionInstance = new GeminiVisionService(config);
  }
  return geminiVisionInstance;
};
