
import { v4 as uuidv4 } from 'uuid';

export interface ArtifactData {
  id: string;
  code: string;
  projectContext: any;
  lastUpdated: string;
}

// In-memory storage since we can't use filesystem in the browser context
const artifactStore: Record<string, ArtifactData> = {};

export function saveArtifact(artifactId: string | null, code: string, projectContext: any): ArtifactData {
  // Generate a new ID if none provided
  const id = artifactId || uuidv4();
  
  const artifactData: ArtifactData = {
    id,
    code,
    projectContext,
    lastUpdated: new Date().toISOString()
  };
  
  // Store in memory
  artifactStore[id] = artifactData;
  return artifactData;
}

export function loadArtifact(artifactId: string): ArtifactData | null {
  try {
    if (artifactId && artifactStore[artifactId]) {
      return artifactStore[artifactId];
    }
  } catch (error) {
    console.error(`Error loading artifact ${artifactId}:`, error);
  }
  return null;
}

export function getAllArtifacts(): ArtifactData[] {
  return Object.values(artifactStore);
}
