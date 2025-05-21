
import React, { useState, useEffect, useRef } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { geminiAIService } from "@/utils/GeminiAIService";
import CodeEditor from "@/components/CodeEditor";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: string;
  codeUpdate?: string;
}

interface ProjectContext {
  projectName: string;
  description: string;
  specification: string;
  components?: Array<{name: string, description: string}>;
  dependencies?: string[];
  architecture?: string;
  challenges?: string[];
  nextSteps?: string[];
}

const CodeAssistantPage: React.FC = () => {
  // State for API key management
  const [apiKey, setApiKey] = useState<string>('');
  const [isKeySet, setIsKeySet] = useState<boolean>(false);
  
  // State for conversation and project
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [currentCode, setCurrentCode] = useState<string>('// Your code will appear here');
  const [projectContext, setProjectContext] = useState<ProjectContext | null>(null);
  const [projectName, setProjectName] = useState<string>('');
  const [editorLanguage, setEditorLanguage] = useState<string>('javascript');
  
  // References
  const conversationEndRef = useRef<HTMLDivElement>(null);
  
  // Effect to scroll to the latest message
  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Effect to check if API key is already set
  useEffect(() => {
    const currentKey = geminiAIService.getApiKey();
    if (currentKey) {
      setIsKeySet(true);
    }
  }, []);
  
  // Handle setting the API key
  const handleSetApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter a valid Gemini API key.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      geminiAIService.setApiKey(apiKey);
      setIsKeySet(true);
      toast({
        title: "API Key Set",
        description: "Your Gemini API key has been set successfully.",
      });
    } catch (error) {
      toast({
        title: "Error Setting API Key",
        description: "Failed to set API key. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Handle submitting initial project specification
  const handleSubmitSpecification = async () => {
    if (!userInput.trim() || isProcessing || !isKeySet) {
      return;
    }
    
    setIsProcessing(true);
    
    // Add user message to conversation
    const userMessage: Message = {
      role: 'user',
      content: userInput,
      id: Date.now().toString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      // Initialize project
      const result = await geminiAIService.initializeProject(
        userInput,
        projectName || 'New Project'
      );
      
      // Set project context
      setProjectContext(result.projectContext);
      setCurrentCode(result.initialCode);
      
      // Detect language from code
      if (result.initialCode.includes('import React') || 
          result.initialCode.includes('from "react"') ||
          result.initialCode.includes('<div>')) {
        setEditorLanguage('typescript');
      } else if (result.initialCode.includes('function') || 
                result.initialCode.includes('const')) {
        setEditorLanguage('javascript');
      }
      
      // Add assistant message to conversation
      const assistantMessage: Message = {
        role: 'assistant',
        content: result.assistantMessage,
        id: (Date.now() + 1).toString()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Switch to editor tab
      setActiveTab('editor');
      
    } catch (error: any) {
      console.error('Error initializing project:', error);
      
      // Add error message to conversation
      const errorMessage: Message = {
        role: 'assistant',
        content: `I encountered an error while initializing your project: ${error.message}. Please try again.`,
        id: (Date.now() + 1).toString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
    } finally {
      setUserInput('');
      setIsProcessing(false);
    }
  };
  
  // Handle submitting a message in an ongoing conversation
  const handleSubmitMessage = async () => {
    if (!userInput.trim() || isProcessing || !isKeySet || !projectContext) {
      return;
    }
    
    setIsProcessing(true);
    
    // Add user message to conversation
    const userMessage: Message = {
      role: 'user',
      content: userInput,
      id: Date.now().toString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      // Analyze and respond
      const result = await geminiAIService.analyzeAndRespond(
        userInput,
        currentCode,
        projectContext
      );
      
      // Update project context
      setProjectContext(result.updatedContext);
      
      // Add assistant message to conversation
      const assistantMessage: Message = {
        role: 'assistant',
        content: result.assistantMessage,
        id: (Date.now() + 1).toString(),
        codeUpdate: result.codeUpdate
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error: any) {
      console.error('Error analyzing code:', error);
      
      // Add error message to conversation
      const errorMessage: Message = {
        role: 'assistant',
        content: `I encountered an error while analyzing your code: ${error.message}. Please try again.`,
        id: (Date.now() + 1).toString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
    } finally {
      setUserInput('');
      setIsProcessing(false);
    }
  };
  
  // Handle applying a code update
  const handleApplyCodeUpdate = (codeUpdate: string) => {
    setCurrentCode(codeUpdate);
    setActiveTab('editor');
    
    toast({
      title: "Code Updated",
      description: "The suggested code changes have been applied.",
    });
  };
  
  // Render a message in the conversation
  const renderMessage = (message: Message, index: number) => {
    const isUser = message.role === 'user';
    
    return (
      <div 
        key={message.id} 
        className={`mb-4 ${isUser ? 'ml-auto' : 'mr-auto'} max-w-[80%]`}
      >
        <div className={`p-3 rounded-lg ${isUser ? 'bg-primary/10 text-right' : 'bg-muted text-left'}`}>
          <div className="whitespace-pre-wrap">{message.content}</div>
          
          {/* Code update suggestion */}
          {!isUser && message.codeUpdate && (
            <div className="mt-3 p-3 bg-background rounded border">
              <div className="text-sm font-medium mb-2">Code Suggestion:</div>
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                {message.codeUpdate.length > 500 
                  ? message.codeUpdate.substring(0, 500) + '...' 
                  : message.codeUpdate}
              </pre>
              <Button 
                size="sm" 
                className="mt-2" 
                onClick={() => handleApplyCodeUpdate(message.codeUpdate || '')}
              >
                Apply This Update
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-4">AI Code Assistant</h1>
      
      {/* API Key Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant={isKeySet ? "outline" : "default"} className="mb-4">
            {isKeySet ? "Update API Key" : "Set Gemini API Key"}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Your Gemini API Key</DialogTitle>
            <DialogDescription>
              Enter your Gemini API key to enable the AI Code Assistant functionality.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Gemini API key"
              type="password"
            />
            <Button onClick={handleSetApiKey}>Save API Key</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="editor">Code Editor</TabsTrigger>
          {projectContext && (
            <TabsTrigger value="project">Project Overview</TabsTrigger>
          )}
        </TabsList>
        
        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-4">
          <Card className="h-[70vh] flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle>AI Chat Assistant</CardTitle>
              <CardDescription>
                {projectContext 
                  ? `Project: ${projectContext.projectName}` 
                  : "Start by describing the project you want to build"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground p-4">
                      {isKeySet 
                        ? "Describe the project you want to build or ask a question..." 
                        : "Please set your Gemini API key to get started."}
                    </div>
                  )}
                  {messages.map(renderMessage)}
                  <div ref={conversationEndRef} />
                </div>
              </ScrollArea>
              
              <Separator className="my-4" />
              
              <div className="space-y-4">
                {!projectContext && (
                  <Input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Project Name (Optional)"
                  />
                )}
                
                <div className="flex gap-2">
                  <Textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={projectContext 
                      ? "Ask a question about your code..." 
                      : "Describe the project you want to build..."}
                    className="resize-none flex-1"
                    disabled={!isKeySet || isProcessing}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        projectContext 
                          ? handleSubmitMessage() 
                          : handleSubmitSpecification();
                      }
                    }}
                  />
                  <Button 
                    onClick={projectContext ? handleSubmitMessage : handleSubmitSpecification}
                    disabled={!isKeySet || isProcessing || !userInput.trim()}
                  >
                    {isProcessing ? 'Processing...' : 'Send'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Code Editor Tab */}
        <TabsContent value="editor">
          <div className="h-[70vh]">
            <CodeEditor
              code={currentCode}
              language={editorLanguage}
              onCodeChange={setCurrentCode}
              projectId={projectContext?.projectName || 'temp-project'}
              filename={projectContext ? `${projectContext.projectName}.js` : 'main.js'}
              height="68vh"
            />
          </div>
        </TabsContent>
        
        {/* Project Overview Tab */}
        {projectContext && (
          <TabsContent value="project">
            <Card className="h-[70vh]">
              <CardHeader>
                <CardTitle>{projectContext.projectName}</CardTitle>
                <CardDescription>{projectContext.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[60vh] pr-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium">Project Specification</h3>
                      <p className="text-muted-foreground">{projectContext.specification}</p>
                    </div>
                    
                    {projectContext.components && projectContext.components.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium">Components</h3>
                        <ul className="list-disc pl-5 space-y-1">
                          {projectContext.components.map((component, index) => (
                            <li key={index}>
                              <span className="font-medium">{component.name}</span>
                              <span className="text-muted-foreground">: {component.description}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {projectContext.dependencies && projectContext.dependencies.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium">Dependencies</h3>
                        <ul className="list-disc pl-5 space-y-1">
                          {projectContext.dependencies.map((dependency, index) => (
                            <li key={index}>{dependency}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {projectContext.nextSteps && projectContext.nextSteps.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium">Next Steps</h3>
                        <ul className="list-disc pl-5 space-y-1">
                          {projectContext.nextSteps.map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default CodeAssistantPage;
