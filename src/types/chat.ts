
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: {
    projectId?: string;
    challengeInfo?: ChallengeInfo;
    [key: string]: any;
  };
}

export interface ChallengeInfo {
  title: string;
  description: string;
  missingFeatures: string[];
  difficultyLevel: "beginner" | "intermediate" | "advanced";
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
