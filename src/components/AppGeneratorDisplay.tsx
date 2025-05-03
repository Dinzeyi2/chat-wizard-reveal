
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import StepProgressDisplay from './challenge/StepProgressDisplay';
import { StructuredAIGuide } from '@/utils/StructuredAIGuide';
import { Message } from '@/types/chat';

interface GeneratedAppData {
  projectId: string;
  projectName: string;
  description: string;
  files: any[];
  challenges: any[];
  explanation: string;
  designInfo: any;
}

interface AppGeneratorDisplayProps {
  onSendMessage?: (message: Message) => void;
  message?: Message;
  projectId?: string;
}

const AppGeneratorDisplay: React.FC<AppGeneratorDisplayProps> = ({ onSendMessage, message, projectId: externalProjectId }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [completionLevel, setCompletionLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAppData, setGeneratedAppData] = useState<GeneratedAppData | null>(null);
  const [currentChallengeId, setCurrentChallengeId] = useState<string | null>(null);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [aiGuide, setAiGuide] = useState<StructuredAIGuide | null>(null);

  const { toast } = useToast();

  // Function to handle app generation
  const handleGenerateApp = async () => {
    if (!prompt) {
      toast({
        title: "Error",
        description: "Please enter a prompt to generate the application.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.functions.invoke('generate-app', {
        body: {
          prompt: prompt,
          completionLevel
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate application');
      }

      if (!data) {
        throw new Error('No data returned from application generator');
      }

      console.log('App generated successfully:', data);
      setGeneratedAppData(data);
      
      // Create AI Guide instance
      const projectData = {
        name: data.projectName,
        description: data.description,
        stack: 'React',
        challenges: data.challenges,
        projectName: data.projectName
      };
      
      const guide = new StructuredAIGuide(projectData);
      setAiGuide(guide);
      
      // Set initial challenge
      if (data.challenges && data.challenges.length > 0) {
        setCurrentChallengeId(data.challenges[0].id);
      }
      
      // Set initial step (automatically select the first step)
      const steps = guide.getImplementationSteps();
      if (steps && steps.length > 0) {
        setCurrentStepId(steps[0].id);
        
        // Send the first task message
        setTimeout(() => {
          const firstTaskMessage = guide.generateFirstTaskMessage();
          sendAiMessage(firstTaskMessage);
        }, 1000);
      }
    } catch (err: any) {
      console.error('Error generating application:', err);
      setError(err.message || 'Failed to generate application');
      toast({
        title: "Error",
        description: err.message || "Failed to generate application.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle prompt change
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  // Function to handle completion level change
  const handleCompletionLevelChange = (value: "beginner" | "intermediate" | "advanced") => {
    setCompletionLevel(value);
  };

  // Function to handle step completion
  const handleCompleteStep = (stepId: string) => {
    if (!aiGuide) return;
    
    const nextStep = aiGuide.completeStep(stepId);
    
    if (nextStep) {
      setCurrentStepId(nextStep.id);
      
      // Send a message about the next step
      const nextStepMessage = `
## Great job! Now let's move on to: ${nextStep.title}

${nextStep.description}

**What you need to do:**
${nextStep.taskInstructions}

**Key concepts to understand:**
${nextStep.concepts?.join(', ') || 'N/A'}

**Relevant files:** 
${nextStep.filesPaths.join('\n')}

**Estimated time:** ${nextStep.expectedDuration}

When you've completed this task, mark it as complete and we'll continue to the next step.
      `;
      
      sendAiMessage(nextStepMessage);
    } else {
      // All steps completed
      sendAiMessage(`
## 🎉 Congratulations!

You've completed all the implementation steps for this challenge. The application now has all the features implemented.

Would you like to:
1. Review the code for any improvements?
2. Add additional features?
3. Start a new project?

Let me know how you'd like to proceed!
      `);
    }
  };
  
  // Function to send AI message
  const sendAiMessage = (message: string) => {
    // This function sends a message from the AI to the chat
    console.log('AI Message:', message);
    
    // If using a chat system with a messages state, you might do something like:
    if (onSendMessage) {
      onSendMessage({
        id: `msg-${Date.now()}`,
        content: message,
        role: 'assistant',
        timestamp: new Date()
      });
    }
  };

  return (
    <div className="flex flex-col bg-slate-50 rounded-lg shadow-sm p-4 gap-4">
      {/* Prompt Input */}
      <div className="space-y-2">
        <label htmlFor="prompt" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed">
          Describe the application you want to generate:
        </label>
        <Textarea
          id="prompt"
          placeholder="A social media app for sharing photos and videos"
          className="resize-none"
          value={prompt}
          onChange={handlePromptChange}
        />
      </div>

      {/* Completion Level Select */}
      <div className="space-y-2">
        <label htmlFor="completionLevel" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed">
          Completion Level:
        </label>
        <Select value={completionLevel} onValueChange={handleCompletionLevelChange}>
          <SelectTrigger id="completionLevel">
            <SelectValue placeholder="Select completion level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">
          Choose the desired level of completion for the generated application.
        </p>
      </div>

      {/* Generate Button */}
      <Button onClick={handleGenerateApp} disabled={isLoading}>
        {isLoading ? (
          <>
            Generating...
            <Progress className="w-5 h-5 ml-2" value={null} />
          </>
        ) : (
          "Generate Application"
        )}
      </Button>

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-sm">Error: {error}</p>
      )}
      
      {/* Show generated app data */}
      {generatedAppData && (
        <div className="space-y-4">
          <div className="border-t pt-4">
            <h2 className="text-xl font-semibold">{generatedAppData.projectName}</h2>
            <p className="text-gray-600">{generatedAppData.description}</p>
            
            {/* Challenges section */}
            <div className="mt-4">
              <h3 className="text-lg font-medium">Learning Challenges</h3>
              <div className="grid gap-3 mt-2">
                {generatedAppData.challenges.map((challenge) => (
                  <div key={challenge.id} className="p-3 bg-white rounded-md border">
                    <h4 className="font-medium">{challenge.title}</h4>
                    <p className="text-sm text-gray-600">{challenge.description}</p>
                    <div className="text-xs text-gray-500 mt-1">
                      Difficulty: {challenge.difficulty} | Type: {challenge.type}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Implementation Steps section */}
            {aiGuide && (
              <div className="mt-4">
                <StepProgressDisplay 
                  steps={aiGuide.getImplementationSteps()}
                  currentStepId={currentStepId}
                  onCompleteStep={handleCompleteStep}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppGeneratorDisplay;
