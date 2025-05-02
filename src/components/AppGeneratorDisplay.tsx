
import React, { useState, useEffect } from 'react';
import { Message } from '@/types/chat';
import { useArtifact } from './artifact/ArtifactSystem';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Code, FileCode, Files, Info } from 'lucide-react';
import { ChallengeResult } from '@/types/chat';
import { ChallengeProjectView } from './challenge/ChallengeProjectView';

interface AppGeneratorDisplayProps {
  message: Message;
  projectId: string | null;
}

const AppGeneratorDisplay: React.FC<AppGeneratorDisplayProps> = ({ message, projectId }) => {
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { openArtifact } = useArtifact();
  const [isChallengeProject, setIsChallengeProject] = useState<boolean>(false);
  const [challengeResult, setChallengeResult] = useState<ChallengeResult | null>(null);
  
  useEffect(() => {
    const parseMessageContent = () => {
      try {
        // Check if message contains JSON data
        const jsonRegex = /```json\n([\s\S]*?)```/;
        const jsonMatch = message.content.match(jsonRegex);
        
        if (jsonMatch && jsonMatch[1]) {
          const jsonData = JSON.parse(jsonMatch[1]);
          setParsedData(jsonData);
          
          // Detect if this is a challenge project
          const isChallenge = 
            jsonData.challenges !== undefined && 
            Array.isArray(jsonData.challenges) &&
            jsonData.explanation !== undefined;
          
          setIsChallengeProject(isChallenge);
          
          if (isChallenge) {
            setChallengeResult(jsonData);
          }
        } else {
          setError("No app data found in the message");
        }
      } catch (e) {
        console.error("Error parsing message data:", e);
        setError(`Error parsing app data: ${e instanceof Error ? e.message : String(e)}`);
      }
    };
    
    parseMessageContent();
  }, [message]);

  const handleViewFiles = () => {
    if (!parsedData || !parsedData.files) {
      return;
    }
    
    const artifactFiles = parsedData.files.map((file: any) => ({
      id: file.path,
      name: file.path.split('/').pop(),
      path: file.path,
      language: file.path.split('.').pop() || 'text',
      content: file.content
    }));
    
    openArtifact({
      id: parsedData.projectId || 'generated-app',
      title: parsedData.projectName || 'Generated App',
      files: artifactFiles,
      description: parsedData.description
    });
  };
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
        <h3 className="text-red-800 font-medium flex items-center gap-2">
          <Info className="h-4 w-4" />
          Error Displaying App
        </h3>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }
  
  if (!parsedData) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 my-4 animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-2/3 mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 rounded"></div>
          <div className="h-4 bg-gray-300 rounded"></div>
          <div className="h-4 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }
  
  // If this is a challenge project, display the challenge UI
  if (isChallengeProject && challengeResult) {
    return (
      <div className="border rounded-lg shadow-sm overflow-hidden my-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-lg text-blue-900">
                {challengeResult.projectName}
              </h3>
              <p className="text-blue-700 text-sm">
                Learning Project with {challengeResult.challenges?.length || 0} Coding Challenges
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleViewFiles}>
              <Files className="h-4 w-4 mr-2" />
              View Files
            </Button>
          </div>
          
          <div className="bg-blue-100/50 border border-blue-200 rounded p-3 mb-4">
            <div className="font-medium text-blue-800 mb-1">Important Note:</div>
            <p className="text-sm text-blue-700">
              This is an intentionally incomplete application with learning challenges.
              It's designed for you to practice implementing key features as a learning exercise.
            </p>
          </div>
        </div>
        
        <ChallengeProjectView challenge={challengeResult} />
      </div>
    );
  }
  
  // Display regular app
  return (
    <div className="border rounded-lg shadow-sm overflow-hidden my-4">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg text-purple-900">
              {parsedData.projectName || 'Generated App'}
            </h3>
            <p className="text-purple-700 text-sm">
              {parsedData.files?.length || 0} files • {parsedData.description || 'No description'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleViewFiles}>
            <FileCode className="h-4 w-4 mr-2" />
            View Files
          </Button>
        </div>
      </div>
      
      <div className="border-t p-4">
        <h4 className="text-sm font-medium mb-2 flex items-center">
          <Code className="h-4 w-4 mr-1" />
          Project Structure
        </h4>
        
        <ScrollArea className="h-40">
          <div className="font-mono text-xs">
            <SyntaxHighlighter language="bash" style={vs2015} customStyle={{
              backgroundColor: 'transparent',
              padding: '0.5rem'
            }}>
              {parsedData.files?.map((file: any) => file.path).join('\n')}
            </SyntaxHighlighter>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default AppGeneratorDisplay;
