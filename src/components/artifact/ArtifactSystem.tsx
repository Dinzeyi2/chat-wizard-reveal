
import React, { useState, useEffect, createContext, useContext } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { FileCode, X, ExternalLink, ChevronRight, Download, File, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import './ArtifactSystem.css';
import { ArtifactPreview } from './ArtifactPreview';

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
    // Update chat area class when artifact opens/closes
    const chatArea = document.querySelector('.chat-area');
    if (chatArea) {
      if (isOpen) {
        chatArea.classList.add('artifact-open');
      } else {
        chatArea.classList.remove('artifact-open');
      }
    }
    
    // Force reflow to ensure CSS changes take effect
    if (chatArea) {
      // Cast to HTMLElement to fix TypeScript error
      void (chatArea as HTMLElement).offsetHeight;
    }
  }, [isOpen]);

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

  // Initialize the viewer with the first file selected by default
  useEffect(() => {
    console.log("ArtifactViewer mounted or artifact changed");
    console.log("Current artifact:", currentArtifact?.id);
    console.log("Is viewer open:", isOpen);
    
    if (currentArtifact && currentArtifact.files && currentArtifact.files.length > 0) {
      console.log("Setting initial active file:", currentArtifact.files[0].id);
      
      // Set the first file as active by default
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
      console.log("No files available to display");
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

  // Debug active tab changes
  useEffect(() => {
    console.log("Active tab changed to:", activeTab);
  }, [activeTab]);

  // Log active file changes with detailed information
  useEffect(() => {
    console.log("Active file changed to:", activeFile);
    if (activeFile && currentArtifact) {
      const selectedFile = currentArtifact.files.find(f => f.id === activeFile);
      if (selectedFile) {
        console.log("Selected file info:", {
          id: selectedFile.id,
          path: selectedFile.path,
          contentLength: selectedFile.content.length
        });
      } else {
        console.error("Selected file ID not found in artifact files");
      }
    }
  }, [activeFile, currentArtifact]);

  const handleTabChange = (tab: 'code' | 'preview') => {
    console.log("Changing tab to:", tab);
    setActiveTab(tab);
    // Force reflow when switching to preview tab to ensure Sandpack renders properly
    if (tab === 'preview') {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
    }
  };

  if (!isOpen || !currentArtifact) {
    console.log("ArtifactViewer not rendering because isOpen:", isOpen, "currentArtifact:", !!currentArtifact);
    return null;
  }

  console.log("Rendering ArtifactViewer with artifact:", currentArtifact.id);
  console.log("Number of files:", currentArtifact.files.length);
  console.log("Active file ID:", activeFile);

  // Find the currently selected file
  const currentFile = activeFile && currentArtifact.files 
    ? currentArtifact.files.find(f => f.id === activeFile)
    : null;

  // Debug current file information
  if (currentFile) {
    console.log("Current file path:", currentFile.path);
    console.log("Current file content type:", typeof currentFile.content);
    console.log("Current file content length:", currentFile.content.length);
  } else {
    console.log("No current file selected");
    
    // If no file is selected but files exist, auto-select the first file
    if (currentArtifact.files && currentArtifact.files.length > 0) {
      console.log("Auto-selecting first file");
      setTimeout(() => {
        setActiveFile(currentArtifact.files[0].id);
      }, 0);
    }
  }

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
    
    if (!currentArtifact || !currentArtifact.files) {
      console.error("No artifact or files available");
      return { tree, rootFiles };
    }
    
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
  
  const toggleFolder = (folderPath: string) => (event: React.MouseEvent) => {
    // Prevent the click from propagating to parent elements
    event.stopPropagation();
    
    setExpandedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };
  
  const handleFileClick = (fileId: string) => (event: React.MouseEvent) => {
    // Prevent the click from propagating to parent elements
    event.stopPropagation();
    
    console.log("File clicked:", fileId);
    const fileToSelect = currentArtifact.files.find(f => f.id === fileId);
    if (fileToSelect) {
      console.log("Setting active file to:", fileToSelect.path);
      setActiveFile(fileId);
    } else {
      console.error("Clicked file not found in artifact files");
    }
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
            onClick={toggleFolder(folderPath)}
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
                const fileName = file.path.split('/').pop() || file.path;
                return (
                  <li 
                    key={file.id}
                    className={`py-1 cursor-pointer text-sm hover:bg-zinc-800 ${activeFile === file.id ? 'bg-zinc-800 text-green-400' : 'text-gray-300'}`}
                    style={{ paddingLeft: `${indent * 12 + 28}px` }}
                    onClick={handleFileClick(file.id)}
                  >
                    <div className="flex items-center">
                      <File className="h-4 w-4 mr-2 text-gray-500" />
                      {fileName}
                      {activeFile === file.id && 
                        <span className="text-green-400 ml-2 text-xs">•</span>
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
        
        {rootFiles.map(file => {
          const fileName = file.path.split('/').pop() || file.path;
          return (
            <li 
              key={file.id}
              className={`py-1 pl-3 cursor-pointer text-sm hover:bg-zinc-800 ${activeFile === file.id ? 'bg-zinc-800 text-green-400' : 'text-gray-300'}`}
              onClick={handleFileClick(file.id)}
            >
              <div className="flex items-center px-2 py-1">
                <File className="h-4 w-4 mr-2 text-gray-500" />
                {fileName}
                {activeFile === file.id && 
                  <span className="text-green-400 ml-2 text-xs">•</span>
                }
              </div>
            </li>
          );
        })}
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
              onClick={() => handleTabChange('preview')}
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
              onClick={() => handleTabChange('code')}
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
        
        <div className={`artifact-viewer-content flex flex-1 overflow-hidden ${activeTab === 'preview' ? 'preview-mode' : ''}`}>
          {activeTab === 'code' && (
            <div className="file-explorer w-1/4 min-w-[220px] border-r border-zinc-800 bg-black overflow-y-auto">
              <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-3 py-2">
                <h4 className="text-sm font-medium text-gray-400">Files</h4>
              </div>
              {renderFileTree()}
            </div>
          )}
          
          <div className="file-content flex-1 overflow-auto flex flex-col">
            {activeTab === 'code' ? (
              currentFile ? (
                <>
                  <div className="file-path px-4 py-2 text-xs text-gray-400 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center">
                    <span>{currentFile.path}</span>
                    <span className="text-gray-500">{getLanguageFromPath(currentFile.path).toUpperCase()}</span>
                  </div>
                  <div className="code-container flex-1 overflow-auto bg-zinc-900" key={`code-${currentFile.id}`}>
                    <SyntaxHighlighter 
                      language={getLanguageFromPath(currentFile.path)}
                      style={vs2015}
                      customStyle={{ 
                        margin: 0, 
                        padding: '16px', 
                        height: '100%', 
                        fontSize: '14px', 
                        lineHeight: '1.5', 
                        backgroundColor: '#18181b',
                        width: '100%'
                      }}
                      showLineNumbers={true}
                      key={currentFile.id}
                    >
                      {currentFile.content}
                    </SyntaxHighlighter>
                  </div>
                </>
              ) : (
                <div className="no-file-selected p-4 text-center text-gray-500 mt-8 bg-zinc-900">
                  Select a file to view its content
                </div>
              )
            ) : (
              <div className="preview-container h-full w-full flex-1">
                <ArtifactPreview files={currentArtifact.files} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Simplified layout for the artifact system
export const ArtifactLayout: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return (
    <div className="artifact-system">
      <div className="chat-area">
        {children}
      </div>
    </div>
  );
};
