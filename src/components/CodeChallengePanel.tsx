
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Code, FileCode, HelpCircle, Sparkles } from "lucide-react";
import { ChallengeInfo } from '@/types/chat';
import { useToast } from '@/hooks/use-toast';

interface CodeChallengePanelProps {
  projectId?: string;
  projectName: string;
  challenges: {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    type: string;
    filesPaths: string[];
  }[];
  onAnalyzeCode: () => void;
  isAnalyzing: boolean;
}

const CodeChallengePanel: React.FC<CodeChallengePanelProps> = ({ 
  projectId, 
  projectName, 
  challenges,
  onAnalyzeCode,
  isAnalyzing
}) => {
  const [expandedChallenge, setExpandedChallenge] = useState<string | null>(null);
  const { toast } = useToast();
  
  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 hover:bg-red-200';
      default: return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    }
  };
  
  const getTypeIcon = (type: string) => {
    switch(type.toLowerCase()) {
      case 'implementation': return <Code className="h-4 w-4" />;
      case 'bugfix': return <HelpCircle className="h-4 w-4" />;
      case 'feature': return <Sparkles className="h-4 w-4" />;
      default: return <FileCode className="h-4 w-4" />;
    }
  };
  
  const toggleChallenge = (id: string) => {
    if (expandedChallenge === id) {
      setExpandedChallenge(null);
    } else {
      setExpandedChallenge(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center">
          <Code className="h-5 w-5 mr-2" />
          {projectName} Challenges
        </h3>
        <Button 
          variant="default"
          size="sm"
          onClick={onAnalyzeCode}
          disabled={isAnalyzing}
          className="flex items-center"
        >
          {isAnalyzing ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze My Code
            </>
          )}
        </Button>
      </div>
      
      <div className="space-y-3">
        {challenges.map((challenge) => (
          <Card key={challenge.id} className="overflow-hidden">
            <CardHeader 
              className="py-3 px-4 cursor-pointer flex flex-row items-center justify-between"
              onClick={() => toggleChallenge(challenge.id)}
            >
              <div className="flex items-center">
                <CardTitle className="text-base mr-3">{challenge.title}</CardTitle>
                <Badge className={getDifficultyColor(challenge.difficulty)}>
                  {challenge.difficulty}
                </Badge>
              </div>
              <div className="flex items-center">
                <Badge variant="outline" className="flex items-center mr-2">
                  {getTypeIcon(challenge.type)}
                  <span className="ml-1">{challenge.type}</span>
                </Badge>
                <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                  <Check className={`h-5 w-5 ${expandedChallenge === challenge.id ? 'transform rotate-180' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            
            {expandedChallenge === challenge.id && (
              <CardContent className="pb-4 pt-0">
                <CardDescription className="text-sm mb-3">{challenge.description}</CardDescription>
                {challenge.filesPaths.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-500 mb-1">Related Files:</p>
                    <div className="flex flex-wrap gap-2">
                      {challenge.filesPaths.map((path, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          <FileCode className="h-3 w-3 mr-1" />
                          {path.split('/').pop()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CodeChallengePanel;
