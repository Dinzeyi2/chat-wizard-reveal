import React, { useState, useEffect, createContext, useContext } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { FileCode, X, ExternalLink, ChevronRight, Download, File, Code, Edit, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import './ArtifactSystem.css';
import { ArtifactPreview } from './ArtifactPreview';
import FileNavigator from './FileNavigator';

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
export const ArtifactContext = createContext<ArtifactContextType | null>(null);

export const useArtifact = () => {
  const context = useContext(ArtifactContext);
  if (!context) {
    throw new Error('useArtifact must be used within an ArtifactProvider');
  }
  return context;
};

// Allow access to the context directly for components that need to check if it exists
useArtifact.context = ArtifactContext;

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

  const updateFileContent = (fileId: string, newContent: string) => {
    if (!currentArtifact) return;
    
    const updatedFiles = currentArtifact.files.map(file => {
      if (file.id === fileId) {
        return { ...file, content: newContent };
      }
      return file;
    });
    
    setCurrentArtifact({
      ...currentArtifact,
      files: updatedFiles
    });
  };

  return (
    <ArtifactContext.Provider value={{
      openArtifact,
      closeArtifact,
      currentArtifact,
      isOpen
    }}>
      {children}
      {isOpen && currentArtifact && <ArtifactViewer updateFileContent={updateFileContent} />}
    </ArtifactContext.Provider>
  );
};

// File Viewer Component
export const ArtifactViewer: React.FC<{ updateFileContent?: (fileId: string, newContent: string) => void }> = ({ updateFileContent }) => {
  const { currentArtifact, closeArtifact, isOpen } = useArtifact();
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [readOnly, setReadOnly] = useState<boolean>(false);
  const [isCodeEditing, setIsCodeEditing] = useState<boolean>(false);
  const [editedContent, setEditedContent] = useState<string>("");

  useEffect(() => {
    console.log("ArtifactViewer mounted, isOpen:", isOpen);
    console.log("Current artifact:", currentArtifact?.id);
    
    if (currentArtifact && currentArtifact.files.length > 0) {
      // Set the first file as active by default
      setActiveFileId(currentArtifact.files[0].id);
      
      // Force reflow on mount
      window.dispatchEvent(new Event('resize'));
    } else {
      setActiveFileId(null);
    }
    
    // Prevent scroll on body when viewer is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [currentArtifact, isOpen]);
  
  // Set edited content when active file changes
  useEffect(() => {
    if (currentFile) {
      setEditedContent(currentFile.content);
    }
  }, [activeFileId]);

  // Debug log when tab changes
  useEffect(() => {
    console.log("Active tab changed to:", activeTab);
  }, [activeTab]);

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

  const handleFileSelect = (fileId: string) => {
    console.log("Selected file with ID:", fileId);
    setActiveFileId(fileId);
    setIsCodeEditing(false); // Reset editing mode when changing files
  };

  const handleFileContentChange = (fileId: string, newContent: string) => {
    if (updateFileContent) {
      updateFileContent(fileId, newContent);
    }
  };
  
  const toggleEditMode = () => {
    setIsCodeEditing(!isCodeEditing);
  };
  
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
  };
  
  const saveCodeChanges = () => {
    if (activeFileId && updateFileContent) {
      updateFileContent(activeFileId, editedContent);
      toast({
        title: "Changes saved",
        description: "Your code changes have been saved successfully."
      });
    }
  };

  if (!isOpen || !currentArtifact) {
    console.log("ArtifactViewer not rendering because isOpen:", isOpen, "currentArtifact:", !!currentArtifact);
    return null;
  }

  console.log("Rendering ArtifactViewer with artifact:", currentArtifact.id);
  console.log("Number of files:", currentArtifact.files.length);
  console.log("Active file ID:", activeFileId);

  const currentFile = currentArtifact.files.find(f => f.id === activeFileId);

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
            {activeTab === 'code' && currentFile && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-transparent"
                  onClick={toggleEditMode}
                >
                  {isCodeEditing ? <Code size={16} /> : <Edit size={16} />}
                </Button>
                {isCodeEditing && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-gray-400 hover:text-white hover:bg-transparent"
                    onClick={saveCodeChanges}
                  >
                    <Save size={16} />
                  </Button>
                )}
              </>
            )}
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
              <FileNavigator 
                files={currentArtifact.files}
                activeFileId={activeFileId}
                onFileSelect={handleFileSelect}
                onFileContentChange={handleFileContentChange}
                readOnly={readOnly}
              />
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
                  <div className="code-container flex-1 overflow-auto bg-zinc-900">
                    {isCodeEditing ? (
                      <textarea 
                        value={editedContent}
                        onChange={handleCodeChange}
                        className="w-full h-full p-4 bg-zinc-900 text-gray-200 font-mono text-sm resize-none border-0 outline-none"
                        spellCheck="false"
                      />
                    ) : (
                      <SyntaxHighlighter 
                        language={getLanguageFromPath(currentFile.path)}
                        style={vs2015}
                        customStyle={{ margin: 0, padding: '16px', height: '100%', fontSize: '14px', lineHeight: '1.5', backgroundColor: '#18181b' }}
                        showLineNumbers={true}
                      >
                        {currentFile.content}
                      </SyntaxHighlighter>
                    )}
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
