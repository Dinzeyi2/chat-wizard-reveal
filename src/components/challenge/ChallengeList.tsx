
import React from 'react';
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
import { ChallengeResult } from '@/utils/GeminiCodeGenerator';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ChallengeListProps {
  challenges: ChallengeResult['challenges'];
  projectId: string;
}

export function ChallengeList({ challenges, projectId }: ChallengeListProps) {
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

  if (!challenges || challenges.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Challenges Available</CardTitle>
          <CardDescription>
            No challenges have been generated for this project yet.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Challenges</h2>
      
      {challenges.map((challenge) => (
        <Card key={challenge.id} className="relative hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{challenge.title}</CardTitle>
              <div className="flex gap-2">
                <Badge className={getDifficultyColor(challenge.difficulty)}>
                  {challenge.difficulty}
                </Badge>
                <Badge className={getTypeColor(challenge.type)}>
                  {challenge.type}
                </Badge>
              </div>
            </div>
            <CardDescription className="line-clamp-2">{challenge.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Files to modify: {challenge.filesPaths?.length || 0}
            </p>
          </CardContent>
          <CardFooter>
            <Link to={`/challenge/${projectId}/${challenge.id}`}>
              <Button variant="outline" className="gap-2">
                Start Challenge <ChevronRight size={16} />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default ChallengeList;
