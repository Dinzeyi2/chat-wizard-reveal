
import React, { useState } from 'react';
import { 
  Card, 
  CardContent,
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ArrowLeft, Lightbulb, FileCode, CheckCircle2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface ChallengeDetailProps {
  challenge: {
    title: string;
    description: string;
    difficulty: string;
    hints?: string[];
  };
  onBack: () => void;
  onComplete: () => void;
  relatedFiles?: string[];
}

export const ChallengeDetail: React.FC<ChallengeDetailProps> = ({
  challenge,
  onBack,
  onComplete,
  relatedFiles = []
}) => {
  const [hintsRevealed, setHintsRevealed] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const { toast } = useToast();
  
  const revealNextHint = () => {
    if (challenge.hints && hintsRevealed < challenge.hints.length) {
      setHintsRevealed(hintsRevealed + 1);
    } else {
      toast({
        title: "No more hints available",
        description: "You've already seen all available hints for this challenge.",
      });
    }
  };
  
  const markAsCompleted = () => {
    setIsCompleted(true);
    onComplete();
    toast({
      title: "Challenge completed!",
      description: "Great job! You've successfully completed this challenge.",
      variant: "default",
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty.toLowerCase()) {
      case 'beginner': return 'text-green-500';
      case 'intermediate': return 'text-yellow-500';
      case 'advanced': return 'text-red-500';
      default: return 'text-blue-500';
    }
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-fit mb-2" 
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Challenges
        </Button>
        
        <CardTitle className="text-xl">
          {challenge.title}
          <span className={`ml-2 text-sm ${getDifficultyColor(challenge.difficulty)}`}>
            ({challenge.difficulty})
          </span>
        </CardTitle>
        
        <CardDescription>
          {challenge.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="instructions">
          <TabsList className="mb-4">
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
            <TabsTrigger value="files">Related Files</TabsTrigger>
            <TabsTrigger value="hints">Hints ({hintsRevealed}/{challenge.hints?.length || 0})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="instructions" className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Challenge Requirements:</h3>
              <p>
                This challenge requires you to implement the missing functionality described above.
                Follow these general steps:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Review the related files listed in the "Files" tab</li>
                <li>Locate the incomplete sections (marked with TODOs or comments)</li>
                <li>Implement the missing functionality according to the requirements</li>
                <li>Test your implementation thoroughly</li>
                <li>When finished, mark the challenge as complete</li>
              </ul>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-800">
              <h4 className="font-semibold flex items-center">
                <Lightbulb className="h-4 w-4 mr-2" />
                Learning Opportunity
              </h4>
              <p className="text-sm mt-1">
                This challenge is designed to help you practice real-world coding tasks.
                Don't be afraid to research solutions and experiment with different approaches!
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="files" className="space-y-4">
            {relatedFiles && relatedFiles.length > 0 ? (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Files to Modify:</h3>
                <div className="border rounded-md divide-y">
                  {relatedFiles.map((file, index) => (
                    <div key={index} className="p-3 flex justify-between items-center hover:bg-muted/50">
                      <div className="flex items-center">
                        <FileCode className="h-4 w-4 mr-2 text-blue-500" />
                        <span className="font-mono text-sm">{file}</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        Open
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No specific files are linked to this challenge.</p>
            )}
          </TabsContent>
          
          <TabsContent value="hints" className="space-y-4">
            {challenge.hints && challenge.hints.length > 0 ? (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Available Hints:</h3>
                
                {challenge.hints.slice(0, hintsRevealed).map((hint, index) => (
                  <div key={index} className="border rounded-md p-3 bg-muted/30">
                    <div className="text-sm font-medium mb-1">Hint {index + 1}:</div>
                    <p className="text-sm">{hint}</p>
                  </div>
                ))}
                
                {hintsRevealed < challenge.hints.length && (
                  <Button onClick={revealNextHint} className="w-full">
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Reveal Next Hint
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No hints available for this challenge.</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <p className="text-sm text-muted-foreground">
          {isCompleted ? 'Completed' : 'Mark as complete when you're done'}
        </p>
        <Button 
          onClick={markAsCompleted} 
          disabled={isCompleted}
          variant={isCompleted ? "outline" : "default"}
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          {isCompleted ? 'Completed' : 'Mark as Complete'}
        </Button>
      </CardFooter>
    </Card>
  );
};
