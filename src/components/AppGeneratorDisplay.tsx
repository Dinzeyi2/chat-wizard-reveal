import React, { useState, useEffect } from "react";
import { Message } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileCode, ChevronRight, ChevronDown, ShoppingBag, Code, SquareDashed, Eye } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { useArtifact } from "./artifact/ArtifactSystem";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  
  useEffect(() => {
    const extractAppData = (): GeneratedApp | null => {
      try {
        const content = message.content;
        if (!content) return null;
        
        // Step 1: Try to find JSON block using multiple patterns
        let jsonText = "";
        
        // Try to extract from code blocks with json tag
        const jsonPatterns = [
          /```json\s*([\s\S]*?)\s*```/,      // ```json ... ```
          /```\s*([\s\S]*?)\s*```/,          // ``` ... ``` (any code block)
          /\{[\s\S]*?"files"[\s\S]*?\}/,     // {..."files":...}
          /\{[\s\S]*?"projectName"[\s\S]*?\}/ // {..."projectName":...}
        ];
        
        // Try each pattern until we find a match
        for (const pattern of jsonPatterns) {
          const match = content.match(pattern);
          if (match && match[0]) {
            if (match[1]) {
              // First capturing group (for patterns with groups)
              jsonText = match[1].trim();
            } else {
              // Whole match (for patterns without groups)
              jsonText = match[0].trim();
            }
            
            // Check if we found valid JSON with key indicators
            if (jsonText && (
                jsonText.includes('"files"') || 
                jsonText.includes('"projectName"') ||
                (jsonText.includes('"path"') && jsonText.includes('"content"'))
              )) {
              break;
            }
          }
        }
        
        // If no pattern matched, try to find JSON object boundaries
        if (!jsonText) {
          const startIndex = content.indexOf('{');
          const endIndex = content.lastIndexOf('}');
          
          if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
            jsonText = content.substring(startIndex, endIndex + 1);
          }
        }
        
        console.log("JSON extraction attempt:", 
          jsonText ? `Found ${jsonText.length} characters` : "No JSON found");
        
        // Step 2: Parse the JSON if we found it
        if (jsonText) {
          try {
            // First try direct parsing
            const parsed = JSON.parse(jsonText);
            
            // Check if parsed data has required fields or structure
            if (parsed) {
              // Find the project name using various possible fields
              const projectName = parsed.projectName || parsed.name || 
                                 parsed.project || parsed.title || "Generated App";
              
              // Find description from various possible fields  
              const description = parsed.description || parsed.summary || 
                                 parsed.info || parsed.about || "Generated application";
              
              // Find files array using different possible structures
              let files = [];
              
              if (Array.isArray(parsed.files)) {
                files = parsed.files;
              } else if (parsed.fileStructure) {
                // Handle fileStructure format (used in some generators)
                files = [];
                Object.keys(parsed.fileStructure).forEach(category => {
                  if (Array.isArray(parsed.fileStructure[category])) {
                    parsed.fileStructure[category].forEach((path: string) => {
                      // Create placeholder entry for structure-only entries
                      files.push({ path, content: "// Content not available" });
                    });
                  }
                });
              } else if (parsed.components) {
                // Some generators might use "components" instead of "files"
                files = parsed.components.map((comp: any) => ({
                  path: comp.path || comp.name || `component-${files.length}.js`,
                  content: comp.content || comp.code || "// Content not available"
                }));
              } else if (parsed.pages) {
                // Some generators might use "pages"
                files = parsed.pages.map((page: any) => ({
                  path: page.path || page.name || `page-${files.length}.js`,
                  content: page.content || page.code || "// Content not available"
                }));
              }
              
              // Fallback: If we still have no files, create a minimal structure
              if (files.length === 0) {
                console.warn("No files found in JSON data, creating minimal structure");
                files = [
                  { path: "src/App.jsx", content: "// App component placeholder" },
                  { path: "src/index.jsx", content: "// Entry point placeholder" },
                  { path: "package.json", content: "// Package configuration placeholder" }
                ];
              }
              
              // Extract technologies if available
              const technologies = parsed.technologies || 
                                   parsed.tech || 
                                   parsed.techStack || 
                                   [];
              
              console.log(`Successfully parsed app data with ${files.length} files`);
              return {
                projectName,
                description,
                files,
                technologies,
                explanation: parsed.explanation || ""
              };
            }
          } catch (parseError) {
            console.error("JSON parse error:", parseError);
            // Continue with fallback approach
          }
        }
        
        // Step 3: Fallback - use heuristics to extract information if JSON parsing failed
        console.log("Using fallback extraction method");
        
        // Try to extract project name
        const nameMatch = content.match(/project(?:Name|Title)?[":]\s*["']?([\w\s-]+)["']?/i) ||
                          content.match(/I've generated a[n]?\s+(?:full-stack\s+)?application:?\s*["']?([\w\s-]+)["']?/i);
        
        const projectName = nameMatch ? nameMatch[1].trim() : "Generated App";
        
        // Try to extract description
        const descMatch = content.match(/description[":]\s*["']?(.*?)["']?(?:[,}]|$)/i) ||
                          content.match(/I've generated a[n]?\s+(?:full-stack\s+)?application.*?\n+(.*?)(?:\n|$)/i);
                          
        const description = descMatch ? descMatch[1].trim() : "Generated application";
        
        // Try to find file paths and create placeholder content
        const pathMatches = [...content.matchAll(/["']?path["']?:\s*["']([^"']+)["']/g)];
        const filePathMatches = [...content.matchAll(/(\w+\.(js|jsx|ts|tsx|css|html))(?:\s|"|'|,|$)/g)];
        
        let extractedFiles: GeneratedFile[] = [];
        
        // Add files from path properties
        if (pathMatches.length > 0) {
          extractedFiles = pathMatches.map(match => ({
            path: match[1],
            content: "// Content extracted based on path patterns"
          }));
        }
        // Add files from direct mentions in text
        else if (filePathMatches.length > 0) {
          extractedFiles = filePathMatches.map(match => ({
            path: match[1],
            content: "// Content extracted based on filename patterns"
          }));
        }
        // Create minimal placeholders if nothing else worked
        else {
          extractedFiles = [
            { path: "src/App.jsx", content: "// App component" },
            { path: "src/index.jsx", content: "// Entry point" },
            { path: "package.json", content: "// Package configuration" }
          ];
        }
        
        console.log("Fallback extraction created", extractedFiles.length, "file placeholders");
        
        return {
          projectName,
          description,
          files: extractedFiles,
          technologies: [],
          explanation: "Generated based on available information"
        };
      } catch (error) {
        console.error("Failed to parse app data:", error);
        return {
          projectName: "Generated Application",
          description: "An application was generated but details couldn't be fully extracted",
          files: [
            { path: "README.md", content: "# Generated Application\n\nThis is a placeholder for the generated application content." }
          ],
          technologies: [],
          explanation: "Please review the message content for application details"
        };
      }
    };
    
    const data = extractAppData();
    setAppData(data);
    console.log("App data extraction result:", data ? "success" : "failed");
  }, [message]);
  
  if (!appData) {
    console.error("Could not parse app data from message, falling back to simple display");
    return (
      <div className="my-6">
        <h3 className="text-xl font-semibold mb-4">Generated Application</h3>
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-between py-6 mb-4"
          onClick={() => {
            // Try one more time with direct message content - last resort
            try {
              const lastResortApp = {
                projectName: "Generated Application",
                description: "Application generated from message content",
                files: [
                  { path: "README.md", content: message.content }
                ]
              };
              
              const artifactFiles = [
                {
                  id: `file-readme`,
                  name: "README.md",
                  path: "README.md",
                  language: "markdown",
                  content: message.content
                }
              ];
              
              openArtifact({
                id: `artifact-${Date.now()}`,
                title: "Generated Application",
                description: "Application code from message content",
                files: artifactFiles
              });
              
              toast({
                title: "Code Viewer",
                description: "Opened message content as README file"
              });
            } catch (error) {
              console.error("Final fallback failed:", error);
              toast({
                title: "Error",
                description: "Unable to parse application data. Please try generating the app again.",
                variant: "destructive"
              });
            }
          }}
        >
          <div className="flex items-center">
            <Code className="mr-3 h-5 w-5" />
            <span className="font-medium text-lg">View code</span>
          </div>
          <ChevronRight className="h-5 w-5" />
        </Button>
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>
    );
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
    console.log("handleViewFullProject called");
    
    if (!appData || !appData.files || appData.files.length === 0) {
      console.error("Cannot open artifact: No files available");
      toast({
        variant: "destructive",
        title: "Error",
        description: "No files available to view"
      });
      return;
    }
    
    try {
      const artifactFiles = appData.files.map((file, index) => {
        const path = file.path || `file-${index}.txt`;
        const content = file.content || "// Content not available";
        
        return {
          id: `file-${index}`,
          name: path.split('/').pop() || `file-${index}`,
          path: path,
          language: getLanguageFromPath(path),
          content: content
        };
      });

      console.log(`Opening artifact with ${artifactFiles.length} files`);
      
      openArtifact({
        id: `artifact-${Date.now()}`,
        title: appData.projectName,
        description: appData.description,
        files: artifactFiles
      });
      
      toast({
        title: "Code Viewer",
        description: `Opened ${artifactFiles.length} files for ${appData.projectName}`
      });
    } catch (error) {
      console.error("Error opening artifact:", error);
      
      // Fallback approach - open a simplified artifact with README
      try {
        const fallbackFiles = [
          {
            id: "file-readme",
            name: "README.md",
            path: "README.md",
            language: "markdown",
            content: `# ${appData.projectName}\n\n${appData.description}\n\n${
              appData.files.map(f => `- ${f.path}`).join('\n')
            }`
          }
        ];
        
        // Add at least one code file if possible
        if (appData.files.length > 0) {
          const firstFile = appData.files[0];
          fallbackFiles.push({
            id: "file-0",
            name: firstFile.path.split('/').pop() || "file-0",
            path: firstFile.path,
            language: getLanguageFromPath(firstFile.path),
            content: firstFile.content || "// Content not available"
          });
        }
        
        openArtifact({
          id: `artifact-${Date.now()}`,
          title: appData.projectName,
          description: appData.description,
          files: fallbackFiles
        });
        
        toast({
          title: "Code Viewer (Simplified)",
          description: `Opened simplified view for ${appData.projectName}`
        });
      } catch (fallbackError) {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to open code: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }
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
        <h3 className="text-xl font-semibold mb-2">I've generated a full-stack application: {appData.projectName}</h3>
        <p className="text-gray-600">{appData.description}</p>
      </div>
      
      <Button
        className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-between py-6"
        onClick={handleViewFullProject}
      >
        <div className="flex items-center">
          <Eye className="mr-2 h-5 w-5" />
          <Code className="mr-3 h-5 w-5" />
          <span className="font-medium text-lg">View code</span>
        </div>
        <ChevronRight className="h-5 w-5" />
      </Button>
      
      <div className="space-y-4">
        <h4 className="font-semibold">This application includes:</h4>
        <ol className="list-decimal pl-6 space-y-2">
          {appData.files.length > 0 && (
            <li>
              <span className="font-medium">{appData.files.length} files</span> organized in a structured project
            </li>
          )}
          {appData.technologies && appData.technologies.length > 0 && (
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
    </div>
  );
};

export default AppGeneratorDisplay;
