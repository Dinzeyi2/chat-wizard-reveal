
import { WebContainer } from '@webcontainer/api';

// Main WebContainer class to manage the integration
class WebContainerManager {
  webcontainer: any | null;
  terminal: any | null;
  previewUrl: string | null;
  isBooting: boolean;
  isReady: boolean;
  packages: Map<string, string>;
  fileSystem: any;

  constructor() {
    this.webcontainer = null;
    this.terminal = null;
    this.previewUrl = null;
    this.isBooting = false;
    this.isReady = false;
    this.packages = new Map();
    this.fileSystem = {};
  }

  // Initialize the WebContainer
  async initialize() {
    try {
      if (this.isBooting) {
        console.log('WebContainer is already booting up...');
        return false;
      }

      this.isBooting = true;
      console.log('Initializing WebContainer...');
      
      // Boot the WebContainer
      this.webcontainer = await WebContainer.boot();
      
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
    } catch (error) {
      this.isBooting = false;
      console.error('Failed to initialize WebContainer:', error);
      this.dispatchEvent(new CustomEvent('webcontainer-error', { detail: { error } }));
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
      await this.initialize();
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
            main: 'index.js',
            scripts: {
              start: 'node index.js',
              dev: 'vite',
              build: 'vite build'
            },
            dependencies: {},
            devDependencies: {
              vite: '^4.3.9'
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
    <title>AI Generated App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`
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
    const devPackages = ['vite', '@vitejs/plugin-react', 'react', 'react-dom'];
    
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
      
      // Create the terminal for output
      this.terminal = await this.webcontainer.spawn('npm', ['install']);
      
      // Set up terminal output handlers
      const outputDiv = document.createElement('div');
      outputDiv.id = 'terminal-output';
      document.body.appendChild(outputDiv);
      
      this.terminal.output.pipeTo(
        new WritableStream({
          write: (data: string) => {
            console.log('Terminal output:', data);
            if (outputDiv) {
              outputDiv.innerHTML += `<div>${data}</div>`;
            }
          }
        })
      );
      
      // Wait for installation to complete
      const installExitCode = await this.terminal.exit;
      
      if (installExitCode !== 0) {
        throw new Error(`Installation failed with exit code ${installExitCode}`);
      }
      
      console.log('Dependencies installed successfully');
      this.dispatchEvent(new CustomEvent('installation-complete'));
      return true;
    } catch (error) {
      console.error('Failed to install dependencies:', error);
      this.dispatchEvent(new CustomEvent('installation-error', { detail: { error } }));
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
      
      // Start the development server
      const serverProcess = await this.webcontainer.spawn('npx', ['vite', '--port', '3000', '--host']);
      
      // Set up server output handlers
      const outputDiv = document.createElement('div');
      outputDiv.id = 'server-output';
      document.body.appendChild(outputDiv);
      
      serverProcess.output.pipeTo(
        new WritableStream({
          write: (data: string) => {
            console.log('Server output:', data);
            if (outputDiv) {
              outputDiv.innerHTML += `<div>${data}</div>`;
            }
          }
        })
      );
      
      // The 'server-ready' event will be triggered by WebContainer when the server is running
      return true;
    } catch (error) {
      console.error('Failed to start development server:', error);
      this.dispatchEvent(new CustomEvent('server-error', { detail: { error } }));
      return false;
    }
  }

  // Get the URL for the preview iframe
  getPreviewUrl() {
    return this.previewUrl;
  }

  // Update a file in the filesystem
  async updateFile(path: string, content: string) {
    if (!this.webcontainer || !this.isReady) {
      throw new Error('WebContainer is not initialized');
    }

    try {
      await this.webcontainer.fs.writeFile(path, content);
      console.log(`File ${path} updated successfully`);
      this.dispatchEvent(new CustomEvent('file-updated', { detail: { path } }));
      return true;
    } catch (error) {
      console.error(`Failed to update file ${path}:`, error);
      this.dispatchEvent(new CustomEvent('file-error', { detail: { path, error } }));
      return false;
    }
  }

  // Reset the WebContainer environment
  async reset() {
    if (this.webcontainer) {
      // No direct API to reset, so we're recreating everything
      this.webcontainer = null;
      this.terminal = null;
      this.previewUrl = null;
      this.isReady = false;
      this.isBooting = false;
      this.packages = new Map();
      this.fileSystem = {};
      
      // Re-initialize
      return await this.initialize();
    }
    return false;
  }
}

// Singleton instance
let instance: WebContainerManager | null = null;

export const getWebContainerManager = () => {
  if (!instance) {
    instance = new WebContainerManager();
  }
  return instance;
};
