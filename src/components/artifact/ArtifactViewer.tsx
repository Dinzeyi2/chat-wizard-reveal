
import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Code, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useArtifact } from './ArtifactSystem';
import { ArtifactPreview } from './ArtifactPreview';
import FileNavigator from './FileNavigator';

export const ArtifactViewer: React.FC = () => {
  const { currentArtifact, closeArtifact, isOpen } = useArtifact();
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [activeFile, setActiveFile] = useState<string | null>(null);

  // Set initial active file when artifact changes
  useEffect(() => {
    if (currentArtifact && currentArtifact.files.length > 0) {
      const firstFileId = currentArtifact.files[0].id;
      setActiveFile(firstFileId);
    } else {
      setActiveFile(null);
    }
    
    // Prevent scroll on body when viewer is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [currentArtifact]);

  const handleTabChange = (tab: 'code' | 'preview') => {
    setActiveTab(tab);
    if (tab === 'preview') {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
    }
  };

  const handleFileSelect = (fileId: string) => {
    setActiveFile(fileId);
  };

  if (!isOpen || !currentArtifact) {
    return null;
  }

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
          {activeTab === 'code' ? (
            <FileNavigator 
              files={currentArtifact.files} 
              onFileSelect={handleFileSelect}
              selectedFileId={activeFile}
            />
          ) : (
            <div className="preview-container h-full w-full flex-1">
              <ArtifactPreview files={currentArtifact.files} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
