
import React, { useState, useEffect } from "react";
import { Message } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileCode, ChevronRight, ChevronDown, ShoppingBag, Code, SquareDashed } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { useArtifact } from "./artifact/ArtifactSystem";
import { Badge } from "@/components/ui/badge";

interface GeneratedFile {
  path: string;
  content: string;
}

interface GeneratedApp {
  projectName: string;
  description: string;
  files: GeneratedFile[];
  explanation?: string;
  technologies?: string[];
}

interface AppGeneratorDisplayProps {
  message: Message;
}

const AppGeneratorDisplay: React.FC<AppGeneratorDisplayProps> = ({ message }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { openArtifact } = useArtifact();
  const [appData, setAppData] = useState<GeneratedApp | null>(null);
  
  useEffect(() => {
    const extractAppData = (): GeneratedApp | null => {
      try {
        // Primary extraction method: Try to find JSON data
        const jsonRegex = /```json([\s\S]*?)```/;
        const appDataMatch = message.content.match(jsonRegex);
        
        if (appDataMatch && appDataMatch[1]) {
          const jsonText = appDataMatch[1].trim();
          const jsonData = JSON.parse(jsonText);
          
          if (jsonData && 
              typeof jsonData.projectName === 'string' && 
              typeof jsonData.description === 'string' && 
              Array.isArray(jsonData.files)) {
            return jsonData;
          }
        }
        
        // Fallback method: try to find any JSON in the content
        const anyJsonRegex = /{[\s\S]*?"files"[\s\S]*?}/;
        const anyJsonMatch = message.content.match(anyJsonRegex);
        
        if (anyJsonMatch) {
          try {
            const jsonData = JSON.parse(anyJsonMatch[0]);
            if (jsonData && Array.isArray(jsonData.files)) {
              return {
                projectName: jsonData.projectName || "Generated Application",
                description: jsonData.description || "Generated application files",
                files: jsonData.files,
                technologies: jsonData.technologies || []
              };
            }
          } catch (e) {
            console.log("Failed to parse JSON in fallback method:", e);
          }
        }
        
        return null;
      } catch (error) {
        console.error("Failed to parse app data:", error);
        return null;
      }
    };
    
    setAppData(extractAppData());
  }, [message]);
  
  // Improved and simplified function to extract code blocks from message content
  const extractCodeBlocks = () => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
    const codeFiles = [];
    let match;
    let index = 0;
    
    while ((match = codeBlockRegex.exec(message.content)) !== null) {
      const language = match[1] || 'plaintext';
      const content = match[2].trim();
      
      // Skip if it's JSON we already tried to parse
      if (language.toLowerCase() === 'json' && content.includes('"files"') && content.includes('"projectName"')) {
        continue;
      }
      
      codeFiles.push({
        id: `file-${index++}`,
        name: `file-${index}.${getExtensionFromLanguage(language)}`,
        path: `file-${index}.${getExtensionFromLanguage(language)}`,
        language: language,
        content: content
      });
    }
    
    return codeFiles;
  };
  
  const getExtensionFromLanguage = (lang: string) => {
    const langMap: Record<string, string> = {
      'javascript': 'js',
      'typescript': 'ts',
      'jsx': 'jsx',
      'tsx': 'tsx',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'markdown': 'md',
      'plaintext': 'txt'
    };
    
    return langMap[lang.toLowerCase()] || 'txt';
  };

  // Completely rewritten handleViewFullProject to be more robust
  const handleViewFullProject = () => {
    console.log("Opening artifact viewer with message content:", message.content.substring(0, 100) + "...");
    
    // Create a guaranteed artifact ID
    const artifactId = `artifact-${Date.now()}`;
    // Default title that will always work
    const projectTitle = appData?.projectName || "Generated Application";
    
    // Try three different approaches to get files, with guaranteed fallbacks
    let files = [];
    
    // Method 1: Try to get files from parsed app data
    if (appData?.files && appData.files.length > 0) {
      console.log("Using parsed app data files");
      files = appData.files.map((file, index) => ({
        id: `file-${index}`,
        name: file.path.split('/').pop() || `file-${index}`,
        path: file.path,
        language: getLanguageFromPath(file.path),
        content: file.content
      }));
    }
    
    // Method 2: If no files from app data, try to extract code blocks
    if (files.length === 0) {
      console.log("Falling back to code block extraction");
      const extractedFiles = extractCodeBlocks();
      if (extractedFiles.length > 0) {
        files = extractedFiles;
      }
    }
    
    // Method 3: Ultimate fallback - create at least one file with the message content
    if (files.length === 0) {
      console.log("Using ultimate fallback - creating content file");
      files = [{
        id: "content-file",
        name: "generated-content.md",
        path: "generated-content.md",
        language: "markdown",
        content: message.content
      }];
    }
    
    // Ensure we have a valid artifact to open
    const artifact = {
      id: artifactId,
      title: projectTitle,
      description: appData?.description || "Generated application",
      files: files
    };
    
    // Open the artifact with our guaranteed valid artifact object
    console.log("Opening artifact with", files.length, "files");
    openArtifact(artifact);
  };

  const handleDownload = () => {
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
      <div className="text-sm space-y-3">
        <p className="text-base font-medium">{appData.description}</p>
        
        <div className="flex flex-wrap gap-2 my-2">
          {appData.technologies?.map(tech => (
            <Badge key={tech} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">{tech}</Badge>
          ))}
          {!appData.technologies && fileTypes.map(type => (
            <Badge key={type} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">{type}</Badge>
          ))}
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-700">Frontend</p>
            <p className="text-gray-600">{frontendFiles.length} files</p>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-700">Backend</p>
            <p className="text-gray-600">{backendFiles.length > 0 ? `${backendFiles.length} files` : 'Frontend only'}</p>
          </div>
        </div>
      </div>
    );
  };

  const getMainFeatures = () => {
    const isEcommerce = 
      appData.description.toLowerCase().includes('ecommerce') || 
      appData.description.toLowerCase().includes('e-commerce') ||
      appData.projectName.toLowerCase().includes('shop') ||
      appData.projectName.toLowerCase().includes('store');
      
    if (isEcommerce) {
      return [
        "Product catalog with search and filtering",
        "Shopping cart and checkout process",
        "User authentication and profiles",
        "Order management and payment processing"
      ];
    }
    
    return [
      "User authentication",
      "Interactive UI components",
      "Data management",
      "Responsive design"
    ];
  };

  return (
    <div className="my-6 space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">I've generated a full-stack application: {appData?.projectName || "Application"}</h3>
        <p className="text-gray-600">{appData?.description || "Generated application"}</p>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-full shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center">
          <SquareDashed className="mr-3 h-5 w-5 text-gray-500" />
          <span className="font-medium text-lg">View code</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="hover:bg-transparent" 
          onClick={handleViewFullProject}
        >
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </Button>
      </div>
      
      {appData && (
        <div className="space-y-4">
          <h4 className="font-semibold">This application includes:</h4>
          <ol className="list-decimal pl-6 space-y-2">
            {appData.files.length > 0 && (
              <li>
                <span className="font-medium">{appData.files.length} files</span> organized in a structured project
              </li>
            )}
            {appData.technologies && (
              <li>
                <span className="font-medium">Technologies used:</span> {appData.technologies.join(', ')}
              </li>
            )}
            <li>
              <span className="font-medium">Main features:</span>
              <ul className="list-disc pl-6 pt-1">
                {getMainFeatures().map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </li>
          </ol>
        </div>
      )}
      
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="explanation">
          <AccordionTrigger className="px-5 py-3 hover:bg-gray-50">Application Details</AccordionTrigger>
          <AccordionContent className="px-5 pb-4">
            <div className="text-sm space-y-2">
              {appData?.explanation ? (
                <p>{appData.explanation}</p>
              ) : (
                <>
                  <p><strong>Architecture Overview:</strong> This {appData?.projectName || "generated"} application follows a modern web architecture with a clean separation of concerns.</p>
                  
                  <p><strong>Frontend:</strong> The UI is built with React components organized in a logical hierarchy, with pages for different views and reusable components for common elements.</p>
                  
                  <p><strong>Data Management:</strong> The application handles data through state management and API calls to backend services.</p>
                  
                  <p><strong>Key Technical Features:</strong></p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>React components for UI building blocks</li>
                    <li>State management for application data</li>
                    <li>API integration for data fetching</li>
                    <li>Responsive design for all device sizes</li>
                  </ul>
                </>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default AppGeneratorDisplay;
