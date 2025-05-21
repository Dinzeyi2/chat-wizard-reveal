
import { v4 as uuidv4 } from 'uuid';

// Define the interface for our artifact data
export interface ArtifactData {
  id: string;
  code: string;
  projectContext: any;
  lastUpdated: string;
}

// In-memory storage since we can't use filesystem in the browser context
const artifactStore: Record<string, ArtifactData> = {};

/**
 * Saves or updates an artifact in the store
 * @param artifactId - Optional ID of an existing artifact
 * @param code - Code content to save
 * @param projectContext - Project metadata and context
 * @returns The saved artifact data
 */
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

/**
 * Loads an artifact from the store by ID
 * @param artifactId - ID of the artifact to load
 * @returns The artifact data or null if not found
 */
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

/**
 * Returns all artifacts in the store
 * @returns Array of all artifact data
 */
export function getAllArtifacts(): ArtifactData[] {
  return Object.values(artifactStore);
}
