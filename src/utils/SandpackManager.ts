
/**
 * SandpackManager - A utility for managing Sandpack integrations
 * 
 * This replaces the WebContainerManager with a more lightweight approach
 * using CodeSandbox's Sandpack
 */

import { SandpackFiles } from '@codesandbox/sandpack-react';
import { toast } from '@/hooks/use-toast';

export interface ArtifactFile {
  id: string;
  name: string;
  path: string;
  language: string;
  content: string;
}

export class SandpackManager {
  // Convert artifact files to Sandpack format
  static convertToSandpackFiles(files: ArtifactFile[]): SandpackFiles {
    if (!files || files.length === 0) {
      return {};
    }
    
    const sandpackFiles: SandpackFiles = {};
    
    files.forEach(file => {
      sandpackFiles[file.path] = {
        code: file.content
      };
    });
    
    return sandpackFiles;
  }
  
  // Add additional necessary files if they don't exist
  static addRequiredFiles(files: SandpackFiles): SandpackFiles {
    const updatedFiles = { ...files };
    
    // Add index.html if missing
    if (!updatedFiles['index.html']) {
      updatedFiles['index.html'] = {
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
</body>
</html>
        `
      };
    }
    
    // Add package.json if missing
    if (!updatedFiles['package.json']) {
      updatedFiles['package.json'] = {
        code: JSON.stringify({
          name: "generated-project",
          version: "1.0.0",
          description: "Generated project by AI",
          type: "module",
          scripts: {
            dev: "vite --port 3000",
            build: "vite build"
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
      };
    }
    
    // Add main entry point if missing
    if (!updatedFiles['src/main.jsx'] && !updatedFiles['src/index.jsx']) {
      updatedFiles['src/main.jsx'] = {
        code: `
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
      };
    }
    
    // Add App component if missing
    if (!updatedFiles['src/App.jsx']) {
      updatedFiles['src/App.jsx'] = {
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

export default App;
        `
      };
    }
    
    // Add CSS if missing
    if (!updatedFiles['src/index.css']) {
      updatedFiles['src/index.css'] = {
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
}
        `
      };
    }
    
    return updatedFiles;
  }
  
  // Auto-detect and add dependencies based on code analysis
  static detectDependencies(files: SandpackFiles): Record<string, string> {
    const detectedDependencies: Record<string, string> = {
      "react": "^18.2.0",
      "react-dom": "^18.2.0"
    };
    
    // Simple regex patterns to detect imports
    const importRegex = /import\s+?(?:(?:(?:[\w*\s{},]*)\s+from\s+?)|)(?:(?:"(.*?)")|(?:'(.*?)'))[\s]*?(?:;|$)/g;
    
    // Analyze each file for imports
    Object.values(files).forEach(file => {
      if (!file.code) return;
      
      let match;
      while ((match = importRegex.exec(file.code)) !== null) {
        const importPath = match[1] || match[2];
        // Only add package imports (not relative imports)
        if (importPath && !importPath.startsWith('./') && !importPath.startsWith('../') && !importPath.startsWith('/')) {
          // Extract the package name (before any slash)
          const packageName = importPath.split('/')[0];
          if (!detectedDependencies[packageName]) {
            detectedDependencies[packageName] = "latest";
          }
        }
      }
    });
    
    return detectedDependencies;
  }
  
  // Update package.json with detected dependencies
  static updatePackageJson(files: SandpackFiles): SandpackFiles {
    const updatedFiles = { ...files };
    const dependencies = this.detectDependencies(files);
    
    if (updatedFiles['package.json']) {
      try {
        const packageJson = JSON.parse(updatedFiles['package.json'].code || '{}');
        packageJson.dependencies = { ...packageJson.dependencies, ...dependencies };
        
        updatedFiles['package.json'] = {
          code: JSON.stringify(packageJson, null, 2)
        };
      } catch (error) {
        console.error('Error updating package.json:', error);
        toast({
          title: "Error updating dependencies",
          description: "Failed to update package.json",
          variant: "destructive"
        });
      }
    }
    
    return updatedFiles;
  }
  
  // Prepare files for Sandpack
  static prepareFiles(artifactFiles: ArtifactFile[]): SandpackFiles {
    let files = this.convertToSandpackFiles(artifactFiles);
    files = this.addRequiredFiles(files);
    files = this.updatePackageJson(files);
    return files;
  }
}

// Create and export a singleton instance
export const sandpackIntegration = new SandpackManager();
