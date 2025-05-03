
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import CodeEditor from '@/components/challenge/CodeEditor';
import { ChevronDownIcon, ChevronUpIcon, Code2Icon, PlayIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { StructuredAIGuide, ImplementationStep } from '@/utils/StructuredAIGuide';
import { UICodeGenerator } from '@/utils/UICodeGenerator';
import { Card } from "@/components/ui/card";

// Function to create a basic project structure from files array
const createProjectStructure = (files: any[]) => {
  const structure: any = {
    files: {},
    directories: {}
  };

  files.forEach(file => {
    const pathParts = file.path.split('/');
    const fileName = pathParts.pop();
    let current = structure;

    pathParts.forEach(part => {
      if (!current.directories[part]) {
        current.directories[part] = {
          files: {},
          directories: {}
        };
      }
      current = current.directories[part];
    });

    current.files[fileName] = file.content;
  });

  return structure;
};

const AppGeneratorDisplay = ({ appData, projectId }) => {
  const [activeFile, setActiveFile] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [projectStructure, setProjectStructure] = useState<any>(null);
  const [isFileExplorerOpen, setIsFileExplorerOpen] = useState(true);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('files');
  const [structuredGuide, setStructuredGuide] = useState<StructuredAIGuide | null>(null);
  const [currentStep, setCurrentStep] = useState<ImplementationStep | null>(null);
  const [stepProgress, setStepProgress] = useState<Record<string, any>>({});
  const [uiCodeGenerator, setUICodeGenerator] = useState<UICodeGenerator | null>(null);
  const { toast } = useToast();
  
  // Initialize structured guide
  useEffect(() => {
    if (appData && !structuredGuide) {
      try {
        const guide = new StructuredAIGuide(appData);
        setStructuredGuide(guide);
        
        // Initialize UI code generator
        const generator = new UICodeGenerator();
        generator.initializeStructuredGuide(appData);
        setUICodeGenerator(generator);
        
        // Auto-select the first step
        const firstStep = guide.autoSelectNextStep();
        if (firstStep) {
          setCurrentStep(firstStep);
        }
        
        // Initialize step progress
        const initialProgress = {};
        guide.getSteps().forEach(step => {
          initialProgress[step.id] = guide.getStepProgress()[step.id];
        });
        setStepProgress(initialProgress);
      } catch (error) {
        console.error("Error initializing structured guide:", error);
      }
    }
  }, [appData, structuredGuide]);

  // Parse project structure from files
  useEffect(() => {
    if (appData && appData.files) {
      const structure = createProjectStructure(appData.files);
      setProjectStructure(structure);
      
      // Set first file as active by default
      if (appData.files.length > 0) {
        const firstFilePath = appData.files[0].path;
        setActiveFile(firstFilePath);
        setFileContent(appData.files[0].content);
      }
    }
  }, [appData]);

  // Handle file selection
  const handleFileSelect = (filePath, content) => {
    setActiveFile(filePath);
    setFileContent(content);
  };

  // Handle completing a step
  const handleCompleteStep = (stepId) => {
    if (structuredGuide) {
      structuredGuide.completeStep(stepId);
      
      // Update step progress
      setStepProgress({...structuredGuide.getStepProgress()});
      
      // Select next step
      const nextStep = structuredGuide.autoSelectNextStep();
      if (nextStep) {
        setCurrentStep(nextStep);
      } else {
        setCurrentStep(null);
      }
    }
  };
  
  // Check if we should display the file browser
  const shouldShowFileBrowser = projectStructure && (
    Object.keys(projectStructure.files).length > 0 || 
    Object.keys(projectStructure.directories).length > 0
  );
  
  // Helper to render directory structure recursively
  const renderDirectory = (directory, path = '', level = 0) => {
    const fileEntries = Object.entries(directory.files || {});
    const dirEntries = Object.entries(directory.directories || {});
    
    return (
      <div className={`pl-${level * 4}`}>
        {fileEntries.map(([fileName, content]) => {
          const filePath = path ? `${path}/${fileName}` : fileName;
          return (
            <div 
              key={filePath}
              className={`cursor-pointer py-1 hover:bg-gray-100 px-2 rounded ${activeFile === filePath ? 'bg-blue-100' : ''}`}
              onClick={() => handleFileSelect(filePath, content)}
            >
              <span className="text-xs font-mono flex items-center">
                <Code2Icon size={12} className="mr-1 inline" />
                {fileName}
              </span>
            </div>
          );
        })}
        
        {dirEntries.map(([dirName, subDir]) => {
          const dirPath = path ? `${path}/${dirName}` : dirName;
          return (
            <div key={dirPath}>
              <div className="flex items-center py-1 px-1">
                <span className="text-xs font-medium">{dirName}</span>
              </div>
              {renderDirectory(subDir, dirPath, level + 1)}
            </div>
          );
        })}
      </div>
    );
  };
  
  // Define tab content for challenges
  const renderChallengesTab = () => {
    if (!appData || !appData.challenges || appData.challenges.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500">
          No challenges defined for this project.
        </div>
      );
    }
    
    return (
      <div className="space-y-3">
        {appData.challenges.map((challenge, index) => (
          <Card key={challenge.id || index} className="p-3">
            <h4 className="font-medium mb-1">{index + 1}. {challenge.title}</h4>
            <p className="text-sm text-gray-600">{challenge.description}</p>
            {challenge.filesPaths && challenge.filesPaths.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-gray-500">Files: </span>
                {challenge.filesPaths.map((path, i) => (
                  <span 
                    key={i}
                    className="text-xs bg-gray-100 px-1 py-0.5 rounded mr-1 cursor-pointer hover:bg-gray-200"
                    onClick={() => {
                      const file = appData.files.find(f => f.path === path);
                      if (file) {
                        handleFileSelect(path, file.content);
                        setActiveTab('files');
                      }
                    }}
                  >
                    {path}
                  </span>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    );
  };
  
  // Determine what to display in the main area
  const renderMainContent = () => {
    if (!activeFile) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-6">
            <h3 className="text-lg font-medium mb-2">No File Selected</h3>
            <p className="text-gray-500 text-sm">Select a file from the explorer to view its content.</p>
          </div>
        </div>
      );
    }
    
    // Extract file extension
    const fileExt = activeFile.split('.').pop()?.toLowerCase();
    
    // Determine language for the code editor
    let language = 'javascript';
    if (fileExt === 'ts' || fileExt === 'tsx') language = 'typescript';
    else if (fileExt === 'json') language = 'json';
    else if (fileExt === 'css') language = 'css';
    else if (fileExt === 'html') language = 'html';
    
    return (
      <div className="h-full">
        <div className="bg-gray-100 px-3 py-1 text-xs font-mono border-b">{activeFile}</div>
        <CodeEditor
          value={fileContent}
          language={language}
          readOnly={true}
          height="calc(100% - 26px)"
        />
      </div>
    );
  };
  
  // If no app data is available yet
  if (!appData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6">
          <h3 className="text-lg font-medium mb-2">No Application Data</h3>
          <p className="text-gray-500">Generate an application first to see details here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">{appData.projectName || "Generated Application"}</h2>
        <p className="text-sm text-gray-600">{appData.description || "No description provided"}</p>
      </div>
      
      <div className={`flex flex-1 overflow-hidden ${isPreviewExpanded ? 'flex-col' : ''}`}>
        {/* Side panel with file explorer */}
        <div className={`border-r ${isPreviewExpanded ? 'h-1/3' : 'w-1/3'}`}>
          <div className="h-full flex flex-col">
            <div className="p-2 border-b bg-gray-50">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="files" className="flex-1">Files</TabsTrigger>
                  <TabsTrigger value="challenges" className="flex-1">Challenges</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <Tabs value={activeTab} className="h-full">
                <TabsContent value="files" className="m-0 h-full">
                  <ScrollArea className="h-full">
                    <Collapsible
                      open={isFileExplorerOpen}
                      onOpenChange={setIsFileExplorerOpen}
                      className="w-full"
                    >
                      <div className="flex items-center justify-between px-3 py-2">
                        <h3 className="text-sm font-medium">Project Files</h3>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            {isFileExplorerOpen ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                      <Separator />
                      <CollapsibleContent className="p-2">
                        {shouldShowFileBrowser ? (
                          renderDirectory(projectStructure)
                        ) : (
                          <div className="p-4 text-center text-gray-500">
                            No files available.
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="challenges" className="m-0 p-3 overflow-y-auto h-full">
                  <ScrollArea className="h-full">
                    {renderChallengesTab()}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
        
        {/* Main content area */}
        <div className={`${isPreviewExpanded ? 'h-2/3' : 'flex-1'}`}>
          <div className="h-full flex flex-col">
            <div className="p-2 border-b bg-gray-50 flex justify-between">
              <h3 className="text-sm font-medium">File Viewer</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7"
                onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
              >
                {isPreviewExpanded ? "Horizontal Split" : "Vertical Split"}
              </Button>
            </div>
            
            <div className="flex-1 overflow-hidden">
              {renderMainContent()}
            </div>
          </div>
        </div>
      </div>
      
      {appData.explanation && (
        <div className="p-4 border-t bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg m-4">
          <h3 className="text-lg font-medium mb-2">About This Application</h3>
          <p className="text-sm text-gray-700">{appData.explanation}</p>
          
          {appData.challenges && appData.challenges.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium">This app includes {appData.challenges.length} learning challenges:</p>
              <ul className="list-disc pl-5 mt-1 text-sm">
                {appData.challenges.slice(0, 3).map((challenge, i) => (
                  <li key={i}>{challenge.title}</li>
                ))}
                {appData.challenges.length > 3 && (
                  <li>And {appData.challenges.length - 3} more...</li>
                )}
              </ul>
              <p className="text-xs text-gray-500 mt-2">View the Challenges tab for details on each challenge.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AppGeneratorDisplay;
