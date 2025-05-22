import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { geminiAIService } from '@/utils/GeminiAIService';
import { contentIncludes, getContentAsString } from '@/utils/contentUtils';
import { useGeminiCode } from '@/hooks/use-gemini-code';
import { useUiScraper } from '@/hooks/use-ui-scraper';
import ChatWindow from '@/components/ChatWindow';
import CodeEditor from '@/components/challenge/CodeEditor';
import FileExplorer from '@/components/challenge/FileExplorer';
import ProjectHeader from '@/components/challenge/ProjectHeader';
import ChallengeList from '@/components/challenge/ChallengeList';
import { supabase } from '@/integrations/supabase/client';

// Updated message handling for errors
function enhanceErrorMessage(message: string): string {
  // Check if this is a Gemini API error
  if (message.includes("Gemini API key not configured") || message.includes("Failed to access Gemini AI service")) {
    return `I'm sorry, but I encountered an error while processing your request: Gemini API key not configured.
Please contact support or check your environment settings.
If you were trying to generate an app, this might be due to limits with our AI model or connectivity issues. You can try:
- Using a shorter, more focused prompt (e.g., "Create a simple Twitter clone with basic tweet functionality")
- Breaking down your request into smaller parts
- Trying again in a few minutes`;
  }
  
  return message;
}

export default function IndexPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingApp, setIsGeneratingApp] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [projectContext, setProjectContext] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [lastPromptText, setLastPromptText] = useState<string>('');
  const [messageCallout, setMessageCallout] = useState<any>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentChallenge, setCurrentChallenge] = useState<any>(null);
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([]);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [isModifyingApp, setIsModifyingApp] = useState(false);
  const [modificationPrompt, setModificationPrompt] = useState('');
  const [showModifyPrompt, setShowModifyPrompt] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  
  const { generateChallenge } = useGeminiCode({
    onSuccess: (data) => {
      console.log("Challenge generated:", data);
    },
    onError: (error) => {
      console.error("Error generating challenge:", error);
    }
  });
  
  const { generateCodeFromPrompt } = useUiScraper();
  
  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Load project from URL if projectId is present
  useEffect(() => {
    const { projectId } = router.query;
    
    if (projectId && typeof projectId === 'string' && projectId !== currentProjectId) {
      loadProject(projectId);
    }
  }, [router.query]);
  
  // Load project data from Supabase
  const loadProject = async (projectId: string) => {
    try {
      setIsLoadingProject(true);
      
      const { data, error } = await supabase
        .from('app_projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        throw new Error('Project not found');
      }
      
      // Set project context from app_data
      const appData = data.app_data;
      
      setProjectContext({
        projectName: appData.projectName,
        description: appData.description,
        files: appData.files || [],
        challenges: appData.challenges || []
      });
      
      setCurrentProjectId(projectId);
      
      // Select first file by default
      if (appData.files && appData.files.length > 0) {
        setSelectedFile(appData.files[0].path);
        setFileContent(appData.files[0].content);
      }
      
      // Add welcome message
      const welcomeMessage = {
        role: 'assistant',
        content: `Welcome to your project: **${appData.projectName}**!\n\n${appData.description}\n\nI've loaded your project with ${appData.files?.length || 0} files and ${appData.challenges?.length || 0} challenges. You can explore the files in the sidebar and work on the challenges.`,
        timestamp: new Date().toISOString()
      };
      
      setMessages([welcomeMessage]);
      
      // Switch to project tab
      setActiveTab('project');
      
    } catch (error: any) {
      console.error('Error loading project:', error);
      toast({
        title: 'Error loading project',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoadingProject(false);
    }
  };
  
  // Handle file selection
  const handleFileSelect = (filePath: string) => {
    if (!projectContext) return;
    
    const file = projectContext.files.find((f: any) => f.path === filePath);
    
    if (file) {
      setSelectedFile(filePath);
      setFileContent(file.content);
    }
  };
  
  // Handle file content change
  const handleFileContentChange = (newContent: string) => {
    setFileContent(newContent);
    
    // Update the file in project context
    if (selectedFile && projectContext) {
      const updatedFiles = projectContext.files.map((file: any) => {
        if (file.path === selectedFile) {
          return { ...file, content: newContent };
        }
        return file;
      });
      
      setProjectContext({ ...projectContext, files: updatedFiles });
    }
  };
  
  // Handle challenge selection
  const handleChallengeSelect = (challenge: any) => {
    setCurrentChallenge(challenge);
    
    // If the challenge has associated files, select the first one
    if (challenge.filesPaths && challenge.filesPaths.length > 0) {
      handleFileSelect(challenge.filesPaths[0]);
    }
  };
  
  // Mark challenge as completed
  const handleChallengeComplete = (challengeId: string) => {
    if (completedChallenges.includes(challengeId)) return;
    
    setCompletedChallenges([...completedChallenges, challengeId]);
    
    toast({
      title: 'Challenge completed!',
      description: 'Great job! You\'ve completed this challenge.',
    });
    
    // Find the next challenge
    if (projectContext && projectContext.challenges) {
      const currentIndex = projectContext.challenges.findIndex((c: any) => c.id === challengeId);
      if (currentIndex >= 0 && currentIndex < projectContext.challenges.length - 1) {
        const nextChallenge = projectContext.challenges[currentIndex + 1];
        
        // Add a message about the next challenge
        const nextChallengeMessage = {
          role: 'assistant',
          content: `🎉 **Challenge completed!**\n\nReady for the next one? Let's tackle: **${nextChallenge.title}**\n\n${nextChallenge.description}`,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prevMessages => [...prevMessages, nextChallengeMessage]);
        
        // Select the next challenge
        handleChallengeSelect(nextChallenge);
      } else if (currentIndex === projectContext.challenges.length - 1) {
        // All challenges completed
        const completionMessage = {
          role: 'assistant',
          content: `🎉 **Congratulations!** You've completed all the challenges for this project!\n\nFeel free to continue exploring and enhancing the code, or you can start a new project.`,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prevMessages => [...prevMessages, completionMessage]);
      }
    }
  };
  
  // Handle app modification
  const handleModifyApp = async () => {
    if (!currentProjectId || !modificationPrompt.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a modification prompt',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsModifyingApp(true);
      
      // Call the modify-app function
      const { data, error } = await supabase.functions.invoke('modify-app', {
        body: {
          prompt: modificationPrompt,
          projectId: currentProjectId
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (!data) {
        throw new Error('No response from modification service');
      }
      
      // Load the modified project
      await loadProject(currentProjectId);
      
      // Add a message about the modification
      const modificationMessage = {
        role: 'assistant',
        content: `✅ **App Modified Successfully!**\n\n${data.summary || 'Your requested changes have been applied to the application.'}`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prevMessages => [...prevMessages, modificationMessage]);
      
      // Reset the modification prompt
      setModificationPrompt('');
      setShowModifyPrompt(false);
      
    } catch (error: any) {
      console.error('Error modifying app:', error);
      toast({
        title: 'Error modifying app',
        description: error.message,
        variant: 'destructive'
      });
      
      // Add error message
      const errorMessage = {
        role: 'assistant',
        content: `❌ **Error Modifying App**\n\n${error.message}`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsModifyingApp(false);
    }
  };

  const handleSendMessage = async (newMessage: string) => {
    try {
      if (!newMessage.trim()) return;
      
      // Add user message to chat
      const userMessage = {
        role: 'user',
        content: newMessage,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prevMessages => [...prevMessages, userMessage]);
      setInputValue('');
      setIsLoading(true);
      
      // Clear any previous message callout
      setMessageCallout(null);
      
      // Update message processing with enhanced error handling
      if (contentIncludes(newMessage, 'create') || 
          contentIncludes(newMessage, 'generate') || 
          contentIncludes(newMessage, 'make me')) {
        try {
          setLastPromptText(getContentAsString(newMessage));
          setIsGeneratingApp(true);
          
          setTimeout(() => {
            // Enable mocked responses for development if needed
            geminiAIService.enableMockedResponse(true);
          }, 100);
          
          const result = await geminiAIService.initializeProject(getContentAsString(newMessage), "App");
          
          if (result) {
            // Set project context
            setProjectContext(result.projectContext);
            setCurrentProjectId(result.projectId);
            
            // Select first file by default
            if (result.projectContext.files && result.projectContext.files.length > 0) {
              setSelectedFile(result.projectContext.files[0].path);
              setFileContent(result.projectContext.files[0].content);
            }
            
            // Add assistant message
            const assistantMessage = {
              role: 'assistant',
              content: result.assistantMessage,
              timestamp: new Date().toISOString()
            };
            
            setMessages(prevMessages => [...prevMessages, assistantMessage]);
            
            // Switch to project tab
            setActiveTab('project');
            
            // Update URL with project ID
            router.push({
              pathname: router.pathname,
              query: { projectId: result.projectId }
            }, undefined, { shallow: true });
          }
        } catch (error: any) {
          console.error("App generation attempt failed:", error);
          
          // Send an assistant message with the enhanced error message
          const errorMessage = enhanceErrorMessage(error.message || "Unknown error generating app");
          
          // Add retry logic
          let retries = 0;
          const maxRetries = 2;
          const waitTime = 1000;
          
          while (retries < maxRetries) {
            console.error(`Error initializing project: ${error}`);
            setMessageCallout({
              type: "error",
              title: "Error generating app:",
              message: `${error.message}. Try using a simpler prompt or breaking down your request into smaller parts.`,
              actionLabel: "Try Again with Simpler Prompt"
            });
            
            retries++;
            if (retries < maxRetries) {
              console.info(`Waiting ${waitTime}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, waitTime * retries));
              
              try {
                // Enable mocked responses for development
                geminiAIService.enableMockedResponse(true);
                const result = await geminiAIService.initializeProject(getContentAsString(newMessage), "App");
                
                // If successful on retry, handle the result
                if (result) {
                  // Set project context
                  setProjectContext(result.projectContext);
                  setCurrentProjectId(result.projectId);
                  
                  // Select first file by default
                  if (result.projectContext.files && result.projectContext.files.length > 0) {
                    setSelectedFile(result.projectContext.files[0].path);
                    setFileContent(result.projectContext.files[0].content);
                  }
                  
                  // Add assistant message
                  const assistantMessage = {
                    role: 'assistant',
                    content: result.assistantMessage,
                    timestamp: new Date().toISOString()
                  };
                  
                  setMessages(prevMessages => [...prevMessages, assistantMessage]);
                  
                  // Switch to project tab
                  setActiveTab('project');
                  
                  // Update URL with project ID
                  router.push({
                    pathname: router.pathname,
                    query: { projectId: result.projectId }
                  }, undefined, { shallow: true });
                  
                  break;
                }
              } catch (retryError: any) {
                console.error(`Retry ${retries} failed:`, retryError);
                error = retryError;
              }
            }
          }
          
          // If all retries failed, send the final error message
          const assistantMessage = {
            role: "assistant",
            content: errorMessage,
            timestamp: new Date().toISOString()
          };
          
          setMessages(prevMessages => [...prevMessages, assistantMessage]);
        } finally {
          setIsGeneratingApp(false);
        }
        return;
      }
      
      // Handle UI component generation
      if (contentIncludes(newMessage, 'ui component') || 
          contentIncludes(newMessage, 'create component') || 
          contentIncludes(newMessage, 'design component')) {
        try {
          const result = await generateCodeFromPrompt(getContentAsString(newMessage));
          
          if (result && result.success) {
            const assistantMessage = {
              role: 'assistant',
              content: `Here's the UI component I've created for you:\n\n\`\`\`jsx\n${result.result?.code.frontend}\n\`\`\`\n\n${result.result?.explanation || ''}`,
              timestamp: new Date().toISOString()
            };
            
            setMessages(prevMessages => [...prevMessages, assistantMessage]);
          } else {
            throw new Error(result?.error || 'Failed to generate UI component');
          }
        } catch (error: any) {
          console.error('Error generating UI component:', error);
          
          const assistantMessage = {
            role: 'assistant',
            content: `I'm sorry, I couldn't generate that UI component. ${error.message}`,
            timestamp: new Date().toISOString()
          };
          
          setMessages(prevMessages => [...prevMessages, assistantMessage]);
        }
        setIsLoading(false);
        return;
      }
      
      // Handle coding challenge generation
      if (contentIncludes(newMessage, 'coding challenge') || 
          contentIncludes(newMessage, 'code challenge') || 
          contentIncludes(newMessage, 'programming challenge')) {
        try {
          const result = await generateChallenge(getContentAsString(newMessage));
          
          if (result && result.success) {
            const assistantMessage = {
              role: 'assistant',
              content: `I've created a coding challenge for you:\n\n**${result.projectName}**\n\n${result.challenges.map((c: any, i: number) => `${i+1}. **${c.title}**: ${c.description}`).join('\n\n')}`,
              timestamp: new Date().toISOString()
            };
            
            setMessages(prevMessages => [...prevMessages, assistantMessage]);
          } else {
            throw new Error('Failed to generate coding challenge');
          }
        } catch (error: any) {
          console.error('Error generating coding challenge:', error);
          
          const assistantMessage = {
            role: 'assistant',
            content: `I'm sorry, I couldn't generate that coding challenge. ${error.message}`,
            timestamp: new Date().toISOString()
          };
          
          setMessages(prevMessages => [...prevMessages, assistantMessage]);
        }
        setIsLoading(false);
        return;
      }
      
      // Handle project-related commands when in project mode
      if (projectContext && currentProjectId) {
        // Handle challenge completion
        if (contentIncludes(newMessage, 'completed') || 
            contentIncludes(newMessage, 'finished') || 
            contentIncludes(newMessage, 'done with challenge')) {
          if (currentChallenge) {
            handleChallengeComplete(currentChallenge.id);
            setIsLoading(false);
            return;
          }
        }
        
        // Handle app modification request
        if (contentIncludes(newMessage, 'modify') || 
            contentIncludes(newMessage, 'change') || 
            contentIncludes(newMessage, 'update app')) {
          setShowModifyPrompt(true);
          setModificationPrompt(getContentAsString(newMessage));
          
          const assistantMessage = {
            role: 'assistant',
            content: `I'll help you modify the app. Please confirm your modification request in the form that appeared.`,
            timestamp: new Date().toISOString()
          };
          
          setMessages(prevMessages => [...prevMessages, assistantMessage]);
          setIsLoading(false);
          return;
        }
      }
      
      // Default response for other messages
      const assistantMessage = {
        role: 'assistant',
        content: `I'm here to help you build and learn! You can ask me to:\n\n- Create a new app or project\n- Generate UI components\n- Create coding challenges\n- Help with your current project\n\nWhat would you like to do?`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
      setIsLoading(false);
    } catch (error: any) {
      console.error("Error in handleSendMessage:", error);
      
      // Enhanced error handling for the overall function
      const errorMessage = enhanceErrorMessage(error.message || "An error occurred while processing your message");
      
      setMessages(prevMessages => [
        ...prevMessages,
        {
          role: "assistant",
          content: errorMessage,
          timestamp: new Date().toISOString()
        }
      ]);
      
      setMessageCallout({
        type: "error",
        title: "Error",
        message: errorMessage
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="project" disabled={!projectContext}>Project</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="mt-4">
          <Card className="w-full h-[80vh] flex flex-col">
            <ChatWindow 
              messages={messages}
              isLoading={isLoading || isGeneratingApp}
              onSendMessage={handleSendMessage}
              inputValue={inputValue}
              setInputValue={setInputValue}
              messageCallout={messageCallout}
              setMessageCallout={setMessageCallout}
            />
          </Card>
        </TabsContent>
        
        <TabsContent value="project" className="mt-4">
          {projectContext ? (
            <div className="grid grid-cols-12 gap-4 h-[80vh]">
              <div className="col-span-3 flex flex-col gap-4">
                <ProjectHeader 
                  projectName={projectContext.projectName} 
                  description={projectContext.description}
                />
                
                <Card className="flex-1 overflow-auto">
                  <div className="p-4 font-semibold border-b">Files</div>
                  <FileExplorer 
                    files={projectContext.files || []} 
                    selectedFile={selectedFile}
                    onSelectFile={handleFileSelect}
                  />
                </Card>
                
                <Card className="flex-1 overflow-auto">
                  <div className="p-4 font-semibold border-b">Challenges</div>
                  <ChallengeList 
                    challenges={projectContext.challenges || []}
                    selectedChallenge={currentChallenge}
                    completedChallenges={completedChallenges}
                    onSelectChallenge={handleChallengeSelect}
                    onCompleteChallenge={handleChallengeComplete}
                  />
                </Card>
                
                <Button 
                  onClick={() => setShowModifyPrompt(true)}
                  className="w-full"
                >
                  Modify App
                </Button>
              </div>
              
              <div className="col-span-9">
                <Card className="h-full">
                  <CodeEditor 
                    content={fileContent}
                    onChange={handleFileContentChange}
                    filename={selectedFile}
                    projectId={currentProjectId}
                  />
                </Card>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[80vh]">
              <p>No project loaded. Start a chat to create a new project.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Modify App Modal */}
      {showModifyPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-1/2 p-6">
            <h2 className="text-xl font-bold mb-4">Modify Your App</h2>
            <p className="mb-4">Describe the changes you want to make to your app:</p>
            
            <Textarea
              value={modificationPrompt}
              onChange={(e) => setModificationPrompt(e.target.value)}
              placeholder="E.g., Add a dark mode toggle to the navbar"
              className="mb-4 h-32"
            />
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowModifyPrompt(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleModifyApp}
                disabled={isModifyingApp || !modificationPrompt.trim()}
              >
                {isModifyingApp ? 'Modifying...' : 'Apply Changes'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
