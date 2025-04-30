
import React, { useState, useEffect } from 'react';
import { 
  SandpackProvider, 
  SandpackLayout, 
  SandpackCodeEditor, 
  SandpackPreview,
  SandpackConsole,
  SandpackFileExplorer,
  SandpackTabs,
  useSandpack,
  LoadingOverlay,
  SandpackStack
} from '@codesandbox/sandpack-react';
import { nightOwl } from '@codesandbox/sandpack-themes';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ArtifactPreviewProps {
  files: Array<{
    id: string;
    name: string;
    path: string;
    language: string;
    content: string;
  }>;
}

// Helper component to show loading states
const SandpackStatus = () => {
  const { sandpack } = useSandpack();
  const [status, setStatus] = useState("Initializing...");

  useEffect(() => {
    const unsubscribe = sandpack.listen((message) => {
      switch (message.type) {
        case "start":
          setStatus("Starting sandbox...");
          break;
        case "initiated":
          setStatus("Sandbox initialized");
          break;
        case "done":
          setStatus("Preview ready");
          break;
        case "error":
          setStatus(`Error: ${message.error}`);
          break;
        default:
          break;
      }
    });
    
    return () => unsubscribe();
  }, [sandpack]);

  return (
    <div className="absolute bottom-2 right-2 text-xs bg-zinc-800/80 text-white py-1 px-2 rounded-md z-10">
      {status}
    </div>
  );
};

export const ArtifactPreview: React.FC<ArtifactPreviewProps> = ({ files }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'preview' | 'console' | 'code'>('preview');
  const [sandpackFiles, setSandpackFiles] = useState<Record<string, { code: string }>>({});
  
  // Convert our files format to Sandpack's format
  useEffect(() => {
    if (!files || files.length === 0) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    // Create files object in the format Sandpack expects
    const fileObj: Record<string, { code: string }> = {};
    
    // Process files and add them to the Sandpack files object
    files.forEach((file) => {
      // Normalize path to ensure it starts with "/"
      const normalizedPath = file.path.startsWith('/') ? file.path : `/${file.path}`;
      fileObj[normalizedPath] = { code: file.content };
    });
    
    // Add required files if they don't exist
    if (!fileObj['/package.json']) {
      fileObj['/package.json'] = {
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
    }
    
    if (!fileObj['/index.html']) {
      fileObj['/index.html'] = {
        code: `<!DOCTYPE html>
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
</html>`
      };
    }
    
    if (!fileObj['/vite.config.js']) {
      fileObj['/vite.config.js'] = {
        code: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true
  }
});`
      };
    }
    
    // Create basic React app files if they don't exist
    if (!fileObj['/src/main.jsx'] && !fileObj['/src/main.tsx']) {
      fileObj['/src/main.jsx'] = {
        code: `import React from 'react';
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
    
    if (!fileObj['/src/App.jsx'] && !fileObj['/src/App.tsx']) {
      fileObj['/src/App.jsx'] = {
        code: `import React from 'react';

function App() {
  return (
    <div className="App">
      <header>
        <h1>Sandbox App</h1>
      </header>
      <main>
        <p>This is your sandbox app preview.</p>
      </main>
    </div>
  );
}

export default App;`
      };
    }
    
    if (!fileObj['/src/index.css']) {
      fileObj['/src/index.css'] = {
        code: `body {
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
    
    setSandpackFiles(fileObj);
    setIsLoading(false);
  }, [files]);
  
  // Don't render Sandpack until we've processed the files
  if (isLoading || Object.keys(sandpackFiles).length === 0) {
    return (
      <div className="artifact-preview-container h-full flex flex-col items-center justify-center p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="font-medium text-gray-200">Preparing sandbox...</p>
      </div>
    );
  }

  return (
    <div className="artifact-preview-container h-full">
      <SandpackProvider
        theme={nightOwl}
        files={sandpackFiles}
        template="vite-react"
        customSetup={{
          dependencies: {
            "react": "^18.2.0",
            "react-dom": "^18.2.0",
          }
        }}
        options={{
          autorun: true,
          recompileMode: "immediate",
          recompileDelay: 500,
        }}
      >
        <div className="flex flex-col h-full">
          <div className="bg-zinc-800 border-b border-zinc-700 p-2">
            <div className="flex space-x-1">
              <Button 
                variant={activeTab === 'preview' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('preview')}
                className="text-xs"
              >
                Preview
              </Button>
              <Button 
                variant={activeTab === 'console' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('console')}
                className="text-xs"
              >
                Console
              </Button>
              <Button 
                variant={activeTab === 'code' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('code')}
                className="text-xs"
              >
                Code
              </Button>
            </div>
          </div>
          
          <SandpackLayout theme={nightOwl} className="flex-1 h-full">
            <SandpackStack style={{ display: activeTab === 'preview' ? 'flex' : 'none', height: '100%' }}>
              <SandpackPreview
                showOpenInCodeSandbox={false}
                showRefreshButton={true}
                style={{ height: '100%', width: '100%' }}
              />
              <SandpackStatus />
              <LoadingOverlay />
            </SandpackStack>
            
            <SandpackStack style={{ display: activeTab === 'console' ? 'flex' : 'none', height: '100%' }}>
              <SandpackConsole style={{ height: '100%' }} />
            </SandpackStack>
            
            <div style={{ 
              display: activeTab === 'code' ? 'grid' : 'none',
              gridTemplateColumns: '200px 1fr',
              height: '100%', 
              overflow: 'hidden' 
            }}>
              <SandpackFileExplorer />
              <div style={{ height: '100%', overflow: 'hidden' }}>
                <SandpackTabs />
                <SandpackCodeEditor
                  showLineNumbers={true}
                  showInlineErrors={true}
                  wrapContent
                  style={{ height: 'calc(100% - 40px)' }}
                />
              </div>
            </div>
          </SandpackLayout>
        </div>
      </SandpackProvider>
    </div>
  );
};
