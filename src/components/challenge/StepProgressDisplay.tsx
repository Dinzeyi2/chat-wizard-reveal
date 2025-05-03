
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Circle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ImplementationStep } from '@/utils/StructuredAIGuide';

interface StepProgressDisplayProps {
  steps: ImplementationStep[];
  currentStepId: string | null;
  onCompleteStep: (stepId: string) => void;
}

const StepProgressDisplay: React.FC<StepProgressDisplayProps> = ({
  steps,
  currentStepId,
  onCompleteStep
}) => {
  const handleCompleteStep = (stepId: string) => {
    onCompleteStep(stepId);
    toast({
      title: "Step Completed",
      description: "Great job! Moving on to the next step."
    });
  };

  return (
    <Card className="p-4 bg-white shadow-md rounded-lg overflow-hidden">
      <h3 className="text-lg font-semibold mb-4">Implementation Steps</h3>
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div 
            key={step.id}
            className={`flex items-start p-2 rounded-md transition-colors ${
              currentStepId === step.id ? 'bg-blue-50 border border-blue-200' : 
              step.completed ? 'bg-green-50' : 'hover:bg-gray-50'
            }`}
          >
            <div className="mr-2 mt-0.5">
              {step.completed ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-gray-300" />
              )}
            </div>
            <div className="flex-1">
              <p className={`font-medium ${step.completed ? 'text-green-700' : ''}`}>
                {index + 1}. {step.title}
              </p>
              <p className="text-sm text-gray-500">{step.description}</p>
              {currentStepId === step.id && !step.completed && (
                <Button 
                  variant="default" 
                  size="sm"
                  className="mt-2"
                  onClick={() => handleCompleteStep(step.id)}
                >
                  Mark as Complete
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default StepProgressDisplay;
