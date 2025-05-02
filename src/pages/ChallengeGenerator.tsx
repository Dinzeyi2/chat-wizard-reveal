
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

interface ProjectType {
  id: string;
  name: string;
  description: string;
  icon: string;
  difficulty: SkillLevel;
}

const ChallengeGenerator = () => {
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('beginner');
  const navigate = useNavigate();
  
  const projectTypes: ProjectType[] = [
    {
      id: 'twitterClone',
      name: 'Twitter Clone',
      description: 'A social media platform with tweet functionality',
      icon: '🐦',
      difficulty: 'beginner'
    },
    {
      id: 'ecommerceStore',
      name: 'E-commerce Store',
      description: 'An online shop with product listings and shopping cart',
      icon: '🛒',
      difficulty: 'intermediate'
    },
    {
      id: 'taskManager',
      name: 'Task Manager',
      description: 'A productivity app for managing tasks and projects',
      icon: '✅',
      difficulty: 'advanced'
    }
  ];

  const { isLoading: isGenerating, refetch: generateProject } = useQuery({
    queryKey: ['generateChallenge'],
    queryFn: async ({ queryKey }) => {
      const [_, projectType, userSkillLevel] = queryKey;
      
      const { data, error } = await supabase.functions.invoke('generate-challenge', {
        body: { 
          prompt: `Generate a ${projectType} application with ${userSkillLevel} level challenges`, 
          completionLevel: userSkillLevel,
          challengeType: 'frontend'
        }
      });
      
      if (error) {
        console.error('Error generating project:', error);
        throw new Error('Failed to generate project');
      }
      
      if (data?.projectId) {
        navigate(`/challenge/${data.projectId}`);
      }
      
      return data;
    },
    enabled: false
  });

  const handleGenerateProject = async (projectType: string) => {
    try {
      toast({
        title: "Generating project...",
        description: "Please wait while we create your coding challenge."
      });

      await generateProject({
        queryKey: ['generateChallenge', projectType, skillLevel]
      });
    } catch (err) {
      console.error('Error generating project:', err);
      toast({
        title: "Failed to generate project",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">CodeCraft Challenge</h1>
        <p className="text-gray-600">Learn by building real applications with strategic challenges</p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Select your skill level:</h2>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button 
            variant={skillLevel === 'beginner' ? 'default' : 'outline'} 
            onClick={() => setSkillLevel('beginner')}
          >
            Beginner
          </Button>
          <Button 
            variant={skillLevel === 'intermediate' ? 'default' : 'outline'} 
            onClick={() => setSkillLevel('intermediate')}
          >
            Intermediate
          </Button>
          <Button 
            variant={skillLevel === 'advanced' ? 'default' : 'outline'} 
            onClick={() => setSkillLevel('advanced')}
          >
            Advanced
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projectTypes.map(project => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleGenerateProject(project.id)}>
            <CardHeader>
              <div className="text-4xl mb-2">{project.icon}</div>
              <CardTitle>{project.name}</CardTitle>
              <CardDescription>{project.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${
                project.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                project.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {project.difficulty.charAt(0).toUpperCase() + project.difficulty.slice(1)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isGenerating && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-lg font-medium">Generating your challenge...</p>
              <p className="text-sm text-gray-500">This may take a moment</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengeGenerator;
