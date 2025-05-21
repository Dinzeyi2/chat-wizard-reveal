
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: {
    projectId?: string;
    [key: string]: any;
  };
}

export interface SidebarItem {
  id: string;
  name: string;
  icon: string;
  selected?: boolean;
}

export interface ActionButton {
  id: string;
  label: string;
  icon: string;
}

// Add a Json type to help with Supabase compatibility
export type Json = 
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ChatHistoryItem interface with consistent property naming
export interface ChatHistoryItem {
  id: string;
  title: string;
  last_message?: string;
  timestamp: string;
  messages?: Message[]; 
}

// Add Challenge related interfaces for better type checking
export interface ChallengeInfo {
  title: string;
  description: string;
  missingFeatures: string[];
  difficultyLevel: "beginner" | "intermediate" | "advanced";
}

// Add ChallengeResult interface to include the prompt property
export interface ChallengeResult {
  prompt: string;
  projectId: string;
  projectName: string;
  description: string;
  challenges: Array<{
    title: string;
    description: string;
    difficulty: string;
  }>;
  explanation: string;
}
