
import React, { useState } from "react";
import { Message } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileCode, ChevronDown, ChevronRight, ShoppingBag } from "lucide-react";
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
    return <div className="whitespace-pre-wrap">{message.content}</div>;
  }

  const appIcon = () => {
    if (appData.projectName.toLowerCase().includes("shopify") || 
        appData.description.toLowerCase().includes("e-commerce") || 
        appData.description.toLowerCase().includes("ecommerce") ||
        appData.description.toLowerCase().includes("shop")) {
      return <ShoppingBag className="h-5 w-5" />;
    }
    return <FileCode className="h-5 w-5" />;
  };
  
  const handleViewFullProject = () => {
    // Convert GeneratedFiles to ArtifactFiles format
    const artifactFiles = appData.files.map((file, index) => ({
      id: `file-${index}`,
      name: file.path.split('/').pop() || file.path,
      path: file.path,
      language: getLanguageFromPath(file.path),
      content: file.content
    }));

    // Open the artifact
    openArtifact({
      id: `artifact-${Date.now()}`,
      title: appData.projectName,
      description: appData.description,
      files: artifactFiles
    });
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
    // Extract features from description or use default features based on app type
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
    <div className="border rounded-lg overflow-hidden mt-4 bg-white shadow">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-lg text-blue-600">
            {appIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{appData.projectName}</h3>
            <p className="text-xs text-blue-100">Generated Application</p>
          </div>
        </div>
        <Button 
          variant="secondary" 
          size="sm" 
          className="bg-white text-blue-700 hover:bg-blue-50"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4 mr-1" />
          <span>Download</span>
        </Button>
      </div>

      <div className="p-5 space-y-4">
        {generateSummary()}
        
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Main Features:</h4>
          <ul className="grid grid-cols-2 gap-2">
            {getMainFeatures().map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                {feature}
              </li>
            ))}
          </ul>
        </div>
        
        <Button 
          variant="default" 
          className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
          onClick={handleViewFullProject}
        >
          <span>View Code & Files</span>
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="explanation">
          <AccordionTrigger className="px-5 py-3 hover:bg-gray-50">Application Details</AccordionTrigger>
          <AccordionContent className="px-5 pb-4">
            <div className="text-sm space-y-2">
              {appData.explanation ? (
                <p>{appData.explanation}</p>
              ) : (
                <>
                  <p><strong>Architecture Overview:</strong> This {appData.projectName} application follows a modern web architecture with a clean separation of concerns.</p>
                  
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
