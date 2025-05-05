
import React, { useState, useEffect } from 'react';
import { ChevronRight, File, Folder, Edit, Save, TextCursor } from 'lucide-react';
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
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedContent, setEditedContent] = useState<string>('');
  
  // Get the current file
  const currentFile = files.find(file => file.id === activeFileId);

  useEffect(() => {
    // Reset edited content when active file changes
    if (currentFile) {
      setEditedContent(currentFile.content);
      setIsEditing(false);
    }
  }, [activeFileId, currentFile]);

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

  const toggleEditMode = () => {
    if (!currentFile || readOnly) return;
    setIsEditing(!isEditing);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
  };

  const handleSaveContent = () => {
    if (!currentFile || readOnly) return;
    if (onFileContentChange && activeFileId) {
      onFileContentChange(activeFileId, editedContent);
      toast({
        title: "File saved",
        description: `Changes to ${currentFile.path} have been saved.`
      });
    }
  };
  
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
      <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-3 py-2 flex justify-between items-center">
        <h4 className="text-sm font-medium text-gray-400">Files</h4>
        {currentFile && !readOnly && (
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2 text-xs"
              onClick={toggleEditMode}
            >
              {isEditing ? <TextCursor size={14} /> : <Edit size={14} />}
              {isEditing ? 'View' : 'Edit'}
            </Button>
            {isEditing && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 text-xs" 
                onClick={handleSaveContent}
              >
                <Save size={14} />
                Save
              </Button>
            )}
          </div>
        )}
      </div>
      {!isEditing ? (
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
      ) : (
        <div className="p-3">
          {currentFile && (
            <div className="flex flex-col h-full">
              <div className="mb-2 text-sm font-mono text-gray-400">
                {currentFile.path}
              </div>
              <Textarea
                value={editedContent}
                onChange={handleContentChange}
                className="flex-1 h-[calc(100vh-120px)] font-mono text-sm resize-none bg-zinc-900 text-gray-200 border-zinc-700"
                spellCheck="false"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileNavigator;
