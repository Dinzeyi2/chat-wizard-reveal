import React, { useState, useEffect, createContext, useContext } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { FileCode, X, ExternalLink, ChevronRight, Download, File, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import './ArtifactSystem.css';

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

  useEffect(() => {
    // Make sure CSS is applied when component mounts
    const style = document.createElement('style');
    const css = `
      .artifact-system {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
      }
      
      .chat-area {
        height: 100%;
        overflow-y: auto;
        transition: width 0.3s ease;
        flex: 1;
      }
      
      .artifact-expanded-view {
        position: fixed;
        top: 0;
        right: 0;
        width: 60%;
        height: 100vh;
        background-color: #18181b;
        box-shadow: -2px 0 10px rgba(0, 0, 0, 0.3);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        z-index: 100;
      }
    `;
    style.innerHTML = css;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const openArtifact = (artifact: Artifact) => {
    console.log("ArtifactProvider.openArtifact called with:", artifact.id);
    if (!artifact || !artifact.files || artifact.files.length === 0) {
      console.error("Cannot open artifact: Invalid artifact or empty files array");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot display code: No valid files found"
      });
      return;
    }
    
    // Ensure we're working with a valid artifact
    console.log(`Opening artifact with ${artifact.files.length} files`);
    
    // Set the artifact and open the viewer
    setCurrentArtifact(artifact);
    setIsOpen(true);
    
    // Force reflow to ensure the viewer is rendered
    setTimeout(() => {
      console.log("Forcing reflow to ensure artifact viewer is visible");
      window.dispatchEvent(new Event('resize'));
    }, 100);
    
    console.log("Artifact viewer opened successfully");
  };

  const closeArtifact = () => {
    console.log("Closing artifact viewer");
    setIsOpen(false);
    setTimeout(() => setCurrentArtifact(null), 300); // Clear after animation
  };

  return (
    <ArtifactContext.Provider value={{
      openArtifact,
      closeArtifact,
      currentArtifact,
      isOpen
    }}>
      {children}
      {isOpen && currentArtifact && <ArtifactViewer />}
    </ArtifactContext.Provider>
  );
};

// File Viewer Component
export const ArtifactViewer: React.FC = () => {
  const { currentArtifact, closeArtifact, isOpen } = useArtifact();
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');

  useEffect(() => {
    console.log("ArtifactViewer mounted, isOpen:", isOpen);
    console.log("Current artifact:", currentArtifact?.id);
    
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
    
    // Force reflow on mount
    window.dispatchEvent(new Event('resize'));
    
    // Prevent scroll on body when viewer is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [currentArtifact, isOpen]);

  if (!isOpen || !currentArtifact) {
    console.log("ArtifactViewer not rendering because isOpen:", isOpen, "currentArtifact:", !!currentArtifact);
    return null;
  }

  console.log("Rendering ArtifactViewer with artifact:", currentArtifact.id);
  console.log("Number of files:", currentArtifact.files.length);

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
            className="flex items-center py-1 cursor-pointer text-gray-300 hover:bg-zinc-800"
            style={{ paddingLeft: `${indent * 12 + 12}px` }}
            onClick={() => toggleFolder(folderPath)}
          >
            <span className="mr-1 text-gray-400">
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
                    className={`py-1 cursor-pointer text-sm hover:bg-zinc-800 ${activeFile === file.id ? 'text-green-400' : 'text-gray-300'}`}
                    style={{ paddingLeft: `${indent * 12 + 28}px` }}
                    onClick={() => setActiveFile(file.id)}
                  >
                    <div className="flex items-center">
                      <File className="h-4 w-4 mr-2 text-gray-500" />
                      {fileName}
                      {activeFile === file.id && 
                        <span className="text-green-400 ml-2 text-xs">+31</span>
                      }
                    </div>
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
            className={`py-1 pl-3 cursor-pointer text-sm hover:bg-zinc-800 ${activeFile === file.id ? 'text-green-400' : 'text-gray-300'}`}
            onClick={() => setActiveFile(file.id)}
          >
            <div className="flex items-center px-2 py-1">
              <File className="h-4 w-4 mr-2 text-gray-500" />
              {file.path}
              {activeFile === file.id && 
                <span className="text-green-400 ml-2 text-xs">+31</span>
              }
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="artifact-expanded-view">
      <div className="artifact-viewer h-full flex flex-col">
        <div className="artifact-viewer-header flex justify-between items-center">
          <div className="file-viewer-tabs">
            <Button 
              variant="ghost"
              size="sm"
              className={`file-viewer-tab ${activeTab === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              Preview
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              className={`file-viewer-tab ${activeTab === 'code' ? 'active' : ''}`}
              onClick={() => setActiveTab('code')}
            >
              <Code size={18} />
              Code
            </Button>
          </div>
          <div className="file-viewer-actions">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-transparent"
            >
              <ExternalLink size={16} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-transparent"
            >
              <Download size={16} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-transparent"
              onClick={closeArtifact}
              aria-label="Close artifact viewer"
            >
              <X size={16} />
            </Button>
          </div>
        </div>
        
        <div className="artifact-viewer-content flex flex-1 overflow-hidden">
          <div className="file-explorer w-1/4 min-w-[220px] border-r border-zinc-800 bg-black overflow-y-auto">
            <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-3 py-2">
              <h4 className="text-sm font-medium text-gray-400">Files</h4>
            </div>
            {renderFileTree()}
          </div>
          
          <div className="file-content flex-1 overflow-auto flex flex-col">
            {currentFile ? (
              <>
                <div className="file-path px-4 py-2 text-xs text-gray-400 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center">
                  <span>{currentFile.path}</span>
                  <span className="text-gray-500">{getLanguageFromPath(currentFile.path).toUpperCase()}</span>
                </div>
                <div className="code-container flex-1 overflow-auto bg-zinc-900">
                  <SyntaxHighlighter 
                    language={getLanguageFromPath(currentFile.path)}
                    style={vs2015}
                    customStyle={{ margin: 0, padding: '16px', height: '100%', fontSize: '14px', lineHeight: '1.5', backgroundColor: '#18181b' }}
                    showLineNumbers={true}
                  >
                    {currentFile.content}
                  </SyntaxHighlighter>
                </div>
              </>
            ) : (
              <div className="no-file-selected p-4 text-center text-gray-500 mt-8 bg-zinc-900">
                Select a file to view its content
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Simplified layout - this was the problem!
// The code was trying to render a layout component which wasn't integrating properly
export const ArtifactLayout: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return (
    <div className="artifact-system flex h-full">
      <div className="chat-area">
        {children}
      </div>
    </div>
  );
};
