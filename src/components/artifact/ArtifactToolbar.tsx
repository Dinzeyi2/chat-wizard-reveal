
import React from 'react';
import { useArtifact } from './ArtifactSystem';
import { Button } from '@/components/ui/button';
import { X, Download, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import ArtifactVision from './ArtifactVision';

interface ArtifactToolbarProps {
  onClose: () => void;
  projectId?: string | null;
}

const ArtifactToolbar: React.FC<ArtifactToolbarProps> = ({ onClose, projectId }) => {
  const { 
    artifact, 
    activeFile, 
    getActiveFileContent, 
    nextFile, 
    prevFile 
  } = useArtifact();

  const handleCopyCode = () => {
    if (activeFile) {
      const content = getActiveFileContent(activeFile.id);
      navigator.clipboard.writeText(content || '');
    }
  };

  const handleDownload = () => {
    if (!artifact) return;
    
    // Create a zip file containing all artifact files
    const filename = `${artifact.title.replace(/\s+/g, '_')}.zip`;
    alert('Download functionality would be implemented here: ' + filename);
  };

  return (
    <div className="flex justify-between items-center p-2 border-b bg-gray-50">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={prevFile}
          disabled={!artifact || artifact.files.length <= 1}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={nextFile}
          disabled={!artifact || artifact.files.length <= 1}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <span className="text-sm font-medium truncate max-w-[180px]">
          {activeFile ? activeFile.name : 'No file selected'}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Add Gemini Vision component */}
        <ArtifactVision projectId={projectId} />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyCode}
          disabled={!activeFile}
          className="h-8 w-8 p-0"
        >
          <Copy className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          disabled={!artifact}
          className="h-8 w-8 p-0"
        >
          <Download className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ArtifactToolbar;
