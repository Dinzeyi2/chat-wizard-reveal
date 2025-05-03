
import React from 'react';
import { Button } from "@/components/ui/button";
import { CheckSquare, ArrowRight } from "lucide-react";
import { ImplementationStep } from '@/utils/StructuredAIGuide';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from '@/components/ui/use-toast';

interface StepProgressDisplayProps {
  steps: ImplementationStep[];
  currentStep: ImplementationStep | null;
  stepProgress: Record<string, any>;
  onCompleteStep: (stepId: string) => void;
}

const StepProgressDisplay: React.FC<StepProgressDisplayProps> = ({
  steps,
  currentStep,
  stepProgress,
  onCompleteStep
}) => {
  const { toast } = useToast();
  
  // Helper function to get step status
  const getStepStatus = (stepId: string) => {
    if (!stepProgress[stepId]) return 'not_started';
    return stepProgress[stepId].status;
  };
  
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-blue-100 text-blue-800';
      case 'advanced':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'frontend':
        return '🖌️';
      case 'backend':
        return '🔧';
      case 'integration':
        return '🔄';
      case 'testing':
        return '🧪';
      case 'design':
        return '✏️';
      default:
        return '📝';
    }
  };

  // File validation function for integration
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    // Continue with file processing...
    console.log("File validated:", file.name);
  };
  
  // Handle complete step
  const handleCompleteStep = (step: ImplementationStep) => {
    onCompleteStep(step.id);
    
    // Show toast notification to indicate task completion
    toast({
      title: `Task completed: ${step.name}`,
      description: `The AI will now provide your next task to implement`,
      duration: 3000,
    });
    
    // Create a comprehensive AI message with task completion
    const aiMessage = {
      type: "complete_step",
      step: {
        id: step.id,
        name: step.name
      }
    };
    
    // Log the task completion for the AI to use
    console.log("AI TASK COMPLETED:", JSON.stringify(aiMessage));
    
    // Simulate sending a message to the chat
    const chatMessage = {
      sender: "system",
      content: `Great job completing **${step.name}**! Let me check your implementation and provide the next task.`,
      timestamp: new Date().toISOString()
    };
    
    console.log("CHAT MESSAGE:", JSON.stringify(chatMessage));
  };
  
  return (
    <div className="space-y-4 mt-4">
      <h3 className="text-lg font-medium">Implementation Progress</h3>
      <p className="text-sm text-gray-500 mb-4">
        The AI is guiding you through implementing this project step by step.
      </p>
      
      <div className="space-y-3">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const isActive = currentStep?.id === step.id;
          
          return (
            <Card 
              key={step.id}
              className={`p-4 border ${isActive ? 'border-blue-300 bg-blue-50' : 'hover:border-gray-300'} 
                ${status === 'completed' ? 'bg-gray-50' : ''} transition-colors`}
            >
              <div className="flex items-start">
                <div 
                  className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full 
                    ${status === 'completed' 
                      ? 'bg-green-100 text-green-700' 
                      : isActive 
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'}`}
                >
                  {status === 'completed' ? (
                    <CheckSquare className="h-5 w-5" />
                  ) : (
                    <div className="font-medium">{index + 1}</div>
                  )}
                </div>
                
                <div className="ml-3 flex-grow">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-base">{step.name}</h4>
                    <div className="flex space-x-2">
                      {step.difficulty && (
                        <Badge variant="outline" className={`text-xs ${getDifficultyColor(step.difficulty)}`}>
                          {step.difficulty}
                        </Badge>
                      )}
                      {step.type && (
                        <Badge variant="outline" className="text-xs">
                          {getTypeIcon(step.type)} {step.type}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                  
                  <div className="flex justify-between items-center mt-3">
                    <div className="text-xs text-gray-500">
                      {status === 'completed' ? (
                        <span className="text-green-600">✓ Completed</span>
                      ) : status === 'in_progress' ? (
                        <span className="text-blue-600">Current task assigned by AI</span>
                      ) : (
                        <span>Upcoming task</span>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      {isActive && status === 'in_progress' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCompleteStep(step)}
                          className="text-xs h-7 px-3 border-green-500 text-green-600 hover:bg-green-50"
                        >
                          I've completed this <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      
      {/* Hidden file input for demonstration purposes */}
      <input 
        type="file"
        id="file-upload"
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default StepProgressDisplay;
