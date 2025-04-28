
import React, { useState, useEffect, createContext, useContext } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { FileCode, X, ExternalLink, ChevronRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (currentArtifact && currentArtifact.files.length > 0) {
      setActiveFile(currentArtifact.files[0].id);
      
      // Auto-expand all folders by default
      const folders: Record<string, boolean> = {};
      currentArtifact.files.forEach(file => {
        const parts = file.path.split('/');
        if (parts.length > 1) {
          let currentPath = '';
          parts.slice(0, -1).forEach(part => {
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            folders[currentPath] = true;
          });
        }
      });
      setExpandedFolders(folders);
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

  // Create a file tree structure
  const getFileTree = () => {
    const tree: Record<string, ArtifactFile[]> = {};
    const rootFiles: ArtifactFile[] = [];
    
    currentArtifact.files.forEach(file => {
      const parts = file.path.split('/');
      if (parts.length === 1) {
        rootFiles.push(file);
      } else {
        const folderPath = parts.slice(0, -1).join('/');
        if (!tree[folderPath]) {
          tree[folderPath] = [];
        }
        tree[folderPath].push(file);
      }
    });
    
    return { tree, rootFiles };
  };
  
  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };
  
  const renderFileTree = () => {
    const { tree, rootFiles } = getFileTree();
    const allFolders = Object.keys(tree).sort();
    const topLevelFolders = allFolders.filter(folder => !folder.includes('/'));
    
    const renderFolder = (folderPath: string, indent: number = 0) => {
      const isExpanded = expandedFolders[folderPath] || false;
      const folderName = folderPath.split('/').pop();
      
      const childFolders = allFolders.filter(folder => {
        const parts = folder.split('/');
        return folder !== folderPath && folder.startsWith(folderPath) && parts.length === folderPath.split('/').length + 1;
      });
      
      const files = tree[folderPath] || [];
      
      return (
        <React.Fragment key={folderPath}>
          <li 
            className="flex items-center py-1 cursor-pointer text-sm text-gray-600 hover:bg-gray-100"
            style={{ paddingLeft: `${indent * 12 + 12}px` }}
            onClick={() => toggleFolder(folderPath)}
          >
            <span className="mr-1 text-gray-500">
              {isExpanded ? (
                <ChevronRight className="h-3.5 w-3.5 transform rotate-90" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </span>
            <span className="font-medium">{folderName}/</span>
          </li>
          
          {isExpanded && (
            <>
              {childFolders.map(childFolder => renderFolder(childFolder, indent + 1))}
              
              {files.map(file => {
                const fileName = file.path.split('/').pop();
                return (
                  <li 
                    key={file.id}
                    className={`py-1 cursor-pointer text-sm hover:bg-gray-100 ${activeFile === file.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600'}`}
                    style={{ paddingLeft: `${indent * 12 + 28}px` }}
                    onClick={() => setActiveFile(file.id)}
                  >
                    {fileName}
                  </li>
                );
              })}
            </>
          )}
        </React.Fragment>
      );
    };
    
    return (
      <ul className="file-tree">
        {topLevelFolders.map(folder => renderFolder(folder))}
        
        {rootFiles.map(file => (
          <li 
            key={file.id}
            className={`py-1 pl-3 cursor-pointer text-sm hover:bg-gray-100 ${activeFile === file.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600'}`}
            onClick={() => setActiveFile(file.id)}
          >
            {file.path}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="artifact-expanded-view">
      <div className="artifact-viewer h-full flex flex-col">
        <div className="artifact-viewer-header flex justify-between items-center p-3 bg-gray-800 text-white">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <FileCode size={18} />
            {currentArtifact.title}
          </h3>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <Download size={16} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-gray-700"
              onClick={closeArtifact}
              aria-label="Close artifact viewer"
            >
              <X size={16} />
            </Button>
          </div>
        </div>
        
        <div className="artifact-viewer-content flex flex-1 overflow-hidden">
          {/* File explorer */}
          <div className="file-explorer w-1/4 min-w-[220px] border-r bg-gray-50 overflow-y-auto">
            <div className="sticky top-0 bg-gray-100 border-b px-3 py-2">
              <h4 className="text-sm font-medium text-gray-500">Files</h4>
            </div>
            {renderFileTree()}
          </div>
          
          {/* File content */}
          <div className="file-content flex-1 overflow-auto flex flex-col">
            {currentFile ? (
              <>
                <div className="file-path px-4 py-2 text-xs text-gray-500 bg-gray-100 border-b flex justify-between items-center">
                  <span>{currentFile.path}</span>
                  <span className="text-gray-400">{getLanguageFromPath(currentFile.path).toUpperCase()}</span>
                </div>
                <div className="code-container flex-1 overflow-auto">
                  <SyntaxHighlighter 
                    language={getLanguageFromPath(currentFile.path)}
                    style={vs2015}
                    customStyle={{ margin: 0, padding: '16px', height: '100%', fontSize: '14px', lineHeight: '1.5' }}
                    showLineNumbers={true}
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
