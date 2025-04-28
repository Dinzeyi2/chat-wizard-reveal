
import React, { useState, useEffect, createContext, useContext } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { FileCode, X } from 'lucide-react';

// Types
interface ArtifactFile {
  id: string;
  name: string;
  path: string;
  language: string;
  content: string;
}

interface Artifact {
  id: string;
  title: string;
  files: ArtifactFile[];
  description?: string;
}

interface ArtifactContextType {
  openArtifact: (artifact: Artifact) => void;
  closeArtifact: () => void;
  currentArtifact: Artifact | null;
  isOpen: boolean;
}

// Create Context
const ArtifactContext = createContext<ArtifactContextType | null>(null);

export const useArtifact = () => {
  const context = useContext(ArtifactContext);
  if (!context) {
    throw new Error('useArtifact must be used within an ArtifactProvider');
  }
  return context;
};

// Provider Component
export const ArtifactProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [currentArtifact, setCurrentArtifact] = useState<Artifact | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openArtifact = (artifact: Artifact) => {
    console.log("Opening artifact:", artifact);
    setCurrentArtifact(artifact);
    setIsOpen(true);
  };

  const closeArtifact = () => {
    setIsOpen(false);
  };

  return (
    <ArtifactContext.Provider value={{
      openArtifact,
      closeArtifact,
      currentArtifact,
      isOpen
    }}>
      {children}
    </ArtifactContext.Provider>
  );
};

// File Viewer Component
export const ArtifactViewer: React.FC = () => {
  const { currentArtifact, closeArtifact, isOpen } = useArtifact();
  const [activeFile, setActiveFile] = useState<string | null>(null);

  useEffect(() => {
    if (currentArtifact && currentArtifact.files.length > 0) {
      setActiveFile(currentArtifact.files[0].id);
    } else {
      setActiveFile(null);
    }
  }, [currentArtifact]);

  if (!isOpen || !currentArtifact) return null;

  const currentFile = currentArtifact.files.find(f => f.id === activeFile);

  const getLanguageFromPath = (path: string): string => {
    const extension = path.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'css': 'css',
      'scss': 'scss',
      'html': 'html',
      'json': 'json',
      'md': 'markdown',
    };
    return languageMap[extension] || 'plaintext';
  };

  return (
    <div className="artifact-expanded-view">
      <div className="artifact-viewer h-full flex flex-col">
        <div className="artifact-viewer-header flex justify-between items-center p-3 bg-gray-100 border-b">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <FileCode size={18} />
            {currentArtifact.title}
          </h3>
          <button 
            onClick={closeArtifact}
            className="close-button text-gray-500 hover:text-gray-700"
            aria-label="Close artifact viewer"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="artifact-viewer-content flex flex-1 overflow-hidden">
          {/* File explorer */}
          <div className="file-explorer w-1/4 min-w-[200px] border-r bg-gray-50 overflow-y-auto">
            <h4 className="px-3 py-2 text-sm font-medium text-gray-500">Files</h4>
            <ul className="file-list">
              {currentArtifact.files.map(file => (
                <li 
                  key={file.id}
                  className={`file-item px-3 py-2 text-sm cursor-pointer hover:bg-gray-200 ${activeFile === file.id ? 'bg-gray-300 font-medium' : ''}`}
                  onClick={() => setActiveFile(file.id)}
                >
                  {file.path}
                </li>
              ))}
            </ul>
          </div>
          
          {/* File content */}
          <div className="file-content flex-1 overflow-auto flex flex-col">
            {currentFile ? (
              <>
                <div className="file-path px-4 py-2 text-xs text-gray-500 bg-gray-100 border-b">
                  {currentFile.path}
                </div>
                <div className="code-container flex-1 overflow-auto">
                  <SyntaxHighlighter 
                    language={getLanguageFromPath(currentFile.path)}
                    style={vs2015}
                    customStyle={{ margin: 0, padding: '16px', height: '100%' }}
                  >
                    {currentFile.content}
                  </SyntaxHighlighter>
                </div>
              </>
            ) : (
              <div className="no-file-selected p-4 text-center text-gray-500 mt-8">
                Select a file to view its content
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// The Layout component that manages the artifact system
export const ArtifactLayout: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { isOpen } = useArtifact();

  return (
    <div className="artifact-system flex h-full">
      <div className={`chat-area transition-all duration-300 ease-in-out ${isOpen ? 'w-[40%] border-r' : 'w-full'}`}>
        {children}
      </div>
      
      {isOpen && <ArtifactViewer />}
    </div>
  );
};
