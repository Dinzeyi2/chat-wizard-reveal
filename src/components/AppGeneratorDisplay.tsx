
import React, { useState } from "react";
import { Message } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileCode, ChevronDown, ChevronRight, Code } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface GeneratedFile {
  path: string;
  content: string;
}

interface GeneratedApp {
  projectName: string;
  description: string;
  files: GeneratedFile[];
  explanation?: string;
}

interface AppGeneratorDisplayProps {
  message: Message;
}

const AppGeneratorDisplay: React.FC<AppGeneratorDisplayProps> = ({ message }) => {
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  // Parse the app data from the message content
  const getAppData = (): GeneratedApp | null => {
    try {
      const appDataMatch = message.content.match(/```json([\s\S]*?)```/);
      if (appDataMatch && appDataMatch[1]) {
        return JSON.parse(appDataMatch[1]);
      }
      return null;
    } catch (error) {
      console.error("Failed to parse app data:", error);
      return null;
    }
  };
  
  const appData = getAppData();
  
  if (!appData) {
    return <div>{message.content}</div>;
  }
  
  const handleFileSelect = (file: GeneratedFile) => {
    setSelectedFile(file);
  };

  const handleDownload = () => {
    // Create a zip file with JSZip (in a real app)
    alert("Download functionality would be implemented here");
  };

  const getLanguageFromPath = (path: string): string => {
    const extension = path.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'css': 'css',
      'scss': 'scss',
      'html': 'html',
      'json': 'json',
      'md': 'markdown',
    };
    return languageMap[extension] || 'plaintext';
  };

  return (
    <div className="mt-6 space-y-6">
      {/* Main explanatory text - displayed outside the code card */}
      <div className="text-base space-y-4">
        <p>{appData.description}</p>
        
        <p>
          This {appData.projectName} application includes {appData.files.length} files with
          various components and functionality for the requested features.
        </p>
        
        {appData.explanation && (
          <div className="mt-4">
            {appData.explanation.split('\n\n').map((paragraph, i) => (
              <p key={i} className="mb-3">{paragraph}</p>
            ))}
          </div>
        )}
      </div>

      {/* Code card - styled similar to the example image */}
      <div className="border rounded-lg bg-[#1e1e1e] text-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#333333]">
          <div className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-[#abb2bf]" />
            <h3 className="font-medium text-[#f8f8f8]">{appData.projectName}</h3>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1 bg-[#333333] border-[#444444] text-[#d4d4d4] hover:bg-[#444444]"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </Button>
        </div>

        {/* Center button similar to example */}
        <div className="flex justify-center py-5">
          <Button
            variant="outline"
            className="flex items-center gap-2 bg-[#333333] border-[#444444] text-[#d4d4d4] hover:bg-[#444444]"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Code className="h-4 w-4" />
            <span>View code</span>
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* Collapsible code explorer */}
        <Collapsible 
          open={isOpen}
          onOpenChange={setIsOpen}
        >
          <CollapsibleContent>
            <div className="flex h-[500px] border-t border-[#444444]">
              {/* File explorer */}
              <div className="w-64 border-r border-[#444444]">
                <ScrollArea className="h-full bg-[#252526]">
                  <div className="p-2">
                    <h4 className="text-xs font-medium uppercase text-[#abb2bf] mb-2 px-2">Files</h4>
                    <div className="space-y-1">
                      {appData.files.map((file) => (
                        <button
                          key={file.path}
                          onClick={() => handleFileSelect(file)}
                          className={`w-full text-left text-sm px-2 py-1 rounded ${
                            selectedFile?.path === file.path
                              ? "bg-[#37373d] text-white"
                              : "text-[#d4d4d4] hover:bg-[#2a2d2e]"
                          }`}
                        >
                          {file.path}
                        </button>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </div>
              
              {/* File content */}
              <div className="flex-1 bg-[#1e1e1e]">
                {selectedFile ? (
                  <Tabs defaultValue="code" className="flex flex-col h-full">
                    <div className="border-b border-[#444444] px-3 bg-[#252526]">
                      <TabsList className="bg-[#333333]">
                        <TabsTrigger value="code" className="data-[state=active]:bg-[#1e1e1e] data-[state=active]:text-white">Code</TabsTrigger>
                        <TabsTrigger value="preview" className="data-[state=active]:bg-[#1e1e1e] data-[state=active]:text-white">Preview</TabsTrigger>
                      </TabsList>
                    </div>
                    
                    <TabsContent value="code" className="flex-1 overflow-auto p-0 m-0">
                      <ScrollArea className="h-full">
                        <pre className="p-4">
                          <code className={`language-${getLanguageFromPath(selectedFile.path)}`}>
                            {selectedFile.content}
                          </code>
                        </pre>
                      </ScrollArea>
                    </TabsContent>
                    
                    <TabsContent value="preview" className="flex-1 p-4 mt-0 bg-[#1e1e1e]">
                      <div className="border border-[#444444] rounded h-full flex items-center justify-center">
                        <p className="text-[#abb2bf] text-sm">
                          Preview not available
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-[#abb2bf] text-sm">
                      Select a file to view its content
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Additional details - listed after the code card */}
      <div className="mt-4 space-y-2 text-sm">
        <h3 className="font-medium text-lg">Implementation Details:</h3>
        <ol className="list-decimal pl-5 space-y-1">
          <li>The architecture follows a modern {appData.files.some(f => f.path.includes('next')) ? 'Next.js' : 'React'} application structure</li>
          <li>Components are organized for maximum reusability</li>
          <li>{appData.files.some(f => f.path.includes('api')) ? 'Includes API routes for backend functionality' : 'Frontend focused with component architecture'}</li>
        </ol>
      </div>
    </div>
  );
};

export default AppGeneratorDisplay;
