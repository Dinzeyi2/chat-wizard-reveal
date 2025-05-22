
import React, { useState, useEffect, createContext, useContext } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { FileCode, X, ExternalLink, ChevronRight, Download, File, Code, Save, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import './ArtifactSystem.css';
import { ArtifactPreview } from './ArtifactPreview';
import Editor from '@monaco-editor/react';

// Types
interface ArtifactFile {
  id: string;
  name: string;
  path: string;
  language: string;
  content: string;
  isComplete?: boolean;  // Flag to indicate if file is complete or needs implementation
  challenges?: {
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    hints: string[];
  }[];
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
  updateFileContent?: (fileId: string, newContent: string) => void;
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

  const updateFileContent = (fileId: string, newContent: string) => {
    if (!currentArtifact) return;
    
    setCurrentArtifact(prev => {
      if (!prev) return prev;
      
      const updatedFiles = prev.files.map(file => 
        file.id === fileId ? {
          ...file, 
          content: newContent,
          isComplete: true // Mark as complete when the user updates it
        } : file
      );
      
      return {...prev, files: updatedFiles};
    });
    
    toast({
      title: "File updated",
      description: "Your changes have been saved",
    });
  };

  return (
    <ArtifactContext.Provider value={{
      openArtifact,
      closeArtifact,
      currentArtifact,
      isOpen,
      updateFileContent
    }}>
      {children}
      {isOpen && currentArtifact && <ArtifactViewer />}
    </ArtifactContext.Provider>
  );
};

// File Viewer Component
export const ArtifactViewer: React.FC = () => {
  const { currentArtifact, closeArtifact, isOpen, updateFileContent } = useArtifact();
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'code' | 'preview' | 'files'>('code');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState<string>('');
  const [isEditorReady, setIsEditorReady] = useState(false);

  useEffect(() => {
    console.log("ArtifactViewer mounted, isOpen:", isOpen);
    console.log("Current artifact:", currentArtifact?.id);
    
    if (currentArtifact && currentArtifact.files.length > 0) {
      setActiveFile(currentArtifact.files[0].id);
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

  // Reset editor state when active file changes
  useEffect(() => {
    if (currentArtifact && activeFile) {
      const currentFile = currentArtifact.files.find(f => f.id === activeFile);
      if (currentFile) {
        setEditedContent(currentFile.content);
        setIsEditMode(false);
      }
    }
  }, [activeFile, currentArtifact]);

  // Debug log when tab changes
  useEffect(() => {
    console.log("Active tab changed to:", activeTab);
  }, [activeTab]);

  const handleTabChange = (tab: 'code' | 'preview' | 'files') => {
    console.log("Changing tab to:", tab);
    setActiveTab(tab);
    // Force reflow when switching to preview tab to ensure Sandpack renders properly
    if (tab === 'preview') {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
    }
  };

  const handleEditorDidMount = () => {
    setIsEditorReady(true);
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditedContent(value);
    }
  };

  const handleSaveChanges = () => {
    if (activeFile && updateFileContent) {
      updateFileContent(activeFile, editedContent);
      setIsEditMode(false);
    }
  };

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

  const getMonacoLanguage = (path: string): string => {
    // Monaco uses slightly different language identifiers
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
            <Button 
              variant="ghost"
              size="sm"
              className={`file-viewer-tab ${activeTab === 'files' ? 'active' : ''}`}
              onClick={() => handleTabChange('files')}
            >
              <File size={18} />
              Files
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
          <div className="file-content flex-1 overflow-auto flex flex-col">
            {activeTab === 'code' ? (
              currentFile ? (
                <>
                  <div className="file-path px-4 py-2 text-xs text-gray-400 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center">
                    <div className="flex items-center">
                      <span>{currentFile.path}</span>
                      {currentFile.isComplete === false && (
                        <div className="ml-2 px-2 py-0.5 bg-amber-200 text-amber-800 rounded-md text-xs flex items-center">
                          <AlertTriangle size={12} className="mr-1" />
                          Incomplete
                        </div>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-3">{getLanguageFromPath(currentFile.path).toUpperCase()}</span>
                      {!isEditMode ? (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 px-2 py-0 text-xs"
                          onClick={() => setIsEditMode(true)}
                        >
                          Edit
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 px-2 py-0 text-xs bg-green-600 text-white hover:bg-green-700"
                          onClick={handleSaveChanges}
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Display challenges for this file if they exist */}
                  {currentFile.isComplete === false && currentFile.challenges && currentFile.challenges.length > 0 && (
                    <div className="bg-amber-50 p-3 border-b border-amber-200">
                      <div className="font-medium text-amber-800 mb-2">Implementation Challenge:</div>
                      {currentFile.challenges.map((challenge, idx) => (
                        <div key={idx} className="mb-2">
                          <div className="text-sm text-amber-900">{challenge.description}</div>
                          <div className="text-xs text-amber-800 mt-1">Difficulty: {challenge.difficulty}</div>
                          {challenge.hints.length > 0 && (
                            <details className="mt-2">
                              <summary className="text-xs text-blue-600 cursor-pointer">Show hints</summary>
                              <ul className="mt-1 ml-4 list-disc">
                                {challenge.hints.map((hint, hintIdx) => (
                                  <li key={hintIdx} className="text-xs text-gray-700">{hint}</li>
                                ))}
                              </ul>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="code-container flex-1 overflow-auto bg-zinc-900">
                    {isEditMode ? (
                      <Editor
                        height="100%"
                        language={getMonacoLanguage(currentFile.path)}
                        value={editedContent}
                        theme="vs-dark"
                        onChange={handleEditorChange}
                        onMount={handleEditorDidMount}
                        options={{
                          fontSize: 14,
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          lineNumbers: 'on',
                          tabSize: 2,
                        }}
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
            ) : activeTab === 'preview' ? (
              <div className="preview-container h-full w-full flex-1">
                <ArtifactPreview files={currentArtifact.files} />
              </div>
            ) : (
              <div className="files-container p-4 bg-zinc-900 h-full">
                <h3 className="text-lg font-medium text-gray-200 mb-4">All Files</h3>
                <div className="grid gap-2">
                  {currentArtifact.files.map(file => (
                    <div 
                      key={file.id} 
                      className={`p-3 border rounded-md hover:bg-zinc-800 cursor-pointer ${
                        file.isComplete === false ? 'border-amber-500 bg-zinc-900' : 'border-zinc-700'
                      }`}
                      onClick={() => {
                        setActiveFile(file.id);
                        setActiveTab('code');
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <File className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-sm text-gray-300">{file.path}</span>
                        </div>
                        {file.isComplete === false && (
                          <div className="px-2 py-0.5 bg-amber-200 text-amber-800 rounded-md text-xs flex items-center">
                            <AlertTriangle size={12} className="mr-1" />
                            Incomplete
                          </div>
                        )}
                      </div>
                      <div className="mt-1 flex justify-between">
                        <span className="text-xs text-gray-500">
                          {getLanguageFromPath(file.path).toUpperCase()} · {file.content.length} characters
                        </span>
                        {file.challenges && file.challenges.length > 0 && (
                          <span className="text-xs text-blue-400">
                            {file.challenges.length} challenge{file.challenges.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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
