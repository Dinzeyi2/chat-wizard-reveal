
import React, { useState, useEffect } from "react";
import { Message } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileCode, ChevronRight, ChevronDown, ShoppingBag, Code, SquareDashed, History } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { useArtifact } from "./artifact/ArtifactSystem";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
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
  projectId?: string;
  version?: number;
}

interface AppGeneratorDisplayProps {
  message: Message;
  projectId?: string | null;
}

const AppGeneratorDisplay: React.FC<AppGeneratorDisplayProps> = ({ message, projectId: propProjectId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { openArtifact } = useArtifact();
  const [appData, setAppData] = useState<GeneratedApp | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const { toast } = useToast();
  
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
            
            // Include the project ID if provided from props or found in JSON
            const extractedData = {
              ...jsonData,
              projectId: propProjectId || jsonData.projectId || null
            };
            
            return extractedData;
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
                technologies: jsonData.technologies || [],
                projectId: propProjectId || jsonData.projectId || null,
                version: jsonData.version || 1
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
  }, [message, propProjectId]);
  
  useEffect(() => {
    // Load version history when project ID is available and when showVersionHistory becomes true
    if (showVersionHistory && (appData?.projectId || propProjectId)) {
      fetchVersionHistory();
    }
  }, [showVersionHistory, appData?.projectId, propProjectId]);

  // Function to fetch version history from Supabase
  const fetchVersionHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const projectId = appData?.projectId || propProjectId;
      
      if (!projectId) {
        console.error("No project ID available to fetch history");
        return;
      }
      
      console.log("Fetching version history for project:", projectId);
      
      // Fetch all versions of this project
      const { data: versions, error } = await supabase
        .from('app_projects')
        .select('*')
        .eq('id', projectId)
        .order('version', { ascending: false });
      
      if (error) {
        console.error("Error fetching project versions:", error);
        throw error;
      }
      
      // Also fetch versions where this project is a parent
      const { data: childVersions, error: childError } = await supabase
        .from('app_projects')
        .select('*')
        .eq('parent_id', projectId)
        .order('version', { ascending: false });
      
      if (childError) {
        console.error("Error fetching child versions:", childError);
        throw childError;
      }
      
      console.log("Fetched versions:", versions?.length || 0, "child versions:", childVersions?.length || 0);
      
      // Combine and sort all versions
      const allVersions = [...(versions || []), ...(childVersions || [])];
      allVersions.sort((a, b) => b.version - a.version);
      
      setVersionHistory(allVersions);
    } catch (error) {
      console.error("Error fetching version history:", error);
      toast({
        title: "Error fetching version history",
        description: "Could not load project versions",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Function to handle restoring a specific version
  const handleRestoreVersion = async (versionData: any) => {
    try {
      toast({
        title: "Restoring version...",
        description: `Restoring to version ${versionData.version}`,
      });
      
      console.log("Restoring version:", versionData.version, "with ID:", versionData.id);
      
      const { data, error } = await supabase.functions.invoke('restore-version', {
        body: { 
          projectId: versionData.id,
        }
      });
      
      if (error) {
        console.error("Error from restore-version function:", error);
        throw error;
      }
      
      console.log("Restore version response:", data);
      
      toast({
        title: "Version restored",
        description: `Successfully restored to version ${versionData.version}`,
      });
      
      // Ask the user to submit a new message to see the restored version
      toast({
        title: "Ask the assistant",
        description: "Send a message to see your restored application",
      });
      
    } catch (error) {
      console.error("Error restoring version:", error);
      toast({
        title: "Error restoring version",
        description: "Could not restore to selected version",
        variant: "destructive",
      });
    }
  };
  
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

  // Enhanced version of formatExplanationText to completely remove all markdown symbols
  const formatExplanationText = (text: string) => {
    if (!text) return null;

    // Split the explanation into paragraphs
    const paragraphs = text.split('\n\n');
    
    return (
      <div className="space-y-4">
        {paragraphs.map((paragraph, idx) => {
          // Check if paragraph is a heading (starts with # or ##)
          if (paragraph.trim().startsWith('# ')) {
            return <h3 key={idx} className="text-lg font-bold mt-4">{paragraph.replace(/^# /, '')}</h3>;
          } 
          if (paragraph.trim().startsWith('## ')) {
            return <h4 key={idx} className="text-md font-semibold mt-3">{paragraph.replace(/^## /, '')}</h4>;
          }
          if (paragraph.trim().startsWith('### ')) {
            return <h5 key={idx} className="text-base font-semibold mt-2">{paragraph.replace(/^### /, '')}</h5>;
          }
          
          // Check if paragraph is a list
          if (paragraph.includes('\n- ') || paragraph.includes('\n* ')) {
            const listItems = paragraph.split(/\n[-*] /).filter(Boolean);
            return (
              <div key={idx}>
                {listItems[0].trim() && <p className="mb-2">{listItems[0].trim()}</p>}
                <ul className="list-disc pl-5 space-y-1">
                  {listItems.slice(listItems[0].trim() ? 1 : 0).map((item, i) => {
                    // Process nested formatting within list items (bold, italic)
                    let formattedItem = item;
                    
                    // Handle bold in list items
                    formattedItem = formattedItem.replace(/\*\*(.*?)\*\*|__(.*?)__/g, (_, p1, p2) => {
                      return `<strong>${p1 || p2}</strong>`;
                    });
                    
                    // Handle italic in list items
                    formattedItem = formattedItem.replace(/\*(.*?)\*|_(.*?)_/g, (_, p1, p2) => {
                      // Skip if this is part of a bold pattern we already replaced
                      if (!p1 && !p2) return _;
                      const content = p1 || p2;
                      return `<em>${content}</em>`;
                    });
                    
                    return <li key={i} dangerouslySetInnerHTML={{ __html: formattedItem }} />;
                  })}
                </ul>
              </div>
            );
          }
          
          // Format text with common markdown patterns
          let formattedText = paragraph;
          
          // Replace bold markdown (**text** or __text__)
          formattedText = formattedText.replace(/\*\*(.*?)\*\*|__(.*?)__/g, (_, p1, p2) => {
            const content = p1 || p2;
            return `<strong>${content}</strong>`;
          });
          
          // Replace italic markdown (*text* or _text_)
          formattedText = formattedText.replace(/\*(.*?)\*|_(.*?)_/g, (_, p1, p2) => {
            // Skip if this is part of a bold pattern we already replaced
            if (!p1 && !p2) return _;
            const content = p1 || p2;
            return `<em>${content}</em>`;
          });
          
          // Replace code/inline code markdown (`text`)
          formattedText = formattedText.replace(/`(.*?)`/g, (_, p1) => {
            return `<code class="px-1 py-0.5 bg-gray-100 rounded text-sm font-mono">${p1}</code>`;
          });
          
          // Replace links [text](url)
          formattedText = formattedText.replace(/\[(.*?)\]\((.*?)\)/g, (_, text, url) => {
            return `<a href="${url}" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">${text}</a>`;
          });
          
          // Use dangerouslySetInnerHTML to render the HTML tags
          return <p key={idx} dangerouslySetInnerHTML={{ __html: formattedText }} />;
        })}
      </div>
    );
  };

  // Completely rewritten handleViewFullProject to be more robust
  const handleViewFullProject = () => {
    console.log("Opening artifact viewer with message content:", message.content.substring(0, 100) + "...");
    console.log("Project ID:", appData?.projectId || propProjectId || "none");
    
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
      files: files,
      metadata: {
        projectId: appData?.projectId || propProjectId || null
      }
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
    if (!appData) return null;
    
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
    if (!appData) return [];
    
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

  // If no app data could be extracted, show a simple message
  if (!appData) {
    return (
      <div className="my-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <p className="text-gray-600">Unable to extract application data. Click the button below to view any code that might be available.</p>
        <Button 
          variant="outline" 
          className="mt-3" 
          onClick={handleViewFullProject}
        >
          <Code className="mr-2 h-4 w-4" /> View Available Code
        </Button>
      </div>
    );
  }

  // Detect if this is a modified app or an original generation
  const isModification = message.content.toLowerCase().includes('modified') || 
                        message.content.toLowerCase().includes('updated') || 
                        message.content.toLowerCase().includes('changed') ||
                        message.content.toLowerCase().includes("i've updated your app");

  return (
    <div className="my-6 space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">
          {isModification 
            ? `Your app has been updated with the requested changes` 
            : `I've generated a full-stack application: ${appData.projectName}`}
        </h3>
        <p className="text-gray-600">{isModification 
          ? "The changes you requested have been applied to your existing application."
          : appData.description}
        </p>
        
        {appData.version && (
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs font-normal">
              Version {appData.version}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2 text-xs bg-gray-50 hover:bg-gray-100"
              onClick={() => setShowVersionHistory(!showVersionHistory)}
            >
              <History className="h-3 w-3 mr-1" />
              {showVersionHistory ? "Hide History" : "Version History"}
            </Button>
          </div>
        )}
      </div>
      
      {showVersionHistory && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium mb-3">Version History</h4>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-sm text-gray-500">Loading version history...</span>
            </div>
          ) : versionHistory.length === 0 ? (
            <p className="text-sm text-gray-500 p-2">No version history available</p>
          ) : (
            <ScrollArea className="h-[250px]">
              <div className="space-y-3">
                {versionHistory.map((version, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-100">
                    <div>
                      <p className="text-sm font-medium">Version {version.version}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(version.created_at).toLocaleDateString()} {new Date(version.created_at).toLocaleTimeString()}
                      </p>
                      {version.modification_prompt && (
                        <p className="text-xs text-gray-600 mt-1 italic max-w-[300px] truncate">"{version.modification_prompt}"</p>
                      )}
                    </div>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="h-8 ml-2"
                      onClick={() => handleRestoreVersion(version)}
                    >
                      Restore
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
      
      <div className="bg-white border border-gray-200 rounded-full shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center">
          <SquareDashed className="mr-3 h-5 w-5 text-gray-500" />
          <span className="font-medium text-lg">{isModification ? "View updated code" : "View code"}</span>
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
      
      {!isModification && (
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
      )}
      
      {isModification ? (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-blue-800 font-medium">Your app has been successfully updated!</p>
          <p className="text-blue-600 text-sm mt-1">Click the "View updated code" button to see your modified code.</p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="explanation">
            <AccordionTrigger className="px-5 py-3 hover:bg-gray-50">Application Details</AccordionTrigger>
            <AccordionContent className="px-5 pb-4">
              <div className="text-sm space-y-2">
                {appData?.explanation ? (
                  formatExplanationText(appData.explanation)
                ) : (
                  <div className="space-y-4">
                    <p><strong>Architecture Overview:</strong> This {appData?.projectName || "generated"} application follows a modern web architecture with a clean separation of concerns.</p>
                    
                    <p><strong>Frontend:</strong> The UI is built with React components organized in a logical hierarchy, with pages for different views and reusable components for common elements.</p>
                    
                    <p><strong>Data Management:</strong> The application handles data through state management and API calls to backend services.</p>
                    
                    <h4 className="text-md font-semibold mt-4">Key Technical Features:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>React components for UI building blocks</li>
                      <li>State management for application data</li>
                      <li>API integration for data fetching</li>
                      <li>Responsive design for all device sizes</li>
                    </ul>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
};

export default AppGeneratorDisplay;
