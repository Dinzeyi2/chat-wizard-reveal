
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, CircleDashed, Code } from 'lucide-react';

interface ChallengeOverviewProps {
  projectName: string;
  projectDescription: string;
  challenges: Array<{
    title: string;
    description: string;
    difficulty: string;
    completed?: boolean;
  }>;
  onChallengeSelect: (challengeIndex: number) => void;
}

export const ChallengeOverview: React.FC<ChallengeOverviewProps> = ({ 
  projectName, 
  projectDescription, 
  challenges,
  onChallengeSelect
}) => {
  // Get difficulty badge color
  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty.toLowerCase()) {
      case 'beginner':
      case 'easy':
        return 'bg-green-500 hover:bg-green-600';
      case 'intermediate':
      case 'medium':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'advanced':
      case 'hard':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl">{projectName}</CardTitle>
        <CardDescription>{projectDescription}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <h3 className="text-lg font-semibold mb-2">Learning Challenges</h3>
        <p className="text-muted-foreground mb-4">
          Complete these challenges to make the application fully functional:
        </p>
        
        <div className="space-y-3">
          {challenges.map((challenge, index) => (
            <div 
              key={index} 
              className="p-3 border rounded-md hover:bg-muted/50 transition-colors"
            >
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  {challenge.completed ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <CircleDashed className="h-5 w-5 text-gray-400" />
                  )}
                  <h4 className="font-medium">{challenge.title}</h4>
                </div>
                <Badge className={getDifficultyColor(challenge.difficulty)}>
                  {challenge.difficulty}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground ml-7 mb-2">
                {challenge.description}
              </p>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-7"
                onClick={() => onChallengeSelect(index)}
              >
                <Code className="h-4 w-4 mr-2" />
                Start Challenge
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <p className="text-sm text-muted-foreground">
          Created with CodeCraft Challenge Generator
        </p>
        <Button variant="outline" size="sm">
          Export Project
        </Button>
      </CardFooter>
    </Card>
  );
};
