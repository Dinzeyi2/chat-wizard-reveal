
export interface ProjectComponent {
  name: string;
  description: string;
}

export interface ProjectContext {
  projectId?: string;
  projectName: string;
  description: string;
  specification: string;
  components?: ProjectComponent[];
  dependencies?: string[];
  architecture?: string;
  challenges?: string[];
  nextSteps?: string[];
  lastUpdated?: string;
}

export class ProjectContextManager {
  private static instance: ProjectContextManager;
  private contexts: Record<string, ProjectContext> = {};
  
  private constructor() {}
  
  public static getInstance(): ProjectContextManager {
    if (!ProjectContextManager.instance) {
      ProjectContextManager.instance = new ProjectContextManager();
    }
    return ProjectContextManager.instance;
  }
  
  public saveContext(projectId: string, context: ProjectContext): void {
    this.contexts[projectId] = {
      ...context,
      projectId,
      lastUpdated: new Date().toISOString()
    };
  }
  
  public getContext(projectId: string): ProjectContext | null {
    return this.contexts[projectId] || null;
  }
  
  public updateContext(projectId: string, updates: Partial<ProjectContext>): ProjectContext | null {
    if (!this.contexts[projectId]) {
      return null;
    }
    
    this.contexts[projectId] = {
      ...this.contexts[projectId],
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    
    return this.contexts[projectId];
  }
}
