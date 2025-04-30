
/**
 * SandpackManager - Utility class for working with CodeSandbox Sandpack
 * This replaces the previous WebContainerManager with a simpler implementation
 * focused on CodeSandbox Sandpack integration
 */
import { toast } from '@/hooks/use-toast';
import { SandpackFiles } from '@codesandbox/sandpack-react';

export class SandpackManager {
  // Convert artifact files to Sandpack format
  static convertFilesToSandpackFormat(files: Array<{path: string, content: string}>): SandpackFiles {
    const sandpackFiles: SandpackFiles = {};
    
    files.forEach(file => {
      const normalizedPath = file.path.startsWith('/') ? file.path : `/${file.path}`;
      sandpackFiles[normalizedPath] = { code: file.content };
    });
    
    // Add required files if they don't exist
    SandpackManager.addDefaultFiles(sandpackFiles);
    
    return sandpackFiles;
  }
  
  // Add default files necessary for a React application
  static addDefaultFiles(files: SandpackFiles): void {
    // Add package.json if not provided
    if (!files['/package.json']) {
      files['/package.json'] = {
        code: JSON.stringify({
          name: 'sandbox-app',
          version: '1.0.0',
          description: 'Generated project',
          dependencies: {
            "react": "^18.2.0",
            "react-dom": "^18.2.0"
          },
          devDependencies: {
            "@vitejs/plugin-react": "^4.0.0",
            "vite": "^4.3.9"
          },
          scripts: {
            "dev": "vite --port 3000",
            "build": "vite build"
          }
        }, null, 2)
      };
    } else {
      // Parse existing package.json to ensure React dependencies
      try {
        const packageJson = JSON.parse(files['/package.json'].code);
        
        if (!packageJson.dependencies) {
          packageJson.dependencies = {};
        }
        
        // Ensure React dependencies exist
        if (!packageJson.dependencies.react) {
          packageJson.dependencies.react = "^18.2.0";
        }
        
        if (!packageJson.dependencies["react-dom"]) {
          packageJson.dependencies["react-dom"] = "^18.2.0";
        }
        
        // Update the package.json file
        files['/package.json'].code = JSON.stringify(packageJson, null, 2);
      } catch (error) {
        console.error('Error parsing package.json:', error);
        toast({
          title: "Error",
          description: "Failed to parse package.json",
          variant: "destructive"
        });
      }
    }
    
    // Add index.html if not provided
    if (!files['/index.html']) {
      files['/index.html'] = {
        code: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sandbox App</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
        `
      };
    }
    
    // Add vite.config.js if not provided
    if (!files['/vite.config.js']) {
      files['/vite.config.js'] = {
        code: `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true
  }
});
        `
      };
    }
    
    // Ensure src directory and main.jsx exist
    if (!files['/src/main.jsx'] && !files['/src/main.tsx']) {
      files['/src/main.jsx'] = {
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
    
    // Ensure App.jsx exists
    if (!files['/src/App.jsx'] && !files['/src/App.tsx']) {
      files['/src/App.jsx'] = {
        code: `
import React from 'react';

function App() {
  return (
    <div className="App">
      <header>
        <h1>Sandbox App</h1>
      </header>
      <main>
        <p>This is a sandbox React app.</p>
      </main>
    </div>
  );
}

export default App;
        `
      };
    }
    
    // Ensure index.css exists
    if (!files['/src/index.css']) {
      files['/src/index.css'] = {
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
  }
  
  // Detect dependencies from code files
  static detectDependencies(files: SandpackFiles): Record<string, string> {
    const dependencies: Record<string, string> = {
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
    };
    
    // Simple regex to detect import statements across all code files
    const importRegex = /import\s+?(?:(?:(?:[\w*\s{},]*)\s+from\s+?)|)(?:(?:"(.*?)")|(?:'(.*?)'))[\s]*?(?:;|$)/g;
    const requireRegex = /(?:const|let|var)\s+[\w\s{},]*\s*=\s*require\s*\(\s*(?:"|')([@\w\-\/\.]+)(?:"|')\s*\)/g;
    
    Object.entries(files).forEach(([path, { code }]) => {
      if (path.endsWith('.js') || path.endsWith('.jsx') || path.endsWith('.ts') || path.endsWith('.tsx')) {
        let match;
        
        // Check for import statements
        while ((match = importRegex.exec(code)) !== null) {
          const importPath = match[1] || match[2];
          if (importPath && !importPath.startsWith('./') && !importPath.startsWith('../') && !importPath.startsWith('/')) {
            const packageName = importPath.split('/')[0];
            if (!dependencies[packageName]) {
              dependencies[packageName] = "latest";
            }
          }
        }
        
        // Check for require statements
        while ((match = requireRegex.exec(code)) !== null) {
          const requirePath = match[1];
          if (requirePath && !requirePath.startsWith('./') && !requirePath.startsWith('../') && !requirePath.startsWith('/')) {
            const packageName = requirePath.split('/')[0];
            if (!dependencies[packageName]) {
              dependencies[packageName] = "latest";
            }
          }
        }
      }
    });
    
    return dependencies;
  }
}

export default SandpackManager;
