import React, { useState, useEffect } from 'react';
import { ChevronRight, File, Folder, Save } from 'lucide-react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface FileNavigatorProps {
  files: Array<{id: string; name: string; path: string; language: string; content: string}>;
  activeFileId: string | null;
  onFileSelect: (fileId: string) => void;
  onFileContentChange?: (fileId: string, newContent: string) => void;
  readOnly?: boolean;
}

const FileNavigator: React.FC<FileNavigatorProps> = ({ 
  files, 
  activeFileId, 
  onFileSelect,
  onFileContentChange,
  readOnly = false
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Auto-expand all folders by default
    const folders: Record<string, boolean> = {};
    files.forEach(file => {
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
  }, [files]);

  // Reset edit mode and content when active file changes
  useEffect(() => {
    if (activeFileId) {
      const currentFile = files.find(f => f.id === activeFileId);
      if (currentFile) {
        setEditedContent(currentFile.content);
        setEditMode(false);
      }
    }
  }, [activeFileId, files]);

  const getFileTree = () => {
    const tree: Record<string, Array<{id: string; name: string; path: string; language: string; content: string}>> = {};
    const rootFiles: Array<{id: string; name: string; path: string; language: string; content: string}> = [];
    
    files.forEach(file => {
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
  
  const toggleFolder = (folderPath: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  const handleFileClick = (fileId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("File clicked:", fileId);
    onFileSelect(fileId);
  };

  const toggleEditMode = () => {
    if (readOnly) return;
    
    if (!editMode && activeFileId) {
      // Entering edit mode
      const currentFile = files.find(f => f.id === activeFileId);
      if (currentFile) {
        setEditedContent(currentFile.content);
        setEditMode(true);
      }
    } else {
      // Exiting edit mode
      setEditMode(false);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
  };

  const saveChanges = () => {
    if (!activeFileId || !onFileContentChange) return;
    
    setIsSaving(true);
    try {
      onFileContentChange(activeFileId, editedContent);
      toast({
        title: "File saved",
        description: "Your changes have been saved successfully",
      });
      setEditMode(false);
    } catch (error) {
      console.error("Error saving file:", error);
      toast({
        title: "Save failed",
        description: "There was an error saving your changes",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

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
  
  const { tree, rootFiles } = getFileTree();
  const allFolders = Object.keys(tree).sort();
  const topLevelFolders = allFolders.filter(folder => !folder.includes('/'));
  
  const currentFile = files.find(f => f.id === activeFileId);
  
  const renderFolder = (folderPath: string, indent: number = 0) => {
    const isExpanded = expandedFolders[folderPath] || false;
    const folderName = folderPath.split('/').pop();
    
    const childFolders = allFolders.filter(folder => {
      const parts = folder.split('/');
      return folder !== folderPath && folder.startsWith(folderPath) && parts.length === folderPath.split('/').length + 1;
    });
    
    const folderFiles = tree[folderPath] || [];
    
    return (
      <React.Fragment key={folderPath}>
        <li 
          className="flex items-center py-1 cursor-pointer text-gray-300 hover:bg-zinc-800"
          style={{ paddingLeft: `${indent * 12 + 12}px` }}
          onClick={(e) => toggleFolder(folderPath, e)}
        >
          <span className="mr-1 text-gray-400">
            {isExpanded ? (
              <ChevronRight className="h-3.5 w-3.5 transform rotate-90" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </span>
          <Folder className="h-4 w-4 mr-1 text-gray-500" />
          <span className="font-medium">{folderName}/</span>
        </li>
        
        {isExpanded && (
          <>
            {childFolders.map(childFolder => renderFolder(childFolder, indent + 1))}
            
            {folderFiles.map(file => {
              const fileName = file.path.split('/').pop();
              return (
                <li 
                  key={file.id}
                  className={`py-1 cursor-pointer text-sm hover:bg-zinc-800 ${activeFileId === file.id ? 'bg-zinc-800 text-green-400' : 'text-gray-300'}`}
                  style={{ paddingLeft: `${indent * 12 + 28}px` }}
                  onClick={(e) => handleFileClick(file.id, e)}
                >
                  <div className="flex items-center">
                    <File className="h-4 w-4 mr-2 text-gray-500" />
                    {fileName}
                    {activeFileId === file.id && 
                      <span className="text-green-400 ml-2 text-xs">●</span>
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
    <div className="file-explorer w-full h-full bg-black overflow-y-auto">
      <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-3 py-2">
        <h4 className="text-sm font-medium text-gray-400">Files</h4>
      </div>
      
      <div className="flex flex-col h-full">
        <div className="file-tree-container overflow-auto flex-shrink-0" style={{ maxHeight: '40%' }}>
          <ul className="file-tree">
            {topLevelFolders.map(folder => renderFolder(folder))}
            
            {rootFiles.map(file => (
              <li 
                key={file.id}
                className={`py-1 pl-3 cursor-pointer text-sm hover:bg-zinc-800 ${activeFileId === file.id ? 'bg-zinc-800 text-green-400' : 'text-gray-300'}`}
                onClick={(e) => handleFileClick(file.id, e)}
              >
                <div className="flex items-center px-2 py-1">
                  <File className="h-4 w-4 mr-2 text-gray-500" />
                  {file.path}
                  {activeFileId === file.id && 
                    <span className="text-green-400 ml-2 text-xs">●</span>
                  }
                </div>
              </li>
            ))}
          </ul>
        </div>
        
        {currentFile && (
          <div className="code-content-container flex-grow overflow-auto mt-2 border-t border-zinc-800">
            <div className="file-actions flex justify-between items-center px-3 py-2 bg-zinc-900 border-b border-zinc-800">
              <span className="text-sm font-mono text-gray-400">{currentFile.path}</span>
              {!readOnly && (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={toggleEditMode} 
                    className="text-xs h-7 px-2"
                  >
                    {editMode ? "View Mode" : "Edit Mode"}
                  </Button>
                  {editMode && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={saveChanges}
                      disabled={isSaving}
                      className="text-xs h-7 px-2 flex items-center gap-1"
                    >
                      <Save className="h-3.5 w-3.5" />
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            <div className="code-container p-0 h-full">
              {editMode ? (
                <Textarea
                  value={editedContent}
                  onChange={handleContentChange}
                  className="font-mono text-sm w-full h-full min-h-[300px] resize-none border-0 rounded-none bg-zinc-900 text-gray-200 p-4"
                  spellCheck="false"
                  style={{
                    whiteSpace: 'pre',
                    overflowWrap: 'normal',
                    overflowX: 'auto',
                    tabSize: 2
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
          </div>
        )}
      </div>
    </div>
  );
};

export default FileNavigator;
