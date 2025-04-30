import { WebContainer, auth } from '@webcontainer/api';
import { toast } from '@/hooks/use-toast';

// Main WebContainer class to manage the integration
export class WebContainerManager {
  private webcontainer: any = null;
  private terminal: any = null;
  private previewUrl: string | null = null;
  private isBooting: boolean = false;
  private isReady: boolean = false;
  private packages: Map<string, string> = new Map();
  private fileSystem: any = {};
  private initializationAttempts: number = 0;
  private readonly MAX_INITIALIZATION_ATTEMPTS = 3;
  private crossOriginIsolationDetected: boolean = false;
  private instanceLimitReached: boolean = false;
  private bootTimeoutMs: number = 15000; // 15 seconds timeout
  private isAuthenticated: boolean = false;

  // Initialize the WebContainer
  async initialize() {
    try {
      if (this.isBooting) {
        console.log('WebContainer is already booting up...');
        return false;
      }

      // If we already have a webcontainer instance, use it
      if (this.webcontainer && this.isReady) {
        console.log('WebContainer is already initialized, reusing existing instance');
        return true;
      }

      // If we've exceeded the maximum number of attempts, don't try again
      if (this.initializationAttempts >= this.MAX_INITIALIZATION_ATTEMPTS) {
        throw new Error('Max initialization attempts exceeded. Please refresh the page and try again.');
      }

      // Check if we've already detected instance limit issues
      if (this.instanceLimitReached) {
        throw new Error('WebContainer instance limit reached. Please close other tabs or refresh the page.');
      }

      // Check if we've already detected cross-origin isolation issues
      if (this.crossOriginIsolationDetected) {
        throw new Error('Cross-origin isolation required but not available in this environment.');
      }

      this.initializationAttempts++;
      this.isBooting = true;
      console.log('Initializing WebContainer... (Attempt ' + this.initializationAttempts + ')');
      
      // Check if we're in a secure context (HTTPS or localhost)
      if (!window.isSecureContext) {
        this.isBooting = false;
        throw new Error('WebContainer requires a secure context (HTTPS or localhost)');
      }
      
      // Initialize WebContainer authentication with client ID
      try {
        console.log('Initializing WebContainer authentication...');
        await auth.init({
          clientId: 'wc_api_dinzeyi2_0c4093800eedf65f7f692a274b7fcfb0',
          scope: '',
        });
        console.log('WebContainer authentication initialized successfully');
        this.isAuthenticated = true;
      } catch (authError: any) {
        console.warn('Failed to initialize WebContainer authentication:', authError);
        // Continue without authentication as fallback
        this.isAuthenticated = false;
      }
      
      // Boot the WebContainer with timeout and different strategies
      try {
        // First try with default configuration
        console.log('Attempting to boot WebContainer with authentication...');
        this.webcontainer = await Promise.race([
          WebContainer.boot(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('WebContainer boot timeout after ' + this.bootTimeoutMs + 'ms')), 
            this.bootTimeoutMs)
          )
        ]);
      } catch (bootError: any) {
        console.log('First boot attempt failed:', bootError.message);
        
        // Check for common errors
        if (bootError.message && (
            bootError.message.includes('SharedArrayBuffer') || 
            bootError.message.includes('crossOriginIsolated')
        )) {
          this.crossOriginIsolationDetected = true;
          throw new Error('WebContainer requires cross-origin isolation which is not enabled in this environment.');
        }
        
        if (bootError.message && bootError.message.includes('Unable to create more instances')) {
          this.instanceLimitReached = true;
          throw new Error('WebContainer instance limit reached. Please close other tabs or refresh the page.');
        }
        
        // Try an alternative configuration as a last resort
        try {
          console.log('Trying alternative WebContainer configuration...');
          this.webcontainer = await Promise.race([
            WebContainer.boot({
              coep: 'credentialless',
              workdirName: 'webcontainer-workdir'
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Alternative boot timeout')), 10000)
            )
          ]);
        } catch (altError: any) {
          // Final failure, give up
          throw altError;
        }
      }
      
      // Set up communication channel for terminal output
      this.webcontainer.on('server-ready', (port: number, url: string) => {
        this.previewUrl = url;
        this.dispatchEvent(new CustomEvent('preview-ready', { detail: { url } }));
        console.log(`Server started at ${url}`);
      });

      this.isReady = true;
      this.isBooting = false;
      this.dispatchEvent(new CustomEvent('webcontainer-ready'));
      console.log('WebContainer initialized successfully!');
      return true;
    } catch (error: any) {
      this.isBooting = false;
      console.error('Failed to initialize WebContainer:', error);
      
      // Handle specific error cases
      if (error.message && error.message.includes('Unable to create more instances')) {
        this.instanceLimitReached = true;
        console.log('WebContainer instance limit reached. Please close other tabs or refresh the page.');
        
        toast({
          title: "WebContainer Error",
          description: "Unable to create more WebContainer instances. Please refresh the page or close other tabs.",
          variant: "destructive"
        });
      } 
      // Check for cross-origin isolation errors
      else if (error.message && (
        error.message.includes('SharedArrayBuffer') || 
        error.message.includes('crossOriginIsolated')
      )) {
        this.crossOriginIsolationDetected = true;
        console.log('WebContainer requires cross-origin isolation which is not available.');
        
        toast({
          title: "WebContainer Error",
          description: "WebContainer requires cross-origin isolation which is not available in this environment.",
          variant: "destructive"
        });
      } 
      else {
        toast({
          title: "WebContainer Error",
          description: `Failed to initialize: ${error.message || 'Unknown error'}`,
          variant: "destructive"
        });
      }
      
      this.dispatchEvent(new CustomEvent('webcontainer-error', { 
        detail: { 
          error, 
          recoverable: this.initializationAttempts < this.MAX_INITIALIZATION_ATTEMPTS,
          isCrossOriginError: this.crossOriginIsolationDetected,
          isInstanceLimitError: this.instanceLimitReached
        } 
      }));
      
      return false;
    }
  }

  // Event handling
  addEventListener(event: string, callback: EventListenerOrEventListenerObject) {
    document.addEventListener(event, callback);
  }

  dispatchEvent(event: Event) {
    document.dispatchEvent(event);
  }

  removeEventListener(event: string, callback: EventListenerOrEventListenerObject) {
    document.removeEventListener(event, callback);
  }

  // Create a file system structure from code artifacts
  async setupFileSystem(artifacts: Array<{path: string, content: string, type?: string}>) {
    if (!this.isReady) {
      const success = await this.initialize();
      if (!success) {
        throw new Error('Failed to initialize WebContainer');
      }
    }

    const fileSystem: any = {};

    // Process artifacts into file system structure
    for (const artifact of artifacts) {
      const { path, content } = artifact;
      
      // Handle directory structure
      const pathParts = path.split('/');
      let currentLevel = fileSystem;
      
      // Create nested directories
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!currentLevel[part]) {
          currentLevel[part] = { directory: {} };
        }
        currentLevel = currentLevel[part].directory;
      }
      
      // Add file with content
      const fileName = pathParts[pathParts.length - 1];
      currentLevel[fileName] = {
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
            name: 'generated-project',
            version: '1.0.0',
            description: 'Generated project by AI',
            type: "module",
            scripts: {
              dev: 'vite --port 3000 --host',
              build: 'vite build'
            },
            dependencies: {},
            devDependencies: {
              vite: '^4.3.9',
              "react": "^18.2.0",
              "react-dom": "^18.2.0",
              "@vitejs/plugin-react": "^4.0.0"
            }
          }, null, 2)
        }
      };
    } else {
      // Parse existing package.json to extract dependencies
      const packageJson = JSON.parse(fileSystem['package.json'].file.contents);
      if (packageJson.dependencies) {
        for (const [pkg, version] of Object.entries(packageJson.dependencies)) {
          this.packages.set(pkg, version as string);
        }
      }
      if (packageJson.devDependencies) {
        for (const [pkg, version] of Object.entries(packageJson.devDependencies)) {
          this.packages.set(pkg, version as string);
        }
      }
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
  <title>Generated App</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
`
        }
      };
    }

    // Add vite.config.js if not provided
    if (!fileSystem['vite.config.js']) {
      fileSystem['vite.config.js'] = {
        file: {
          contents: `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true
  }
});
`
        }
      };
    }

    // Ensure src directory and main.jsx exist
    if (!fileSystem['src']) {
      fileSystem['src'] = { directory: {} };
    }

    if (!fileSystem['src'].directory['main.jsx']) {
      fileSystem['src'].directory['main.jsx'] = {
        file: {
          contents: `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`
        }
      };
    }

    // Ensure App.jsx exists
    if (!fileSystem['src'].directory['App.jsx']) {
      fileSystem['src'].directory['App.jsx'] = {
        file: {
          contents: `
import React from 'react';

function App() {
  return (
    <div className="App">
      <header>
        <h1>Generated App</h1>
      </header>
      <main>
        <p>This is a generated React app.</p>
      </main>
    </div>
  );
}

export default App;
`
        }
      };
    }

    // Ensure index.css exists
    if (!fileSystem['src'].directory['index.css']) {
      fileSystem['src'].directory['index.css'] = {
        file: {
          contents: `
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  margin: 0;
  padding: 20px;
  background-color: #f5f5f5;
}

.App {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

h1 {
  color: #333;
}
`
        }
      };
    }

    this.fileSystem = fileSystem;
    return fileSystem;
  }

  // Mount the file system in the WebContainer
  async mountFileSystem() {
    if (!this.webcontainer || !this.isReady) {
      throw new Error('WebContainer is not initialized');
    }

    try {
      await this.webcontainer.mount(this.fileSystem);
      console.log('File system mounted successfully');
      this.dispatchEvent(new CustomEvent('filesystem-mounted'));
      return true;
    } catch (error) {
      console.error('Failed to mount file system:', error);
      this.dispatchEvent(new CustomEvent('filesystem-error', { detail: { error } }));
      return false;
    }
  }

  // Add dependencies from detected imports in code
  async detectAndAddDependencies(code: string) {
    // Simple regex pattern to detect import statements
    const importRegex = /import\s+?(?:(?:(?:[\w*\s{},]*)\s+from\s+?)|)(?:(?:"(.*?)")|(?:'(.*?)'))[\s]*?(?:;|$)/g;
    const requireRegex = /(?:const|let|var)\s+[\w\s{},]*\s*=\s*require\s*\(\s*(?:"|')([@\w\-\/\.]+)(?:"|')\s*\)/g;
    
    let match;
    const imports = new Set<string>();
    
    // Find all imports
    while ((match = importRegex.exec(code)) !== null) {
      const importPath = match[1] || match[2];
      // Only add package imports (not relative imports)
      if (importPath && !importPath.startsWith('./') && !importPath.startsWith('../') && !importPath.startsWith('/')) {
        // Extract the package name (before any slash)
        const packageName = importPath.split('/')[0];
        imports.add(packageName);
      }
    }
    
    // Find all requires
    while ((match = requireRegex.exec(code)) !== null) {
      const requirePath = match[1];
      if (requirePath && !requirePath.startsWith('./') && !requirePath.startsWith('../') && !requirePath.startsWith('/')) {
        const packageName = requirePath.split('/')[0];
        imports.add(packageName);
      }
    }
    
    // Add common development packages
    const devPackages = ['vite', '@vitejs/plugin-react', 'typescript'];
    
    // Add found packages to the dependencies list
    for (const pkg of imports) {
      if (!this.packages.has(pkg)) {
        this.packages.set(pkg, 'latest');
      }
    }
    
    // Add dev packages if needed
    for (const pkg of devPackages) {
      if (!this.packages.has(pkg)) {
        this.packages.set(pkg, 'latest');
      }
    }
    
    // Always add React and ReactDOM
    if (!this.packages.has('react')) {
      this.packages.set('react', '^18.2.0');
    }
    
    if (!this.packages.has('react-dom')) {
      this.packages.set('react-dom', '^18.2.0');
    }
    
    return Array.from(imports);
  }

  // Install dependencies
  async installDependencies() {
    if (!this.webcontainer || !this.isReady) {
      throw new Error('WebContainer is not initialized');
    }

    if (this.packages.size === 0) {
      console.log('No packages to install');
      return true;
    }

    try {
      this.dispatchEvent(new CustomEvent('installation-started'));
      toast({
        title: "Installing dependencies",
        description: "This may take a few moments...",
      });
      
      // Create the terminal for output
      this.terminal = await this.webcontainer.spawn('npm', ['install']);
      
      // Set up terminal output handlers
      const outputElement = document.getElementById('terminal-output') || document.createElement('div');
      
      try {
        this.terminal.output.pipeTo(
          new WritableStream({
            write: (data: string) => {
              outputElement.innerHTML += `<div>${data}</div>`;
              console.log('Terminal output:', data);
            }
          })
        );
      } catch (pipeError) {
        console.error('Failed to pipe terminal output:', pipeError);
        // Just log the error but continue - this isn't critical
      }
      
      // Wait for installation to complete
      const installExitCode = await this.terminal.exit;
      
      if (installExitCode !== 0) {
        throw new Error(`Installation failed with exit code ${installExitCode}`);
      }
      
      console.log('Dependencies installed successfully');
      this.dispatchEvent(new CustomEvent('installation-complete'));
      toast({
        title: "Dependencies installed",
        description: "All packages were installed successfully",
      });
      return true;
    } catch (error: any) {
      console.error('Failed to install dependencies:', error);
      this.dispatchEvent(new CustomEvent('installation-error', { detail: { error } }));
      toast({
        title: "Installation failed",
        description: error.message || "Failed to install dependencies",
        variant: "destructive"
      });
      return false;
    }
  }

  // Run a development server
  async startDevServer() {
    if (!this.webcontainer || !this.isReady) {
      throw new Error('WebContainer is not initialized');
    }

    try {
      this.dispatchEvent(new CustomEvent('server-starting'));
      toast({
        title: "Starting development server",
        description: "Please wait...",
      });
      
      // Start the development server
      const serverProcess = await this.webcontainer.spawn('npm', ['run', 'dev']);
      
      // Set up server output handlers
      const outputElement = document.getElementById('server-output') || document.createElement('div');
      
      try {
        serverProcess.output.pipeTo(
          new WritableStream({
            write: (data: string) => {
              outputElement.innerHTML += `<div>${data}</div>`;
              console.log('Server output:', data);
            }
          })
        );
      } catch (pipeError) {
        console.error('Failed to pipe server output:', pipeError);
        // Just log the error but continue - this isn't critical
      }
      
      // The 'server-ready' event will be triggered by WebContainer when the server is running
      return true;
    } catch (error: any) {
      console.error('Failed to start development server:', error);
      this.dispatchEvent(new CustomEvent('server-error', { detail: { error } }));
      toast({
        title: "Server error",
        description: error.message || "Failed to start development server",
        variant: "destructive"
      });
      return false;
    }
  }

  // Get the URL for the preview iframe
  getPreviewUrl() {
    return this.previewUrl;
  }

  // Reset the WebContainer environment
  async reset() {
    // Reset counters and state
    this.initializationAttempts = 0;
    this.isReady = false;
    this.isBooting = false;
    this.packages = new Map();
    this.fileSystem = {};
    this.previewUrl = null;
    
    // Reset error detection flags on reset to allow trying again
    this.crossOriginIsolationDetected = false;
    this.instanceLimitReached = false;
    
    try {
      // Try to terminate the existing instance if possible
      if (this.webcontainer) {
        // No direct API to reset, so we're recreating everything
        this.webcontainer = null;
        this.terminal = null;
      }
      
      // Re-initialize
      return await this.initialize();
    } catch (error) {
      console.error('Failed to reset WebContainer:', error);
      return false;
    }
  }
}

// Main integration with the artifact system
export class ArtifactWebContainerIntegration {
  containerManager: WebContainerManager;
  artifactsToProcess: Array<{path: string, content: string, type?: string}> = [];
  isProcessing: boolean = false;
  previewElement: HTMLIFrameElement | null = null;
  
  constructor() {
    this.containerManager = new WebContainerManager();
    this.setupEventListeners();
  }

  // Set up event listeners
  setupEventListeners() {
    this.containerManager.addEventListener('webcontainer-ready', () => {
      console.log('WebContainer is ready');
    });

    this.containerManager.addEventListener('preview-ready', ((event: CustomEvent) => {
      this.updatePreview(event.detail.url);
    }) as EventListener);

    this.containerManager.addEventListener('installation-started', () => {
      console.log('Installation started');
    });

    this.containerManager.addEventListener('installation-complete', () => {
      console.log('Installation complete');
    });

    this.containerManager.addEventListener('server-starting', () => {
      console.log('Server starting');
    });
  }

  // Update the preview iframe
  updatePreview(url: string) {
    if (this.previewElement) {
      this.previewElement.src = url;
    }
    
    toast({
      title: "Preview ready",
      description: "Your application preview is now available",
    });
  }

  // Process artifact files
  async processArtifactFiles(files: any[]) {
    try {
      const artifacts = files.map(file => ({
        path: this.getProperFilePath(file),
        content: file.content,
        type: this.getFileType(file.path)
      }));
  
      // Set up file system with artifacts
      await this.containerManager.setupFileSystem(artifacts);
      
      // Detect dependencies from all code artifacts
      for (const artifact of artifacts) {
        if (this.isCodeFile(artifact.path)) {
          await this.containerManager.detectAndAddDependencies(artifact.content);
        }
      }
      
      // Mount the file system
      await this.containerManager.mountFileSystem();
      
      // Install dependencies
      await this.containerManager.installDependencies();
      
      // Start development server
      await this.containerManager.startDevServer();
    } catch (error) {
      console.error("Error processing artifact files:", error);
      this.containerManager.dispatchEvent(new CustomEvent('webcontainer-error', { 
        detail: { error, msg: "Failed to process artifact files" } 
      }));
      throw error; // Re-throw to be caught by ArtifactPreview
    }
  }

  private getProperFilePath(file: any): string {
    let path = file.path;
    
    // If the path doesn't include src/ folder, add it for proper organization
    if (!path.startsWith('src/') && !path.includes('/') && this.isSourceFile(path)) {
      path = `src/${path}`;
    }
    
    return path;
  }

  private isSourceFile(path: string): boolean {
    const ext = path.split('.').pop()?.toLowerCase();
    return ['js', 'jsx', 'ts', 'tsx', 'css', 'scss', 'md'].includes(ext || '');
  }

  private getFileType(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    switch(ext) {
      case 'js': return 'javascript';
      case 'jsx': return 'react';
      case 'ts': return 'typescript';
      case 'tsx': return 'typescript-react';
      case 'css': return 'css';
      case 'html': return 'html';
      default: return 'text';
    }
  }

  private isCodeFile(path: string): boolean {
    return path.endsWith('.js') || path.endsWith('.jsx') || 
           path.endsWith('.ts') || path.endsWith('.tsx');
  }

  // Initialize the WebContainer when the application loads
  async init() {
    try {
      await this.containerManager.initialize();
      console.log('WebContainer integration initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize WebContainer integration:', error);
      return false;
    }
  }

  // Set the preview iframe element
  setPreviewElement(element: HTMLIFrameElement) {
    this.previewElement = element;
  }
}

// Create and export a singleton instance
export const webContainerIntegration = new ArtifactWebContainerIntegration();
