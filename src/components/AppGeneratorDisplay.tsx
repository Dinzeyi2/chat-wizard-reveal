
import React, { useState, useEffect } from "react";
import { Message } from "@/types/chat";
import { Button } from "@/components/ui/button";
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
import { toast } from "@/hooks/use-toast";

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
    // Extract and parse app data with improved reliability
    const extractAppData = (): GeneratedApp | null => {
      try {
        console.info("JSON extraction attempt: Found", message.content.length, "characters");
        
        // First attempt: Look for JSON inside code blocks
        const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
        const jsonBlockMatch = message.content.match(jsonBlockRegex);
        
        let extractedJson = null;
        
        if (jsonBlockMatch && jsonBlockMatch[1]) {
          try {
            extractedJson = JSON.parse(jsonBlockMatch[1].trim());
            if (isValidAppData(extractedJson)) {
              console.info("Successfully extracted app data from JSON code block");
              return extractedJson;
            }
          } catch (e) {
            console.info("Failed to parse JSON from code block:", e);
          }
        }
        
        // Second attempt: Look for raw JSON object in the content
        const objectMatch = message.content.match(/(\{[\s\S]*\})/);
        if (objectMatch && objectMatch[1]) {
          try {
            extractedJson = JSON.parse(objectMatch[1]);
            if (isValidAppData(extractedJson)) {
              console.info("Successfully extracted app data from raw JSON");
              return extractedJson;
            }
          } catch (e) {
            console.info("Failed to parse raw JSON:", e);
          }
        }
        
        // Third attempt: Look for specific patterns and try to extract just the app data portion
        const startIndex = message.content.indexOf('{');
        if (startIndex !== -1) {
          let endIndex = message.content.lastIndexOf('}');
          if (endIndex > startIndex) {
            try {
              const jsonSubstring = message.content.substring(startIndex, endIndex + 1);
              extractedJson = JSON.parse(jsonSubstring);
              if (isValidAppData(extractedJson)) {
                console.info("Successfully extracted app data from content substring");
                return extractedJson;
              }
            } catch (e) {
              console.info("Failed to parse JSON substring:", e);
            }
          }
        }
        
        // Fourth attempt: Try to manually construct a basic app data object
        console.info("All JSON parsing attempts failed, trying to construct fallback app data");
        return createFallbackAppData(message.content);
        
      } catch (error) {
        console.error("All extraction methods failed:", error);
        return createFallbackAppData(message.content);
      }
    };
    
    // Helper to check if extracted data is valid app data
    const isValidAppData = (data: any): boolean => {
      return (
        data && 
        typeof data === 'object' &&
        typeof data.projectName === 'string' && 
        typeof data.description === 'string' && 
        Array.isArray(data.files) &&
        data.files.length > 0 &&
        data.files.every((file: any) => file.path && file.content)
      );
    };
    
    // Create basic fallback app data if all extraction methods fail
    const createFallbackAppData = (content: string): GeneratedApp => {
      console.info("Creating fallback app data");
      
      // Extract project name and description from content if possible
      const projectNameMatch = content.match(/[pP]roject(?:Name)?[":]\s*["']?([^"',}\n]+)["']?/);
      const descriptionMatch = content.match(/[dD]escription[":]\s*["']?([^"',}\n]+)["']?/);
      
      const projectName = projectNameMatch ? projectNameMatch[1].trim() : "Generated App";
      const description = descriptionMatch ? descriptionMatch[1].trim() : "Generated application";
      
      // Create at least one file with the raw content
      const files: GeneratedFile[] = [
        { 
          path: "README.md", 
          content: `# ${projectName}\n\n${description}\n\nGenerated application code.` 
        },
        {
          path: "app.js",
          content: "// Main application code\nconsole.log('Generated application');"
        }
      ];
      
      return {
        projectName,
        description,
        files,
        explanation: "This application was generated based on your request."
      };
    };
    
    const extracted = extractAppData();
    console.info("App data extraction result:", extracted ? "success" : "failed");
    setAppData(extracted);
  }, [message]);
  
  const handleViewFullProject = () => {
    console.info("handleViewFullProject called");
    try {
      // Always ensure we have valid files before opening the artifact
      const artifactFiles = appData?.files?.map((file, index) => ({
        id: `file-${index}`,
        name: file.path.split('/').pop() || file.path,
        path: file.path,
        language: getLanguageFromPath(file.path),
        content: file.content
      })) || [];
      
      if (artifactFiles.length === 0) {
        // If no files exist, create a fallback file with the content
        artifactFiles.push({
          id: "fallback-content",
          name: "content.txt",
          path: "content.txt",
          language: "plaintext",
          content: message.content
        });
      }

      console.info("Opening artifact with", artifactFiles.length, "files");
      openArtifact({
        id: `artifact-${Date.now()}`,
        title: appData?.projectName || "Generated Code",
        description: appData?.description || "Generated content",
        files: artifactFiles
      });
    } catch (error) {
      console.error("Error opening artifact:", error);
      
      // Fallback to opening raw content if there's an error
      handleViewRawContent(message.content);
      
      toast({
        title: "Error",
        description: "Recovered from an error displaying structured code. Showing raw content instead.",
        variant: "destructive"
      });
    }
  };
  
  const handleViewRawContent = (content: string) => {
    // Create a simplified artifact with the raw content
    openArtifact({
      id: `artifact-raw-${Date.now()}`,
      title: "Generated Code",
      description: "Raw generated content",
      files: [{
        id: "raw-content",
        name: "content.txt",
        path: "content.txt",
        language: "plaintext",
        content: content
      }]
    });
  };

  // If data couldn't be parsed at all, show a fallback view that always works
  if (!appData) {
    return (
      <div className="my-6 space-y-4">
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <h3 className="text-lg font-semibold mb-2">App Generation Result</h3>
          <p className="text-gray-600 mb-3">
            The app code is ready. You can view it by clicking the button below.
          </p>
          
          <Button
            onClick={() => handleViewRawContent(message.content)}
            variant="default"
            className="w-full justify-center mt-2"
          >
            <Code className="mr-2 h-4 w-4" /> View Generated Code
          </Button>
        </div>
      </div>
    );
  }

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
        <h3 className="text-xl font-semibold mb-2">I've generated a full-stack application: {appData.projectName}</h3>
        <p className="text-gray-600">{appData.description}</p>
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
      
      {/* Fallback view content button as an extra safety measure */}
      <div className="pt-4 border-t border-gray-200">
        <Button
          onClick={() => handleViewRawContent(message.content)}
          variant="outline"
          className="text-sm"
          size="sm"
        >
          <FileCode className="mr-2 h-4 w-4" /> View Raw Content
        </Button>
      </div>
    </div>
  );
};

export default AppGeneratorDisplay;
