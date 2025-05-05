
import React, { useState, useEffect, createContext, useContext } from 'react';
import { toast } from '@/hooks/use-toast';
import './ArtifactSystem.css';
import { ArtifactPreview } from './ArtifactPreview';
import { ArtifactViewer } from './ArtifactViewer';

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
    if (!artifact || !artifact.files || artifact.files.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot display code: No valid files found"
      });
      return;
    }
    
    // Set the artifact and open the viewer
    setCurrentArtifact(artifact);
    setIsOpen(true);
    
    // Force reflow to ensure the viewer is rendered
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  };

  const closeArtifact = () => {
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
