
import React, { useState, useEffect } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { ChevronRight, ArrowLeft, File, FileText, FolderOpen, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileNavigatorProps {
  files: Array<{id: string, name: string, path: string, content: string, language?: string}>;
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
  const [error, setError] = useState<string | null>(null);
  const [currentFiles, setCurrentFiles] = useState<Array<{name: string, type: string, id?: string}>>([]);

  // Initialize expanded folders based on file paths
  useEffect(() => {
    if (files.length > 0) {
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
      
      // Group files by directory for the current path view
      buildFileTree();
    }
  }, [files]);

  useEffect(() => {
    // Update current files when path changes
    buildFileTree();
  }, [currentPath, files]);

  useEffect(() => {
    // Update selected file content
    if (selectedFileId) {
      const selectedFile = files.find(f => f.id === selectedFileId);
      if (selectedFile) {
        setFileContent(selectedFile.content);
        
        // Navigate to the directory of the selected file
        const pathParts = selectedFile.path.split('/');
        pathParts.pop(); // Remove filename
        const directoryPath = pathParts.join('/');
        if (directoryPath && currentPath !== directoryPath) {
          setCurrentPath(directoryPath);
        }
      }
    }
  }, [selectedFileId, files]);

  const buildFileTree = () => {
    console.log("Building file tree for path:", currentPath);
    
    // Group files by directory
    const rootFiles: Array<{name: string, type: string, id?: string}> = [];
    const directories = new Set<string>();
    
    files.forEach(file => {
      const pathWithoutLeadingSlash = file.path.startsWith('/') ? file.path.substring(1) : file.path;
      const normalizedCurrentPath = currentPath === '/' ? '' : currentPath;
      
      if (pathWithoutLeadingSlash === normalizedCurrentPath) {
        // This is a file in the current directory
        rootFiles.push({
          name: file.name || file.path.split('/').pop() || '',
          type: 'file',
          id: file.id
        });
      } else if (pathWithoutLeadingSlash.startsWith(normalizedCurrentPath)) {
        // This is a file or directory under the current directory
        const remainingPath = pathWithoutLeadingSlash.substring(normalizedCurrentPath.length);
        const pathParts = remainingPath.split('/').filter(Boolean);
        
        if (pathParts.length === 1) {
          // Direct child file
          rootFiles.push({
            name: pathParts[0],
            type: 'file',
            id: file.id
          });
        } else if (pathParts.length > 1) {
          // Subdirectory
          directories.add(pathParts[0]);
        }
      }
    });
    
    // Add directories to the file list
    const directoriesArray = Array.from(directories).map(dir => ({
      name: dir,
      type: 'directory'
    }));
    
    // Combine directories and files, sort directories first
    const combinedFiles = [
      ...directoriesArray.sort((a, b) => a.name.localeCompare(b.name)),
      ...rootFiles.sort((a, b) => a.name.localeCompare(b.name))
    ];
    
    console.log("Current files for path:", currentPath, combinedFiles);
    setCurrentFiles(combinedFiles);
  };

  const handleFileClick = (file: {name: string, type: string, id?: string}) => {
    console.log("File clicked:", file);
    
    if (file.type === 'directory') {
      // Navigate to directory
      const newPath = currentPath === '/' 
        ? `/${file.name}`
        : `${currentPath}/${file.name}`;
      console.log("Navigating to:", newPath);
      setCurrentPath(newPath);
      setLoading(false);
    } else if (file.id) {
      // Load file content from the parent component
      onFileSelect(file.id);
    }
  };

  const navigateUp = () => {
    if (currentPath === '/') return;
    
    const pathParts = currentPath.split('/').filter(Boolean);
    pathParts.pop();
    const newPath = pathParts.length === 0 ? '/' : `/${pathParts.join('/')}`;
    console.log("Navigating up to:", newPath);
    setCurrentPath(newPath);
  };

  // Get file icon based on file type and name
  const getFileIcon = (fileType: string, fileName: string) => {
    if (fileType === 'directory') {
      return <Folder className="h-4 w-4 mr-2" />;
    }
    
    // Determine file icon based on extension
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    switch (extension) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return <FileText className="h-4 w-4 mr-2 text-yellow-500" />;
      case 'json':
        return <FileText className="h-4 w-4 mr-2 text-orange-500" />;
      case 'html':
        return <FileText className="h-4 w-4 mr-2 text-red-500" />;
      case 'css':
      case 'scss':
        return <FileText className="h-4 w-4 mr-2 text-blue-500" />;
      case 'md':
        return <FileText className="h-4 w-4 mr-2 text-green-500" />;
      default:
        return <File className="h-4 w-4 mr-2" />;
    }
  };

  // Get language for syntax highlighting
  const getLanguageFromFilename = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
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

  const selectedFile = selectedFileId ? files.find(f => f.id === selectedFileId) : null;

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Header with current path */}
      <div className="bg-zinc-800 text-white p-2 border-b border-zinc-700">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={navigateUp}
            disabled={currentPath === '/'}
            className="text-gray-300 hover:text-white hover:bg-zinc-700 mr-2 h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="font-mono text-sm text-gray-300">
            {currentPath || '/'}
          </span>
        </div>
      </div>
      
      {/* Main container */}
      <div className="flex flex-1 overflow-hidden">
        {/* File list */}
        <div className="w-full bg-zinc-900 overflow-y-auto border-r border-zinc-800">
          {loading ? (
            <div className="p-2 text-gray-400 text-sm">Loading...</div>
          ) : error ? (
            <div className="p-2 text-red-400 text-sm">{error}</div>
          ) : (
            <ul>
              {currentFiles.map((file, index) => (
                <li 
                  key={index}
                  data-testid={`file-item-${file.name}`}
                  className={`px-2 py-1.5 hover:bg-zinc-800 cursor-pointer flex items-center text-sm ${
                    selectedFile && selectedFile.path.endsWith(file.name) ? 'bg-zinc-800 text-blue-400' : 'text-gray-300'
                  }`}
                  onClick={() => handleFileClick(file)}
                >
                  {getFileIcon(file.type, file.name)}
                  <span>{file.name}</span>
                </li>
              ))}
              {currentFiles.length === 0 && (
                <li className="p-2 text-gray-500 text-sm">No files found</li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileNavigator;
