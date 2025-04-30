
/**
 * Sandpack Manager for creating and managing React code previews
 * Replaces the previous WebContainer implementation with CodeSandbox Sandpack
 */

import { SandpackFiles } from "@codesandbox/sandpack-react";
import { toast } from "@/hooks/use-toast";

export interface SandpackFile {
  path: string;
  content: string;
  type?: string;
}

// Main class to manage Sandpack integration
export class SandpackManager {
  private files: SandpackFile[] = [];
  private customSetup: Record<string, any> = {};

  constructor() {
    // Initialize with default setup
    this.customSetup = {
      dependencies: {
        "react": "^18.2.0",
        "react-dom": "^18.2.0"
      },
      devDependencies: {
        "@vitejs/plugin-react": "^4.0.0",
        "vite": "^4.3.9"
      }
    };
  }

  // Process files for Sandpack format
  processFiles(files: SandpackFile[]): SandpackFiles {
    const sandpackFiles: SandpackFiles = {};
    
    // Create required configuration files if they don't exist
    if (!files.some(file => file.path === 'package.json')) {
      sandpackFiles['/package.json'] = {
        code: JSON.stringify({
          name: "generated-project",
          version: "1.0.0",
          description: "Generated project by AI",
          type: "module",
          scripts: {
            dev: "vite --port 3000 --host",
            build: "vite build"
          },
          dependencies: this.customSetup.dependencies,
          devDependencies: this.customSetup.devDependencies
        }, null, 2),
        hidden: true
      };
    }

    if (!files.some(file => file.path === 'vite.config.js')) {
      sandpackFiles['/vite.config.js'] = {
        code: `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true
  }
});`,
        hidden: true
      };
    }

    if (!files.some(file => file.path === 'index.html')) {
      sandpackFiles['/index.html'] = {
        code: `
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
</html>`,
        hidden: true
      };
    }

    // Make sure we have a main.jsx file
    if (!files.some(file => file.path === 'src/main.jsx')) {
      sandpackFiles['/src/main.jsx'] = {
        code: `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
      };
    }

    // Make sure we have an App.jsx file
    if (!files.some(file => file.path === 'src/App.jsx')) {
      sandpackFiles['/src/App.jsx'] = {
        code: `
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

export default App;`
      };
    }

    // Make sure we have an index.css file
    if (!files.some(file => file.path === 'src/index.css')) {
      sandpackFiles['/src/index.css'] = {
        code: `
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
}`
      };
    }

    // Process all the user files
    for (const file of files) {
      // Normalize the path to include leading slash
      const normalizedPath = file.path.startsWith('/') ? file.path : `/${file.path}`;
      
      sandpackFiles[normalizedPath] = {
        code: file.content,
        // Only show source files in the editor
        hidden: normalizedPath.includes('node_modules') || 
                normalizedPath.endsWith('package.json') || 
                normalizedPath.endsWith('vite.config.js')
      };
    }

    // Debug log for what files we're sending to Sandpack
    console.log(`Processed ${Object.keys(sandpackFiles).length} files for Sandpack`);
    
    return sandpackFiles;
  }

  // Add dependencies from the file content
  detectDependencies(files: SandpackFile[]): Record<string, string> {
    const dependencies: Record<string, string> = {
      ...this.customSetup.dependencies
    };
    
    // Simple regex to find import statements
    const importRegex = /import\s+?(?:(?:(?:[\w*\s{},]*)\s+from\s+?)|)(?:(?:"(.*?)")|(?:'(.*?)'))[\s]*?(?:;|$)/g;
    
    for (const file of files) {
      // Skip non-JS/TS files
      if (!file.path.match(/\.(js|jsx|ts|tsx)$/)) continue;
      
      let match;
      while ((match = importRegex.exec(file.content)) !== null) {
        const importPath = match[1] || match[2];
        // Only consider package imports (not relative ones)
        if (importPath && !importPath.startsWith('./') && !importPath.startsWith('../') && !importPath.startsWith('/')) {
          // Get package name (before any path)
          const packageName = importPath.split('/')[0];
          if (!dependencies[packageName]) {
            dependencies[packageName] = "latest";
          }
        }
      }
    }
    
    return dependencies;
  }

  // Generate a static HTML preview for cases where Sandpack can't run
  generateStaticPreview(files: SandpackFile[]): string {
    const htmlFile = files.find(f => f.path.endsWith('.html'));
    const cssFiles = files.filter(f => f.path.endsWith('.css'));
    
    // Prepare HTML content with file previews
    const staticContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Static Code Preview</title>
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              margin: 0; 
              padding: 0;
              background-color: #f8f9fa;
              color: #333;
            }
            .preview-container { 
              max-width: 100%; 
              margin: 0 auto; 
              padding: 20px;
            }
            .static-header {
              font-size: 24px;
              text-align: center;
              margin-bottom: 16px;
              color: #333;
            }
            .static-message {
              font-size: 16px;
              text-align: center;
              margin-bottom: 32px;
              color: #666;
            }
            details {
              margin-bottom: 16px;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              overflow: hidden;
            }
            summary {
              padding: 12px 16px;
              background-color: #f8fafc;
              cursor: pointer;
              font-weight: 600;
            }
            details pre {
              margin: 0;
              padding: 16px;
              background-color: #ffffff;
              overflow-x: auto;
              font-family: monospace;
              font-size: 14px;
              line-height: 1.5;
            }
            ${cssFiles.map(f => f.content).join('\n')}
          </style>
        </head>
        <body>
          <div class="preview-container">
            <h2 class="static-header">Static Preview</h2>
            <p class="static-message">This is a static preview of your code.</p>
            
            <div id="file-list">
              ${files.map(file => `
                <details>
                  <summary>${file.path}</summary>
                  <pre><code>${file.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
                </details>
              `).join('')}
            </div>
          </div>
        </body>
      </html>
    `;
    
    return staticContent;
  }
}

// Create and export a singleton instance
export const sandpackManager = new SandpackManager();
