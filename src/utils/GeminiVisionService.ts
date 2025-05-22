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
  private lastContent: string = '';

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
      this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
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
      if (content) {
        this.lastContent = content; // Always store the current content
        
        // Broadcast content even if we're not processing it
        this.broadcastContentUpdate(content);
        
        // Only process if content has changed and we're not already processing
        if (content !== this.lastProcessedContent && !this.isProcessing) {
          this.processEditorContent(content);
        }
      }
    }, 5000);

    toast({
      title: "Gemini Vision Activated",
      description: "Now monitoring your code edits in real-time."
    });
    
    // Send message to window for listeners to pick up
    window.postMessage({
      type: 'GEMINI_VISION_ACTIVATED',
      data: {
        timestamp: new Date().toISOString()
      }
    }, '*');

    // Immediately capture current content
    const initialContent = captureCallback();
    if (initialContent) {
      this.lastContent = initialContent;
      this.broadcastContentUpdate(initialContent);
      this.processEditorContent(initialContent);
    }
  }
  
  private broadcastContentUpdate(content: string): void {
    // Send the editor content to the chat window via Window messaging
    window.postMessage({
      type: 'GEMINI_VISION_UPDATE',
      data: {
        timestamp: new Date().toISOString(),
        contentLength: content.length,
        editorContent: content // Include the editor content in the update
      }
    }, '*');
    
    this.log('Broadcasted content update, length:', content.length);
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
      
      // Send message to window for listeners to pick up
      window.postMessage({
        type: 'GEMINI_VISION_DEACTIVATED',
        data: {
          timestamp: new Date().toISOString()
        }
      }, '*');
      
      // Clear last content
      this.lastContent = '';
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

      // Broadcast the editor content directly to the chat window
      window.postMessage({
        type: 'GEMINI_VISION_CONTENT',
        data: {
          timestamp: new Date().toISOString(),
          editorContent: content,
          visionResponse: responseText
        }
      }, '*');

    } catch (error: any) {
      console.error('Error in Gemini Vision processing:', error);
      if (this.onError) {
        this.onError(error);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  // Get the last processed content (useful for the chat to know what's in the editor)
  public getLastContent(): string {
    return this.lastContent;
  }

  // Force immediate analysis of current content (useful for when user asks a question)
  public forceAnalysis(): void {
    if (this.lastContent) {
      this.processEditorContent(this.lastContent);
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
  } else if (config) {
    // Update existing instance with new config if provided
    if (config.apiKey) geminiVisionInstance.setApiKey(config.apiKey);
  }
  return geminiVisionInstance;
};
