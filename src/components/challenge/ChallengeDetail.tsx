
import React, { useState } from 'react';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';

interface ChallengeDetailProps {
  challenge: {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    type: string;
    filesPaths: string[];
  };
  projectId: string;
  hints?: string[];
  onComplete?: () => void;
}

export function ChallengeDetail({ 
  challenge, 
  projectId,
  hints = [],
  onComplete
}: ChallengeDetailProps) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const { toast } = useToast();

  // Get difficulty badge color
  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case 'easy':
      case 'beginner':
        return 'bg-green-500';
      case 'medium':
      case 'intermediate':
        return 'bg-yellow-500';
      case 'hard':
      case 'advanced':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  // Get type badge color
  const getTypeColor = (type: string) => {
    switch(type) {
      case 'implementation':
        return 'bg-blue-500';
      case 'bugfix':
        return 'bg-yellow-500';
      case 'feature':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleRevealHint = () => {
    if (hintsRevealed < hints.length) {
      setHintsRevealed(hintsRevealed + 1);
      toast({
        title: "Hint Revealed",
        description: "A new hint has been revealed to help you complete the challenge.",
      });
    }
  };

  const handleMarkComplete = () => {
    setIsCompleted(true);
    toast({
      title: "Challenge Completed",
      description: "Congratulations! You've completed this challenge.",
      // Removed the invalid "success" variant
    });
    
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">{challenge.title}</CardTitle>
          <div className="flex gap-2">
            <Badge className={getDifficultyColor(challenge.difficulty)}>
              {challenge.difficulty}
            </Badge>
            <Badge className={getTypeColor(challenge.type)}>
              {challenge.type}
            </Badge>
          </div>
        </div>
        <CardDescription className="text-lg mt-2">
          {challenge.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Files to Modify</h3>
          <ul className="list-disc pl-5 space-y-1">
            {challenge.filesPaths.map((file, index) => (
              <li key={index} className="text-sm text-gray-700">{file}</li>
            ))}
          </ul>
        </div>
        
        {hints.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">
              Hints ({hintsRevealed}/{hints.length})
            </h3>
            
            {hintsRevealed > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {hints.slice(0, hintsRevealed).map((hint, index) => (
                  <AccordionItem key={index} value={`hint-${index}`}>
                    <AccordionTrigger>Hint {index + 1}</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-gray-700">{hint}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <p className="text-sm text-gray-600 italic">
                No hints revealed yet. Click "Reveal Hint" if you need help.
              </p>
            )}
            
            {hintsRevealed < hints.length && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRevealHint}
                className="mt-2"
              >
                Reveal Hint
              </Button>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <p className="text-sm text-muted-foreground">
          {isCompleted ? 'Completed' : "Mark as complete when you're done"}
        </p>
        <Button 
          onClick={handleMarkComplete} 
          disabled={isCompleted}
          variant={isCompleted ? "secondary" : "default"}
        >
          {isCompleted ? 'Completed ✓' : 'Mark Complete'}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default ChallengeDetail;
