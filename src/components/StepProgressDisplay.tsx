
import React from 'react';
import { Button } from "@/components/ui/button";
import { CheckSquare, Square } from "lucide-react";
import { ImplementationStep } from '@/utils/StructuredAIGuide';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from '@/components/ui/use-toast';

interface StepProgressDisplayProps {
  steps: ImplementationStep[];
  currentStep: ImplementationStep | null;
  stepProgress: Record<string, any>;
  onSelectStep: (step: ImplementationStep) => void;
  onCompleteStep: (stepId: string) => void;
}

const StepProgressDisplay: React.FC<StepProgressDisplayProps> = ({
  steps,
  currentStep,
  stepProgress,
  onSelectStep,
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
  
  // Enhanced handle work on step button click
  const handleWorkOnStep = (step: ImplementationStep) => {
    // First, call the original onSelectStep function
    onSelectStep(step);
    
    // Show toast notification to indicate AI focus has changed
    toast({
      title: `Now focusing on: ${step.name}`,
      description: `The AI will help you implement this step: ${step.description}`,
      duration: 3000,
    });
    
    // Get related files for this step
    const relatedFiles = step.filePaths || [];
    
    // Get prerequisites for this step if available
    const prerequisites = step.prerequisites || [];
    
    // Get expected outcome for this step
    const expectedOutcome = step.expectedOutcome || "Completing functionality as described";
    
    // Get hints for this step
    const hints = step.hints || [];
    
    // Create a comprehensive AI message with all step details
    const aiMessage = {
      type: "focus_step",
      step: {
        id: step.id,
        name: step.name,
        description: step.description,
        difficulty: step.difficulty,
        type: step.type,
        relatedFiles: relatedFiles,
        prerequisites: prerequisites,
        expectedOutcome: expectedOutcome,
        hints: hints,
        status: getStepStatus(step.id)
      }
    };
    
    // Log all the step information for the AI to use
    console.log("AI FOCUS STEP:", JSON.stringify(aiMessage));
    
    // Simulate sending a message to the chat
    // In a real implementation, this would add a message to the chat window
    const chatMessage = {
      sender: "system",
      content: `You've selected to work on **${step.name}** (${step.type}, ${step.difficulty} level).
      
**What to implement:** ${step.description}

${relatedFiles.length > 0 ? `**Related files:** ${relatedFiles.join(', ')}` : ''}

${prerequisites.length > 0 ? `**Prerequisites:** ${prerequisites.join(', ')}` : ''}

**Expected outcome:** ${expectedOutcome}

${hints.length > 0 ? `**Hints to get started:**\n${hints.map((hint, i) => `${i+1}. ${hint}`).join('\n')}` : ''}

Let's start coding! I'll guide you through the implementation. Ask me if you have any questions.`,
      timestamp: new Date().toISOString()
    };
    
    console.log("CHAT MESSAGE:", JSON.stringify(chatMessage));
  };
  
  return (
    <div className="space-y-4 mt-4">
      <h3 className="text-lg font-medium">Implementation Steps</h3>
      <p className="text-sm text-gray-500 mb-4">
        Select a step to work on or mark your progress as you implement each feature.
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
                        <span className="text-blue-600">In progress...</span>
                      ) : (
                        <span>Not started</span>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      {status !== 'completed' && (
                        <Button
                          variant={isActive ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleWorkOnStep(step)}
                          className={`text-xs h-7 px-3 ${isActive ? 'bg-blue-600' : ''}`}
                        >
                          {isActive ? 'Currently Selected' : 'Work on This Step'}
                        </Button>
                      )}
                      
                      {isActive && status === 'in_progress' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCompleteStep(step.id)}
                          className="text-xs h-7 px-3 border-green-500 text-green-600 hover:bg-green-50"
                        >
                          Mark Complete
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
