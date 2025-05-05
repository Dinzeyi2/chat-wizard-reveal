
import React, { useState, useEffect } from 'react';
import { File, ChevronRight, FolderIcon, ArrowUp } from 'lucide-react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Button } from '@/components/ui/button';

interface FileNavigatorProps {
  files: Array<{
    id: string;
    name: string;
    path: string;
    language: string;
    content: string;
  }>;
  onFileSelect: (fileId: string) => void;
  selectedFileId: string | null;
}

const FileNavigator: React.FC<FileNavigatorProps> = ({ 
  files, 
  onFileSelect,
  selectedFileId 
}) => {
  const [currentPath, setCurrentPath] = useState('/');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize expanded folders
  useEffect(() => {
    if (files) {
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
    }
  }, [files]);

  // Update file content when selection changes
  useEffect(() => {
    if (selectedFileId) {
      const selectedFile = files.find(file => file.id === selectedFileId);
      if (selectedFile) {
        setLoading(true);
        // Simulate loading for realistic feel
        setTimeout(() => {
          setFileContent(selectedFile.content);
          setLoading(false);
        }, 100);
      }
    }
  }, [selectedFileId, files]);

  const navigateUp = () => {
    if (currentPath === '/') return;
    
    const pathParts = currentPath.split('/').filter(Boolean);
    pathParts.pop();
    const newPath = pathParts.length === 0 ? '/' : `/${pathParts.join('/')}`;
    setCurrentPath(newPath);
  };

  const handleFileClick = (fileId: string) => {
    onFileSelect(fileId);
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  // Get file icon based on file type
  const getFileIcon = (filePath: string) => {
    const extension = filePath.split('.').pop()?.toLowerCase() || '';
    
    switch (extension) {
      case 'js':
      case 'jsx':
        return 'JS';
      case 'ts':
      case 'tsx':
        return 'TS';
      case 'json':
        return 'JSON';
      case 'html':
        return 'HTML';
      case 'css':
        return 'CSS';
      case 'md':
        return 'MD';
      default:
        return '';
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

  // Build file tree structure
  const getFileTree = () => {
    const tree: Record<string, Array<{id: string, name: string, path: string}>> = {};
    const rootFiles: Array<{id: string, name: string, path: string}> = [];
    
    files.forEach(file => {
      const parts = file.path.split('/');
      if (parts.length === 1) {
        rootFiles.push({
          id: file.id,
          name: file.path,
          path: file.path
        });
      } else {
        const folderPath = parts.slice(0, -1).join('/');
        const fileName = parts[parts.length - 1];
        
        if (!tree[folderPath]) {
          tree[folderPath] = [];
        }
        
        tree[folderPath].push({
          id: file.id,
          name: fileName,
          path: file.path
        });
      }
    });
    
    return { tree, rootFiles };
  };

  const { tree, rootFiles } = getFileTree();
  const allFolders = Object.keys(tree).sort();
  const topLevelFolders = allFolders.filter(folder => !folder.includes('/'));

  const selectedFile = files.find(file => file.id === selectedFileId);

  // Recursive function to render folders and their contents
  const renderFolder = (folderPath: string, indent: number = 0) => {
    const isExpanded = expandedFolders[folderPath] || false;
    const folderName = folderPath.split('/').pop();
    
    const childFolders = allFolders.filter(folder => {
      const parts = folder.split('/');
      return folder !== folderPath && folder.startsWith(folderPath) && parts.length === folderPath.split('/').length + 1;
    });
    
    const files = tree[folderPath] || [];
    
    return (
      <div key={folderPath} className="folder-container">
        <li 
          className="flex items-center py-1 cursor-pointer text-gray-700 hover:bg-gray-100"
          style={{ paddingLeft: `${indent * 12 + 8}px` }}
          onClick={() => toggleFolder(folderPath)}
        >
          <span className="mr-1 text-gray-500">
            {isExpanded ? (
              <ChevronRight className="h-3.5 w-3.5 transform rotate-90" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </span>
          <FolderIcon className="h-4 w-4 mr-2 text-blue-500" />
          <span className="font-medium">{folderName}/</span>
        </li>
        
        {isExpanded && (
          <div className="folder-contents">
            {childFolders.map(childFolder => renderFolder(childFolder, indent + 1))}
            
            {files.map(file => {
              const isActive = selectedFileId === file.id;
              return (
                <li 
                  key={file.id}
                  className={`py-1 cursor-pointer text-sm hover:bg-gray-100 ${
                    isActive ? 'bg-blue-100 font-medium' : 'text-gray-800'
                  }`}
                  style={{ paddingLeft: `${indent * 12 + 28}px` }}
                  onClick={() => handleFileClick(file.id)}
                >
                  <div className="flex items-center">
                    <File className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{file.name}</span>
                    <span className="ml-2 text-xs text-gray-500">
                      {getFileIcon(file.path)}
                    </span>
                  </div>
                </li>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white border rounded shadow">
      {/* Current path and navigation */}
      <div className="bg-gray-800 text-white p-3">
        <div className="flex items-center">
          <Button 
            variant="outline"
            size="sm"
            className="text-xs mr-2"
            onClick={navigateUp}
            disabled={currentPath === '/'}
          >
            <ArrowUp className="h-3.5 w-3.5 mr-1" />
            Up
          </Button>
          <div className="font-mono bg-gray-700 px-2 py-1 rounded text-sm truncate">
            {currentPath}
          </div>
        </div>
      </div>
      
      {/* Main container */}
      <div className="flex flex-1 overflow-hidden">
        {/* File list */}
        <div className="w-1/3 border-r overflow-y-auto bg-gray-50">
          <ul className="py-2">
            {topLevelFolders.map(folder => renderFolder(folder))}
            
            {rootFiles.map(file => {
              const isActive = selectedFileId === file.id;
              return (
                <li 
                  key={file.id}
                  className={`py-1 pl-3 cursor-pointer text-sm hover:bg-gray-100 ${
                    isActive ? 'bg-blue-100 font-medium' : 'text-gray-800'
                  }`}
                  onClick={() => handleFileClick(file.id)}
                >
                  <div className="flex items-center">
                    <File className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{file.name}</span>
                    <span className="ml-2 text-xs text-gray-500">
                      {getFileIcon(file.path)}
                    </span>
                  </div>
                </li>
              );
            })}
            
            {files.length === 0 && (
              <li className="p-4 text-gray-500">No files found</li>
            )}
          </ul>
        </div>
        
        {/* File content */}
        <div className="w-2/3 bg-gray-50 overflow-auto">
          {selectedFile ? (
            <div className="h-full">
              <div className="bg-gray-200 p-2 font-mono border-b flex justify-between items-center">
                <span className="text-sm truncate">{selectedFile.path}</span>
                <span className="text-xs bg-gray-300 px-2 py-0.5 rounded">
                  {getLanguageFromPath(selectedFile.path).toUpperCase()}
                </span>
              </div>
              {loading ? (
                <div className="p-4">Loading content...</div>
              ) : (
                <div className="syntax-highlighter-container">
                  <SyntaxHighlighter 
                    language={getLanguageFromPath(selectedFile.path)}
                    style={vs2015}
                    customStyle={{ margin: 0, padding: '16px', height: '100%', fontSize: '14px', lineHeight: '1.5' }}
                    showLineNumbers={true}
                  >
                    {fileContent}
                  </SyntaxHighlighter>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              Select a file to view its contents
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileNavigator;
