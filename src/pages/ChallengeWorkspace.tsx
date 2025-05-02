
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import ChallengeList from '@/components/challenge/ChallengeList';
import ChallengeDetail from '@/components/challenge/ChallengeDetail';
import { toast } from '@/hooks/use-toast';
import { Json } from '@/types/chat';

interface FileStructure {
  [key: string]: string | FileStructure;
}

// Define interfaces for the app data structure
interface AppFile {
  path: string;
  content: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  type: string;
  filesPaths: string[];
  hints?: string[];
  completed?: boolean;
}

interface AppData {
  projectName: string;
  files: AppFile[];
  challenges: Challenge[];
}

const ChallengeWorkspace = () => {
  const { projectId, challengeId } = useParams<{ projectId: string, challengeId?: string }>();
  const [view, setView] = useState<'split' | 'code' | 'challenge'>('split');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');

  const { data: projectData, isLoading } = useQuery({
    queryKey: ['challengeProject', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from('app_projects')
        .select('app_data')
        .eq('id', projectId)
        .single();
        
      if (error) {
        throw error;
      }
      
      return data.app_data as AppData;
    }
  });

  useEffect(() => {
    // If a specific challenge ID is provided in the URL, find and select that challenge
    if (challengeId && projectData?.challenges) {
      const challenge = projectData.challenges.find(c => c.id === challengeId);
      if (challenge && challenge.filesPaths && challenge.filesPaths.length > 0) {
        setSelectedFile(challenge.filesPaths[0]);
      }
    }
  }, [challengeId, projectData]);

  useEffect(() => {
    // When a file is selected, fetch its content
    if (selectedFile && projectData) {
      const fileData = findFileInProject(projectData.files, selectedFile);
      if (fileData) {
        setFileContent(fileData.content);
      }
    }
  }, [selectedFile, projectData]);

  const findFileInProject = (files: AppFile[], path: string) => {
    if (!files) return null;
    return files.find(file => file.path === path);
  };

  const handleSaveFile = async () => {
    if (!selectedFile || !projectId) return;
    
    try {
      // In a real implementation, this would save to the backend
      toast({
        title: "File saved",
        description: `${selectedFile} has been saved.`
      });
    } catch (error) {
      console.error('Error saving file:', error);
      toast({
        title: "Error saving file",
        description: "There was a problem saving your changes.",
        variant: "destructive"
      });
    }
  };

  const handleCodeChange = (newCode: string) => {
    setFileContent(newCode);
  };

  const renderFileTree = (structure: FileStructure, path: string = '') => {
    if (!structure || typeof structure !== 'object') return null;
    
    return (
      <ul className="space-y-1">
        {Object.entries(structure).map(([key, value]) => {
          const currentPath = path ? `${path}/${key}` : key;
          const isFolder = typeof value === 'object';
          
          return (
            <li key={currentPath} className="pl-2">
              {isFolder ? (
                <div>
                  <div className="flex items-center text-sm">
                    <span className="mr-1">📁</span>
                    <span className="font-medium">{key}</span>
                  </div>
                  {renderFileTree(value as FileStructure, currentPath)}
                </div>
              ) : (
                <div 
                  className={`flex items-center text-sm cursor-pointer hover:bg-gray-100 rounded px-2 py-1 ${selectedFile === currentPath ? 'bg-blue-100' : ''}`}
                  onClick={() => setSelectedFile(currentPath)}
                >
                  <span className="mr-1">📄</span>
                  <span>{key}</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  const buildFileStructure = (files: AppFile[]) => {
    if (!files) return {};
    
    const structure: FileStructure = {};
    
    files.forEach(file => {
      const parts = file.path.split('/');
      let current = structure;
      
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          current[part] = file.content;
        } else {
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part] as FileStructure;
        }
      });
    });
    
    return structure;
  };

  const fileStructure = projectData?.files ? buildFileStructure(projectData.files) : {};
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold">Project not found</h2>
        <p className="mt-2 text-gray-600">The requested project could not be loaded.</p>
      </div>
    );
  }

  const currentChallenge = challengeId && projectData.challenges 
    ? projectData.challenges.find(c => c.id === challengeId)
    : projectData.challenges[0];

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{projectData.projectName || "Code Challenge"}</h1>
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={() => setView('split')}>Split View</Button>
            <Button variant="outline" size="sm" onClick={() => setView('code')}>Code Only</Button>
            <Button variant="outline" size="sm" onClick={() => setView('challenge')}>Challenge Only</Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r overflow-auto p-4 bg-gray-50">
          <h2 className="font-semibold mb-2">Project Files</h2>
          {renderFileTree(fileStructure)}
        </div>

        <div className="flex-1 overflow-auto">
          <div className={`flex h-full ${view === 'split' ? 'flex-col md:flex-row' : 'flex-col'}`}>
            {(view === 'split' || view === 'code') && (
              <div className={`${view === 'split' ? 'flex-1' : 'h-full'} border-r`}>
                <div className="p-4 border-b flex justify-between items-center">
                  <span className="font-mono text-sm">{selectedFile || 'Select a file'}</span>
                  <Button size="sm" onClick={handleSaveFile} disabled={!selectedFile}>Save</Button>
                </div>
                <div className="p-4 h-[calc(100%-64px)] overflow-auto">
                  {selectedFile ? (
                    <textarea
                      className="w-full h-full font-mono text-sm p-4 border rounded"
                      value={fileContent}
                      onChange={(e) => handleCodeChange(e.target.value)}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Select a file to edit
                    </div>
                  )}
                </div>
              </div>
            )}

            {(view === 'split' || view === 'challenge') && (
              <div className={`${view === 'split' ? 'flex-1' : 'h-full'} overflow-auto`}>
                <div className="p-4">
                  <Tabs defaultValue="current">
                    <TabsList>
                      <TabsTrigger value="current">Current Challenge</TabsTrigger>
                      <TabsTrigger value="all">All Challenges</TabsTrigger>
                    </TabsList>
                    <TabsContent value="current" className="p-4">
                      {currentChallenge ? (
                        <ChallengeDetail 
                          challenge={currentChallenge} 
                          projectId={projectId} 
                          hints={currentChallenge.hints}
                        />
                      ) : (
                        <div className="text-center p-8">
                          <p>No active challenge selected</p>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="all" className="p-4">
                      <ChallengeList 
                        challenges={projectData.challenges} 
                        projectId={projectId}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeWorkspace;
