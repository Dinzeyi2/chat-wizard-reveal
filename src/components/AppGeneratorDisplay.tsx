
import React, { useState } from "react";
import { Message } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileCode, ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";

interface GeneratedFile {
  path: string;
  content: string;
}

interface GeneratedApp {
  projectName: string;
  description: string;
  files: GeneratedFile[];
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

  // Generate a summary of the app architecture
  const generateSummary = () => {
    const fileTypes = appData.files
      .map(file => file.path.split('.').pop()?.toLowerCase())
      .filter((value, index, self) => value && self.indexOf(value) === index);
    
    const frontendFiles = appData.files.filter(file => 
      file.path.includes('pages') || 
      file.path.includes('components') || 
      file.path.includes('.jsx') || 
      file.path.includes('.tsx'));
    
    const backendFiles = appData.files.filter(file => 
      file.path.includes('api') || 
      file.path.includes('server') || 
      file.path.includes('routes'));

    return (
      <div className="text-sm space-y-2">
        <p>{appData.description}</p>
        <p><strong>Project Structure:</strong> This application includes {appData.files.length} files using {fileTypes.join(', ')} technologies.</p>
        <p><strong>Frontend:</strong> {frontendFiles.length} frontend files including UI components and pages.</p>
        {backendFiles.length > 0 && (
          <p><strong>Backend:</strong> {backendFiles.length} backend files for server-side functionality.</p>
        )}
        <p className="text-muted-foreground italic">Click "View Full Project" below to explore the code.</p>
      </div>
    );
  };

  return (
    <div className="border rounded-lg overflow-hidden mt-4">
      <div className="bg-muted p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCode className="h-5 w-5" />
          <h3 className="font-medium">{appData.projectName}</h3>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4" />
          <span>Download</span>
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {generateSummary()}
        
        <Collapsible 
          open={isOpen}
          onOpenChange={setIsOpen}
          className="border rounded-lg"
        >
          <CollapsibleTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-between p-3"
            >
              <span>View Full Project</span>
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="flex h-[500px]">
              {/* File explorer */}
              <div className="w-64 border-r">
                <ScrollArea className="h-full">
                  <div className="p-2">
                    <h4 className="text-xs font-medium uppercase text-muted-foreground mb-2 px-2">Files</h4>
                    <div className="space-y-1">
                      {appData.files.map((file) => (
                        <button
                          key={file.path}
                          onClick={() => handleFileSelect(file)}
                          className={`w-full text-left text-sm px-2 py-1 rounded ${
                            selectedFile?.path === file.path
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-muted"
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
              <div className="flex-1">
                {selectedFile ? (
                  <Tabs defaultValue="code" className="flex flex-col h-full">
                    <div className="border-b px-3">
                      <TabsList>
                        <TabsTrigger value="code">Code</TabsTrigger>
                        <TabsTrigger value="preview">Preview</TabsTrigger>
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
                    
                    <TabsContent value="preview" className="flex-1 p-4 mt-0">
                      <div className="border rounded h-full flex items-center justify-center">
                        <p className="text-muted-foreground text-sm">
                          Preview not available
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">
                      Select a file to view its content
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="explanation">
            <AccordionTrigger>AI Explanation</AccordionTrigger>
            <AccordionContent>
              <div className="text-sm space-y-2 p-2">
                <p><strong>Architecture Overview:</strong> This {appData.projectName} application follows a typical web application structure with clearly separated concerns.</p>
                
                <p><strong>Frontend:</strong> The UI is built with React components organized in a logical hierarchy, with pages for different views and reusable components for common UI elements.</p>
                
                <p><strong>Data Management:</strong> The application handles data through a combination of state management and API calls to backend services.</p>
                
                <p><strong>Key Features:</strong></p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>E-commerce functionality with product listings and cart management</li>
                  <li>User authentication and store management</li>
                  <li>Responsive design for mobile and desktop</li>
                  <li>Modern UI with intuitive navigation</li>
                </ul>
                
                <p><strong>Tech Stack:</strong> Built using React with modern JavaScript/TypeScript, styling with CSS, and backend integration.</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default AppGeneratorDisplay;
