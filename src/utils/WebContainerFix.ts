
// Extend the Window interface to include dynamically added properties
declare global {
  interface Window {
    Babel: any;
    React: any;
    ReactDOM: any;
    WebContainer: any;
    SignUp: any;
  }
}

import { WebContainer } from '@webcontainer/api';

/**
 * Enhanced WebContainer integration for React components with fallback rendering
 */
class ReactWebContainerIntegration {
  webcontainer: any;
  isInitialized: boolean;
  currentRetry: number;
  files: any[];
  components: Map<string, string>;
  dependencies: Map<string, string>;
  options: {
    targetElementId: string;
    previewElementId: string;
    enableFallback: boolean;
    maxRetries: number;
    retryDelay: number;
  };
  serverUrl: string | null;
  staticPreviewEnabled: boolean;

  constructor(options = {}) {
    this.options = {
      targetElementId: 'webcontainer-target',
      previewElementId: 'preview-container',
      enableFallback: true,
      maxRetries: 3,
      retryDelay: 1000,
      ...options
    };
    
    this.webcontainer = null;
    this.currentRetry = 0;
    this.isInitialized = false;
    this.files = [];
    this.components = new Map();
    this.staticPreviewEnabled = false;
    this.serverUrl = null;
    this.dependencies = new Map([
      ['react', '^18.2.0'],
      ['react-dom', '^18.2.0'],
      ['@vitejs/plugin-react', '^4.0.0'],
      ['vite', '^4.3.9']
    ]);
  }
  
  /**
   * Initialize WebContainer
   */
  async initialize() {
    console.log('Initializing React WebContainer integration...');
    
    try {
      // Check for secure context
      if (!window.isSecureContext) {
        throw new Error('WebContainer requires a secure context (HTTPS or localhost)');
      }
      
      // Try to initialize WebContainer
      console.log('Booting WebContainer...');
      try {
        this.webcontainer = await this.bootWebContainer();
        console.log('WebContainer initialized successfully!');
        this.isInitialized = true;
        
        // Process React components
        await this.setupReactEnvironment();
        
        return true;
      } catch (bootError) {
        console.error('Failed to boot WebContainer:', bootError);
        throw bootError;
      }
    } catch (error) {
      console.error('WebContainer initialization failed:', error.message);
      document.dispatchEvent(new CustomEvent('webcontainer-error', { 
        detail: { 
          error,
          isCrossOriginError: error.message.includes('cross-origin') || error.message.includes('isolation')
        } 
      }));
      
      // Fall back to static preview with React rendering
      console.log('Falling back to static preview with React rendering...');
      await this.setupReactRenderer();
      this.enableStaticPreview();
      
      return false;
    }
  }
  
  /**
   * Enable static preview mode
   */
  enableStaticPreview() {
    this.staticPreviewEnabled = true;
    document.dispatchEvent(new CustomEvent('static-preview-enabled'));
    this.renderStaticPreview();
  }
  
  /**
   * Try to boot WebContainer with various configurations
   */
  async bootWebContainer() {
    try {
      // First attempt with recommended settings
      return await Promise.race([
        WebContainer.boot({
          coep: 'credentialless',
          workdirName: 'webcontainer-workdir'
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('WebContainer boot timeout')), 10000))
      ]);
    } catch (error) {
      console.warn('First boot attempt failed:', error.message);
      
      // Wait a bit before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Second attempt with simpler configuration
      try {
        return await WebContainer.boot();
      } catch (fallbackError) {
        throw new Error(`WebContainer initialization failed: ${fallbackError.message}`);
      }
    }
  }
  
  /**
   * Set up React rendering environment for the static preview
   */
  async setupReactRenderer() {
    console.log('Setting up React renderer for static preview...');
    
    try {
      // Load React and ReactDOM from CDN if not already available
      if (!window.React) {
        await this.loadScript('https://unpkg.com/react@18/umd/react.development.js');
      }
      if (!window.ReactDOM) {
        await this.loadScript('https://unpkg.com/react-dom@18/umd/react-dom.development.js');
      }
      if (!window.Babel) {
        await this.loadScript('https://unpkg.com/@babel/standalone/babel.min.js');
      }
      
      // Add CSS for shadcn/ui components (simplified version)
      if (!document.getElementById('shadcn-static-styles')) {
        const style = document.createElement('style');
        style.id = 'shadcn-static-styles';
        style.textContent = `
          /* Base shadcn/ui styles */
          * {
            box-sizing: border-box;
          }
          
          .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 0.375rem;
            font-weight: 500;
            padding: 0.5rem 1rem;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.875rem;
            line-height: 1.25rem;
          }
          
          .btn-primary {
            background-color: #0284c7;
            color: white;
            border: none;
          }
          
          .btn-primary:hover {
            background-color: #0369a1;
          }
          
          .input {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid #d1d5db;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            line-height: 1.25rem;
          }
          
          .input:focus {
            outline: 2px solid #0284c7;
            outline-offset: 2px;
          }
          
          .label {
            display: block;
            font-size: 0.875rem;
            font-weight: 500;
            line-height: 1.25rem;
            margin-bottom: 0.5rem;
            color: #111827;
          }
          
          .form-group {
            margin-bottom: 1rem;
          }
          
          .card {
            background-color: white;
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
            padding: 1.5rem;
          }
          
          .card-header {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 1rem;
          }
          
          .container {
            max-width: 28rem;
            margin: 0 auto;
            padding: 1rem;
          }
        `;
        document.head.appendChild(style);
      }
      
      console.log('React renderer setup complete');
    } catch (error) {
      console.error('Failed to set up React renderer:', error);
    }
  }
  
  /**
   * Load a script asynchronously
   */
  loadScript(src: string) {
    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      
      script.onload = () => resolve();
      script.onerror = (e) => reject(new Error(`Failed to load script: ${src}`));
      
      document.head.appendChild(script);
    });
  }
  
  /**
   * Set up React environment in WebContainer
   */
  async setupReactEnvironment() {
    if (!this.webcontainer || !this.isInitialized) {
      throw new Error('WebContainer not initialized');
    }
    
    console.log('Setting up React environment in WebContainer...');
    
    // Create package.json
    const packageJson = {
      name: 'react-preview',
      private: true,
      version: '0.0.0',
      type: 'module',
      scripts: {
        dev: 'vite --port 3000 --host',
        build: 'vite build',
        preview: 'vite preview'
      },
      dependencies: {},
      devDependencies: {}
    };
    
    // Add dependencies
    for (const [pkg, version] of this.dependencies.entries()) {
      if (pkg.startsWith('@') || pkg.includes('plugin') || pkg === 'vite') {
        packageJson.devDependencies[pkg] = version;
      } else {
        packageJson.dependencies[pkg] = version;
      }
    }
    
    // Create vite.config.js
    const viteConfig = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true
  }
});
    `;
    
    // Create index.html
    const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React App Preview</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
    `;
    
    // Create main.jsx
    const mainJsx = `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
    `;
    
    // Create index.css
    const indexCss = `
:root {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  line-height: 1.5;
  font-weight: 400;
}

body {
  margin: 0;
  display: flex;
  min-width: 320px;
  min-height: 100vh;
  background-color: #f9fafb;
}

#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  width: 100%;
}
    `;
    
    // Create App.jsx that imports all components
    let appJsx = `
import React from 'react';
import SignUp from './SignUp';

const App = () => {
  return (
    <div className="app">
      <h1>React Components Preview</h1>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <SignUp />
      </div>
    </div>
  );
};

export default App;
    `;
    
    // Prepare files for mounting
    const files: Record<string, any> = {
      'package.json': {
        file: {
          contents: JSON.stringify(packageJson, null, 2)
        }
      },
      'vite.config.js': {
        file: {
          contents: viteConfig
        }
      },
      'index.html': {
        file: {
          contents: indexHtml
        }
      },
      'src': {
        directory: {
          'main.jsx': {
            file: {
              contents: mainJsx
            }
          },
          'index.css': {
            file: {
              contents: indexCss
            }
          },
          'App.jsx': {
            file: {
              contents: appJsx
            }
          }
        }
      }
    };
    
    // Add the collected components to the file system
    for (const [name, content] of this.components.entries()) {
      files.src.directory[`${name}.jsx`] = {
        file: {
          contents: content
        }
      };
    }
    
    // Add utils directory for any imported utilities
    files.src.directory['utils'] = {
      directory: {
        'cn.js': {
          file: {
            contents: `
// Simple utility function for conditional class names
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
            `
          }
        }
      }
    };
    
    // Mount the file system
    await this.webcontainer.mount(files);
    console.log('File system mounted');
    
    // Install dependencies
    console.log('Installing dependencies...');
    const installProcess = await this.webcontainer.spawn('npm', ['install']);
    installProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          console.log(data);
        }
      })
    );
    
    const installExitCode = await installProcess.exit;
    
    if (installExitCode !== 0) {
      throw new Error(`Installation failed with exit code ${installExitCode}`);
    }
    
    console.log('Dependencies installed successfully');
    
    // Start the development server
    console.log('Starting development server...');
    const startProcess = await this.webcontainer.spawn('npm', ['run', 'dev']);
    
    startProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          console.log(data);
        }
      })
    );
    
    // Wait for server-ready event
    this.webcontainer.on('server-ready', (port: number, url: string) => {
      console.log(`Server ready at ${url}`);
      this.serverUrl = url;
      document.dispatchEvent(new CustomEvent('preview-ready', { detail: { url } }));
    });
  }
  
  /**
   * Add a React component to the collection
   */
  addComponent(name: string, content: string) {
    this.components.set(name, content);
    console.log(`Added React component: ${name}`);
  }
  
  /**
   * Process a file and extract component information
   */
  processFile(file: any) {
    const { path, content } = file;
    
    // Skip non-JavaScript files
    if (!path.endsWith('.js') && !path.endsWith('.jsx') && !path.endsWith('.tsx')) {
      return;
    }
    
    // Extract component name from file path
    const fileName = path.split('/').pop();
    if (!fileName) return;
    
    const componentName = fileName.replace(/\.(js|jsx|tsx)$/, '');
    
    // Add to components collection
    this.addComponent(componentName, content);
    
    // Add to files collection for display
    this.files.push(file);
  }
  
  /**
   * Render the React components in static preview mode
   */
  renderStaticPreview() {
    console.log('Rendering static preview with React components...');
    
    // Create a container for the static preview
    const staticContainer = document.createElement('div');
    staticContainer.className = 'static-preview-container';
    
    // Create a header
    const header = document.createElement('div');
    header.innerHTML = `
      <h2 style="text-align: center; margin-bottom: 24px;">Static Preview</h2>
      <p style="text-align: center; margin-bottom: 32px;">
        This is a rendered preview of your React components in static mode.
      </p>
    `;
    staticContainer.appendChild(header);
    
    // Create a mount point for React
    const reactRoot = document.createElement('div');
    reactRoot.id = 'react-preview-root';
    staticContainer.appendChild(reactRoot);
    
    // Add to document to prepare for rendering
    const targetElement = document.createElement('div');
    targetElement.style.display = 'none';
    targetElement.appendChild(staticContainer);
    document.body.appendChild(targetElement);
    
    // Get all component files to render
    for (const file of this.files) {
      const fileName = file.path.split('/').pop();
      if (!fileName) continue;
      
      // Only process React component files
      if (fileName.match(/\.(jsx|tsx)$/)) {
        this.createReactPreview(file.content, reactRoot.id);
      }
    }
    
    // Generate static HTML
    const staticHtml = staticContainer.innerHTML;
    document.body.removeChild(targetElement);
    
    // Dispatch event with the static HTML
    document.dispatchEvent(new CustomEvent('static-preview-content', { 
      detail: { content: staticHtml }
    }));
    
    return staticHtml;
  }
  
  /**
   * Create a React preview from component code
   */
  createReactPreview(componentCode: string, targetId: string) {
    // Create a script element for Babel transformation
    const script = document.createElement('script');
    script.type = 'text/babel';
    script.dataset.type = 'module';
    script.dataset.presets = 'react';
    
    // Process the component code to make it work in standalone mode
    const processedCode = this.processComponentCodeForStandalone(componentCode);
    
    // Create the script content that will render our component
    script.textContent = `
      ${processedCode}
      
      // Mock any missing imports
      const mockImports = {
        Button: (props) => React.createElement('button', { 
          ...props, 
          className: 'btn btn-primary',
          onClick: (e) => {
            e.preventDefault();
            if (props.onClick) props.onClick(e);
            console.log('Button clicked:', props);
          }
        }, props.children),
        
        Input: (props) => React.createElement('input', { 
          ...props, 
          className: 'input',
          onChange: (e) => {
            if (props.onChange) props.onChange(e);
          }
        }),
        
        Label: (props) => React.createElement('label', { 
          ...props, 
          className: 'label'
        }, props.children),
        
        cn: (...args) => args.filter(Boolean).join(' ')
      };
      
      // Apply mock imports to global scope
      Object.assign(window, mockImports);
      
      // Render the component
      const domContainer = document.getElementById('${targetId}');
      const root = ReactDOM.createRoot(domContainer);
      
      try {
        // Try to render the component (assumes SignUp is the component name)
        root.render(React.createElement(SignUp));
        console.log('Successfully rendered React component');
      } catch (error) {
        console.error('Failed to render React component:', error);
        domContainer.innerHTML = \`
          <div style="padding: 16px; border: 1px solid #f56565; border-radius: 8px; background-color: #fff5f5; color: #c53030;">
            <h3>Rendering Error</h3>
            <p>\${error.message}</p>
            <pre style="overflow: auto; background: #f8f8f8; padding: 8px; border-radius: 4px;">\${error.stack}</pre>
          </div>
        \`;
      }
    `;
    
    document.body.appendChild(script);
  }
  
  /**
   * Process component code to work in standalone mode
   */
  processComponentCodeForStandalone(code: string) {
    // Replace import statements with global variables
    const processedCode = code
      .replace(/import React,\s*{([^}]+)}\s*from\s*['"]react['"];?/g, '// React imported from global scope')
      .replace(/import\s*{([^}]+)}\s*from\s*['"]react['"];?/g, '// React imported from global scope')
      .replace(/import\s*{([^}]+)}\s*from\s*['"]@shadcn\/ui['"];?/g, '// UI components imported from global scope')
      .replace(/import\s*{([^}]+)}\s*from\s*['"]\.\/(utils\/)?cn['"];?/g, '// cn utility imported from global scope')
      .replace(/export default/g, 'window.SignUp =');
    
    return processedCode;
  }
  
  /**
   * Reset WebContainer and try again
   */
  async reset() {
    this.webcontainer = null;
    this.isInitialized = false;
    this.currentRetry = 0;
    this.staticPreviewEnabled = false;
    
    return this.initialize();
  }
  
  /**
   * Setup files for preview
   */
  async setupFiles(files: Array<{path: string, content: string, type: string}>) {
    console.log(`Setting up ${files.length} files for preview`);
    
    // Process each file
    this.files = files;
    for (const file of files) {
      this.processFile(file);
    }
    
    // If WebContainer is already initialized, update the environment
    if (this.isInitialized && this.webcontainer) {
      await this.setupReactEnvironment();
    } else {
      // Otherwise initialize WebContainer
      await this.initialize();
    }
  }
  
  /**
   * Get the WebContainer instance
   */
  getWebContainer() {
    return this.webcontainer;
  }
}

// Create a singleton instance
const webContainerFix = new ReactWebContainerIntegration();

export { webContainerFix };
