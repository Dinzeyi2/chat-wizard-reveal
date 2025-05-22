
import { ReactNode } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: {
    projectId?: string;
    isGuidance?: boolean;
    codeAnalysis?: boolean;
    codeSuggestion?: string;
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

// Add GeminiAIContext interface for the AI-assisted coding feature
export interface GeminiAIContext {
  projectId: string;
  projectName: string;
  specification: string;
  components?: Array<{
    name: string;
    description: string;
  }>;
  dependencies?: string[];
  architecture?: string;
  challenges?: string[];
  nextSteps?: string[];
}

// Add CodeAnalysis interface for Gemini AI code analysis results
export interface CodeAnalysis {
  projectId: string;
  filename: string;
  feedback: string;
  suggestedChanges?: string;
  timestamp: string;
}
