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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

interface IssueOption {
  id: string;
  title: string;
  description: string;
  type: 'implementation' | 'bugfix' | 'feature';
}

const AppGeneratorDisplay: React.FC<AppGeneratorDisplayProps> = ({ message, projectId: propProjectId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { openArtifact } = useArtifact();
  const [appData, setAppData] = useState<GeneratedApp | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Common app issues that need addressing
  const commonIssues: IssueOption[] = [
    {
      id: 'auth-implementation',
      title: 'Implement Authentication',
      description: 'Implement shadcn/ui design for sign-in, sign-up, and login functionality',
      type: 'implementation'
    },
    {
      id: 'profile-settings',
      title: 'Set Up Profile Settings',
      description: 'Create a page where users can manage their profile information',
      type: 'feature'
    },
    {
      id: 'ui-fixes',
      title: 'Fix UI Issues',
      description: 'Address styling and responsiveness issues in the generated application',
      type: 'bugfix'
    }
  ];
  
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
    
    console.log("Extracted code blocks:", codeFiles.length);
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

  // Function to handle issue selection
  const handleIssueSelect = (issueId: string) => {
    setSelectedIssue(issueId);
    // Notify the user about their selection
    toast({
      title: "Option selected",
      description: `You've selected: ${commonIssues.find(issue => issue.id === issueId)?.title}. Tell the assistant to begin implementation.`,
    });
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

  // Modified function to handle viewing the full project
  const handleViewFullProject = () => {
    try {
      console.log("Opening artifact viewer with message content:", message.content.substring(0, 100) + "...");
      
      // Create a guaranteed artifact ID
      const artifactId = `artifact-${Date.now()}`;
      // Default title that will always work
      const projectTitle = appData?.projectName || "Generated Application";
      
      // Try extracting code blocks first as the primary method
      const extractedFiles = extractCodeBlocks();
      console.log("Extracted files count:", extractedFiles.length);
      
      // Create final files array with proper structure
      let files = [];
      
      if (extractedFiles && extractedFiles.length > 0) {
        console.log("Using extracted code blocks, count:", extractedFiles.length);
        files = extractedFiles;
      } 
      // If no extracted files, but we have appData, use those files
      else if (appData?.files && appData.files.length > 0) {
        console.log("Using appData files, count:", appData.files.length);
        files = appData.files.map((file, index) => ({
          id: `file-${index}`,
          name: file.path.split('/').pop() || `file-${index}`,
          path: file.path,
          language: getLanguageFromPath(file.path),
          content: file.content
        }));
      }
      // Ultimate fallback - create at least one file with the message content
      else {
        console.log("Using ultimate fallback - creating content file");
        files = [{
          id: "content-file",
          name: "generated-content.md",
          path: "generated-content.md",
          language: "markdown",
          content: message.content
        }];
      }
      
      // Ensure we have at least one file
      if (files.length === 0) {
        files = [{
          id: "fallback-file",
          name: "content.md",
          path: "content.md",
          language: "markdown",
          content: "No code content could be extracted. Please check the message content."
        }];
      }
      
      // Log what we're actually opening
      console.log(`Opening artifact with ${files.length} files:`, 
        files.map(f => f.path).join(', '));
      
      // Ensure we have a valid artifact to open
      const artifact = {
        id: artifactId,
        title: projectTitle,
        description: appData?.description || "Generated application",
        files: files
      };
      
      // Call the openArtifact function
      console.log("Calling openArtifact with artifact:", artifact.id);
      openArtifact(artifact);
      
      // If we get here, we should show a message to the user
      toast({
        title: "Code viewer opened",
        description: `Displaying ${files.length} code files`
      });
    } catch (error) {
      console.error("Error opening artifact:", error);
      toast({
        variant: "destructive",
        title: "Error opening code viewer",
        description: "Failed to open the code viewer. Please try again."
      });
    }
  };

  // Function to get the language from file path
  const getLanguageFromPath = (path: string) => {
    const extension = path.split('.').pop()?.toLowerCase() || '';
    const extensionMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'jsx',
      'ts': 'typescript',
      'tsx': 'tsx',
      'md': 'markdown',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'py': 'python',
      'rb': 'ruby'
    };
    
    return extensionMap[extension] || 'plaintext';
  };

  // If no app data, don't render the component
  if (!appData) {
    return null;
  }

  return (
    <div className="my-4 border border-gray-200 rounded-lg">
      <div className="p-4 bg-white rounded-t-lg">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Code className="w-4 h-4" /> {appData.projectName || "Generated Application"}
        </h3>
        <p className="text-sm text-gray-600 mt-1">{appData.description}</p>
        
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={handleViewFullProject}>
            <FileCode className="w-4 h-4 mr-1" /> View Code
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setShowVersionHistory(!showVersionHistory)}
          >
            <History className="w-4 h-4 mr-1" /> 
            {showVersionHistory ? "Hide Version History" : "Show Version History"}
          </Button>
        </div>

        {showVersionHistory && (
          <div className="mt-4 border border-gray-100 rounded p-3 bg-gray-50">
            <h4 className="text-sm font-medium mb-2">Version History</h4>
            {isLoadingHistory ? (
              <div className="flex space-x-2 py-2">
                <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            ) : versionHistory.length > 0 ? (
              <ul className="space-y-2 max-h-64 overflow-y-auto text-sm">
                {versionHistory.map((version) => (
                  <li key={version.id} className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <div>
                      <span className="font-medium">Version {version.version}</span>
                      <div className="text-xs text-gray-500">
                        {new Date(version.created_at).toLocaleString()}
                      </div>
                      {version.modification_prompt && (
                        <div className="text-xs italic mt-0.5 text-gray-600">
                          "{version.modification_prompt.length > 50 
                            ? version.modification_prompt.substring(0, 50) + "..." 
                            : version.modification_prompt}"
                        </div>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-xs h-7"
                      onClick={() => handleRestoreVersion(version)}
                    >
                      Restore
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No version history available.</p>
            )}
          </div>
        )}

        {/* App Explanation Section */}
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="mt-4 border border-gray-100 rounded"
        >
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-t cursor-pointer hover:bg-gray-100">
              <h4 className="text-sm font-medium">About this App</h4>
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="p-3 text-sm space-y-2">
            {appData.explanation ? (
              <ScrollArea className="h-64 rounded-md border p-4">
                {formatExplanationText(appData.explanation)}
              </ScrollArea>
            ) : (
              <p className="text-gray-500">No additional information available for this application.</p>
            )}
          </CollapsibleContent>
        </Collapsible>
        
        {/* New section: Common app improvement options */}
        <div className="mt-6 mb-2">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>App generation complete</AlertTitle>
            <AlertDescription>
              Your application needs some improvements. Choose an option below to get started:
            </AlertDescription>
          </Alert>
          
          <div className="grid gap-4 mt-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1">
            {commonIssues.map((issue) => (
              <Card 
                key={issue.id} 
                className={`cursor-pointer transition-all ${selectedIssue === issue.id ? 'border-primary ring-1 ring-primary' : 'hover:border-gray-300'}`}
                onClick={() => handleIssueSelect(issue.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{issue.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">{issue.description}</p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Badge variant={selectedIssue === issue.id ? "default" : "outline"}>
                    {selectedIssue === issue.id ? "Selected" : issue.type}
                  </Badge>
                </CardFooter>
              </Card>
            ))}
          </div>
          
          {selectedIssue && (
            <p className="mt-4 text-sm text-muted-foreground">
              You've selected: <span className="font-medium">{commonIssues.find(i => i.id === selectedIssue)?.title}</span>. 
              Tell the assistant to begin implementing this feature.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppGeneratorDisplay;
