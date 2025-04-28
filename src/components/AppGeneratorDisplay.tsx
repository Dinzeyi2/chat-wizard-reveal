
import React, { useState } from "react";
import { Message } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileCode } from "lucide-react";

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
    </div>
  );
};

export default AppGeneratorDisplay;
