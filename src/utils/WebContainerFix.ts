
import { toast } from '@/hooks/use-toast';

/**
 * WebContainerFix - Enhanced solution for WebContainer initialization issues
 * This class addresses common WebContainer initialization failures and provides fallback options
 */
export class WebContainerFix {
  private webcontainer: any = null;
  private currentRetry: number = 0;
  private files: Array<any> = [];
  private staticPreviewEnabled: boolean = false;
  private debugLog: Array<any> = [];
  private serverUrl: string | null = null;
  private isReady: boolean = false;
  
  constructor(private options: any = {}) {
    this.options = {
      maxRetries: 3,
      retryDelay: 1000,
      showDebugInfo: true,
      enableFallback: true,
      ...options
    };
  }
  
  /**
   * Log debug information
   */
  log(message: string, type: 'info' | 'warn' | 'error' = 'info') {
    const logEntry = { timestamp: new Date().toISOString(), type, message };
    this.debugLog.push(logEntry);
    
    if (this.options.showDebugInfo) {
      const method = type === 'error' ? 'error' : type === 'warn' ? 'warn' : 'log';
      console[method](`[WebContainerFix] ${message}`);
    }
    
    // Notify user of important events
    if (type === 'error') {
      toast({
        title: "WebContainer Error",
        description: message,
        variant: "destructive"
      });
    } else if (type === 'warn') {
      toast({
        title: "WebContainer Warning",
        description: message,
        variant: "default"
      });
    } else if (message.includes('success') || message.includes('ready')) {
      toast({
        title: "WebContainer Status",
        description: message,
        variant: "default"
      });
    }
  }
  
  /**
   * Main initialization method
   */
  async initialize() {
    this.log('Starting WebContainer initialization...');
    
    try {
      // Check if we're in a secure context
      if (!window.isSecureContext) {
        throw new Error('WebContainer requires a secure context (HTTPS or localhost)');
      }
      
      // Import WebContainer API dynamically
      const { WebContainer } = await import('@webcontainer/api');
      
      // Try to boot WebContainer
      this.log('Booting WebContainer...');
      
      try {
        // Try with alternative configuration first (often works better in some environments)
        this.webcontainer = await Promise.race([
          WebContainer.boot({
            coep: 'credentialless',
            workdirName: 'webcontainer-workdir'
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('WebContainer boot timeout')), 10000)
          )
        ]);
      } catch (firstBootError: any) {
        this.log(`First boot attempt failed: ${firstBootError.message}`, 'warn');
        
        // Check for cross-origin isolation errors
        if (firstBootError.message.includes('SharedArrayBuffer') || 
            firstBootError.message.includes('crossOriginIsolated')) {
          throw new Error('Cross-origin isolation required but not available');
        }
        
        // Check for instance limit
        if (firstBootError.message.includes('Unable to create more instances')) {
          throw new Error('WebContainer instance limit reached');
        }
        
        // Wait a bit before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try standard configuration
        this.webcontainer = await WebContainer.boot();
      }
      
      // Set up handlers for server
      this.webcontainer.on('server-ready', (port: number, url: string) => {
        this.log(`Server ready at ${url}`);
        this.serverUrl = url;
        this.dispatchEvent(new CustomEvent('preview-ready', { detail: { url } }));
      });
      
      this.isReady = true;
      this.log('WebContainer initialized successfully!');
      this.dispatchEvent(new CustomEvent('webcontainer-ready'));
      
      return true;
    } catch (error: any) {
      this.log(`WebContainer initialization failed: ${error.message}`, 'error');
      
      // Dispatch error event
      this.dispatchEvent(new CustomEvent('webcontainer-error', { 
        detail: { 
          error, 
          isCrossOriginError: error.message.includes('cross-origin') || 
                             error.message.includes('SharedArrayBuffer'),
          isInstanceLimitError: error.message.includes('instance limit') ||
                               error.message.includes('Unable to create more instances')
        } 
      }));
      
      // Enable static preview as fallback if enabled
      if (this.options.enableFallback) {
        this.enableStaticPreview();
      }
      
      return false;
    }
  }
  
  /**
   * Event handling
   */
  dispatchEvent(event: Event) {
    document.dispatchEvent(event);
  }
  
  addEventListener(event: string, callback: EventListenerOrEventListenerObject) {
    document.addEventListener(event, callback);
  }
  
  removeEventListener(event: string, callback: EventListenerOrEventListenerObject) {
    document.removeEventListener(event, callback);
  }
  
  /**
   * Retry initialization
   */
  async retryInitialization() {
    if (this.currentRetry >= this.options.maxRetries) {
      this.log('Maximum retry attempts reached', 'error');
      this.enableStaticPreview();
      return false;
    }
    
    this.currentRetry++;
    this.log(`Retry attempt ${this.currentRetry}/${this.options.maxRetries}...`);
    
    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
    
    // Try initialization again
    return this.initialize();
  }
  
  /**
   * Enable static preview as fallback
   */
  enableStaticPreview() {
    this.log('Enabling static preview fallback...', 'info');
    this.staticPreviewEnabled = true;
    this.dispatchEvent(new CustomEvent('static-preview-enabled'));
  }
  
  /**
   * Returns whether static preview is enabled
   */
  isStaticPreviewEnabled() {
    return this.staticPreviewEnabled;
  }
  
  /**
   * Load and set up files in the WebContainer
   */
  async setupFiles(files: Array<{path: string, content: string, type?: string}>) {
    this.files = files;
    
    if (!this.webcontainer || !this.isReady) {
      this.log('WebContainer not ready for file setup', 'warn');
      return false;
    }
    
    try {
      const fileSystem: any = {};
      
      // Process files into file system structure
      for (const file of files) {
        const { path, content } = file;
        fileSystem[path] = {
          file: {
            contents: content
          }
        };
      }
      
      // Add package.json if not provided
      if (!fileSystem['package.json']) {
        fileSystem['package.json'] = {
          file: {
            contents: JSON.stringify({
              name: 'webcontainer-project',
              version: '1.0.0',
              type: 'module',
              scripts: {
                dev: 'vite --port 3000 --host',
                build: 'vite build'
              },
              dependencies: {
                "react": "^18.2.0",
                "react-dom": "^18.2.0"
              },
              devDependencies: {
                "vite": "^4.3.9",
                "@vitejs/plugin-react": "^4.0.0"
              }
            }, null, 2)
          }
        };
      }
      
      // Add index.html if not provided
      if (!fileSystem['index.html']) {
        fileSystem['index.html'] = {
          file: {
            contents: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WebContainer Project</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>`
          }
        };
      }
      
      // Mount the file system
      await this.webcontainer.mount(fileSystem);
      this.log('File system mounted successfully');
      this.dispatchEvent(new CustomEvent('filesystem-mounted'));
      
      // Install dependencies
      this.log('Installing dependencies...');
      const installProcess = await this.webcontainer.spawn('npm', ['install']);
      const installExitCode = await installProcess.exit;
      
      if (installExitCode !== 0) {
        throw new Error(`Dependency installation failed with exit code ${installExitCode}`);
      }
      
      this.log('Dependencies installed successfully');
      
      // Start the server
      this.log('Starting development server...');
      await this.webcontainer.spawn('npm', ['run', 'dev']);
      
      return true;
    } catch (error: any) {
      this.log(`Error setting up files: ${error.message}`, 'error');
      return false;
    }
  }
  
  /**
   * Get the files for displaying in static preview
   */
  getFiles() {
    return this.files;
  }
  
  /**
   * Get the WebContainer instance
   */
  getWebContainer() {
    return this.webcontainer;
  }
  
  /**
   * Reset the WebContainer environment
   */
  async reset() {
    this.webcontainer = null;
    this.currentRetry = 0;
    this.staticPreviewEnabled = false;
    this.serverUrl = null;
    this.isReady = false;
    this.log('WebContainer environment reset');
    
    return await this.initialize();
  }
}

// Export singleton instance
export const webContainerFix = new WebContainerFix();
