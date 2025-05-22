
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Activity, Code, Database, Lock, Layers, Rocket } from "lucide-react";

interface Step {
  stepNumber: number;
  name: string;
  agent: string;
  description: string;
  deliverables?: string[];
  dependencies?: string[];
  estimatedTime?: string;
  status?: 'pending' | 'current' | 'completed';
}

interface AgentOrchestrationProps {
  projectId: string | null;
  onToggleOrchestration: () => void;
  isEnabled: boolean;
}

const AgentOrchestration: React.FC<AgentOrchestrationProps> = ({
  projectId,
  onToggleOrchestration,
  isEnabled
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [totalSteps, setTotalSteps] = useState<number>(7);
  const [progress, setProgress] = useState<number>(0);
  const [pipeline, setPipeline] = useState<Step[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Get agent icon based on agent type
  const getAgentIcon = (agentType: string) => {
    switch (agentType.toLowerCase()) {
      case 'ui':
        return <Code className="h-4 w-4" />;
      case 'api':
        return <Activity className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'auth':
        return <Lock className="h-4 w-4" />;
      case 'integration':
        return <Layers className="h-4 w-4" />;
      case 'deployment':
        return <Rocket className="h-4 w-4" />;
      default:
        return <ChevronRight className="h-4 w-4" />;
    }
  };

  if (!isEnabled) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium">Agent Orchestration</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onToggleOrchestration}
            >
              Enable
            </Button>
          </div>
          <CardDescription>
            Break down complex projects into manageable steps with specialized AI agents
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">Agent Orchestration</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onToggleOrchestration}
          >
            Disable
          </Button>
        </div>
        <CardDescription>
          Building your project step-by-step with specialized AI agents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </div>
            <div className="text-sm font-medium">{Math.round(progress)}%</div>
          </div>
          
          <Progress value={progress} className="h-2" />
          
          <div className="space-y-2 mt-4">
            {pipeline.length > 0 ? (
              pipeline.map((step) => (
                <div 
                  key={step.stepNumber} 
                  className={`p-3 rounded-md border flex items-center gap-3 ${
                    step.status === 'completed' ? 'bg-green-50 border-green-200' : 
                    step.status === 'current' ? 'bg-blue-50 border-blue-200' : 
                    'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className={`rounded-full p-1.5 ${
                    step.status === 'completed' ? 'bg-green-100 text-green-700' : 
                    step.status === 'current' ? 'bg-blue-100 text-blue-700' : 
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {getAgentIcon(step.agent)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <div className="font-medium text-sm">{step.name}</div>
                      <Badge variant="outline" className="text-xs">
                        {step.agent.toUpperCase()} Agent
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{step.description}</div>
                  </div>
                </div>
              ))
            ) : isLoading ? (
              <div className="py-8 flex justify-center items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500 text-sm">
                No steps have been defined yet. Start a new project to begin the orchestration process.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentOrchestration;
