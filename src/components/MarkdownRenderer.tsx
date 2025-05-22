import React, { useState, useEffect } from "react";
import { Message } from "@/types/chat";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { useArtifact } from "./artifact/ArtifactSystem";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

// Ensure marked uses synchronous mode for type safety
marked.setOptions({
  async: false
});

interface MarkdownRendererProps {
  content: string;
  message?: Message;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, message }) => {
  // Add state to track if an app has been generated in this message
  const [hasGeneratedApp, setHasGeneratedApp] = useState(false);
  const [hasGeneratedChallengeCode, setHasGeneratedChallengeCode] = useState(false);
  const [cleanedContent, setCleanedContent] = useState(content);
  const [activeTab, setActiveTab] = useState<string>("content");
  // Get artifact system context to open code viewer
  const { openArtifact } = useArtifact();
  
  // Effect to check if this message indicates app generation or code challenge
  useEffect(() => {
    // Check if this is a full app generation message
    if (message && 
        message.role === "assistant" && 
        message.metadata?.projectId && 
        (content.includes("I've generated") || 
         content.includes("generated a full-stack application") ||
         content.includes("app generation successful"))) {
      setHasGeneratedApp(true);
      
      // When we detect app generation, automatically extract and open the code files
      if (message.metadata?.appData?.files) {
        try {
          const appData = message.metadata.appData;
          
          // Transform files into artifact format
          const artifactFiles = appData.files.map((file: any) => ({
            id: `file-${file.path.replace(/\//g, '-')}`,
            name: file.path.split('/').pop(),
            path: file.path,
            language: file.path.split('.').pop() || 'js',
            content: file.content,
            isComplete: file.isComplete !== false // Default to true unless explicitly set to false
          }));
          
          // Create an artifact object with ONLY code, no explanations
          const artifact = {
            id: message.metadata.projectId,
            title: appData.projectName || "Generated App",
            description: "Generated application code",
            files: artifactFiles,
            isPartialProject: false
          };
          
          // Open the artifact viewer immediately when we detect app generation
          openArtifact(artifact);
        } catch (error) {
          console.error("Failed to automatically open app code:", error);
        }
      }
    }
    
    // Check if this is a code challenge / partial project message
    if (message && 
        message.role === "assistant" && 
        (content.includes("partial implementation") || 
         content.includes("code challenge") || 
         content.includes("coding challenges") ||
         content.includes("incomplete project"))) {
      
      setHasGeneratedChallengeCode(true);
      
      // Check if we have challenge data in the message metadata
      if (message.metadata?.challengeData) {
        try {
          const challengeData = message.metadata.challengeData;
          
          // Transform files into artifact format with challenge metadata
          const artifactFiles = challengeData.files.map((file: any) => ({
            id: `file-${file.path.replace(/\//g, '-')}`,
            name: file.path.split('/').pop(),
            path: file.path,
            language: file.path.split('.').pop() || 'js',
            content: file.content,
            isComplete: file.isComplete !== false, // Default to true unless explicitly set to false
            challenges: file.challenges || []
          }));
          
          // Create an artifact object
          const artifact = {
            id: message.id || `challenge-${Date.now()}`,
            title: challengeData.projectName || "Code Challenge",
            description: challengeData.description || "Intentionally incomplete code",
            files: artifactFiles,
            isPartialProject: true,
            projectPrompt: message.metadata.prompt || challengeData.description
          };
          
          // Open the artifact viewer
          openArtifact(artifact);
        } catch (error) {
          console.error("Failed to automatically open challenge code:", error);
        }
      }
    }
  }, [message, content, openArtifact]);

  // Effect to update content display based on app generation
  useEffect(() => {
    if (hasGeneratedApp || hasGeneratedChallengeCode) {
      // Clean the content by removing JSON and code blocks to keep only explanations
      const cleanContent = content
        .replace(/```json[\s\S]*?```/g, "[App code is available in the editor above]")
        .replace(/```(?:js|jsx|ts|tsx|html|css)[\s\S]*?```/g, "[Code is available in the editor above]");
      
      setCleanedContent(cleanContent);
    } else {
      setCleanedContent(content);
    }
  }, [content, hasGeneratedApp, hasGeneratedChallengeCode]);

  // Function to apply code updates when suggested by the AI
  const handleApplyCodeUpdate = () => {
    if (message?.metadata?.codeUpdate) {
      // Create a temporary artifact with the updated code
      const artifactFiles = [
        {
          id: `file-updated-code`,
          name: 'updated-code.js', // Default name
          path: 'updated-code.js',
          language: 'javascript', // Default language
          content: message.metadata.codeUpdate
        }
      ];
      
      // Create an artifact object
      const artifact = {
        id: `code-update-${Date.now()}`,
        title: "Code Update",
        description: "Suggested code update",
        files: artifactFiles
      };
      
      // Open the artifact viewer with the updated code
      openArtifact(artifact);
      
      // Set the active tab to the code tab
      setActiveTab("code");
    }
  };

  // Process content with syntax highlighting
  const processContent = (markdown: string) => {
    // Use marked's synchronous parsing to avoid TypeScript errors
    const rawHtml = marked.parse(markdown, { async: false });
    
    // Sanitize HTML to prevent XSS attacks
    const sanitizedHtml = DOMPurify.sanitize(rawHtml);
    
    return sanitizedHtml;
  };

  // Check if this message has code updates
  const hasCodeUpdate = message?.metadata?.codeUpdate;

  // Show a cleaner view for challenge code messages
  if (message && message.role === "assistant" && hasGeneratedChallengeCode) {
    return (
      <div>
        <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
          <p className="font-medium text-amber-800">
            I've created a partial implementation for you to complete. View the code and challenges in the editor above.
          </p>
        </div>
        <div dangerouslySetInnerHTML={{ __html: processContent(cleanedContent) }} />
      </div>
    );
  }

  // Show a cleaner view for app generation messages
  if (message && message.role === "assistant" && hasGeneratedApp) {
    return (
      <div>
        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="font-medium text-blue-800">
            Application code is ready! View it in the code editor above.
          </p>
        </div>
        <div dangerouslySetInnerHTML={{ __html: processContent(cleanedContent) }} />
      </div>
    );
  }

  // If this message has code updates, show tabs with content and code
  if (hasCodeUpdate) {
    return (
      <div className="space-y-4">
        <div dangerouslySetInnerHTML={{ __html: processContent(cleanedContent) }} />
        
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">Suggested Code Update</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList>
                <TabsTrigger value="content">Explanation</TabsTrigger>
                <TabsTrigger value="code">Code</TabsTrigger>
              </TabsList>
              <TabsContent value="content">
                <p className="text-sm text-gray-700 py-2">
                  I've prepared some code updates based on your request. You can view the updated code in the "Code" tab.
                </p>
                <Button onClick={handleApplyCodeUpdate} className="mt-2">
                  View Suggested Code
                </Button>
              </TabsContent>
              <TabsContent value="code">
                <div className="bg-gray-100 p-4 rounded overflow-auto max-h-[400px]">
                  <pre className="text-xs">
                    <code>{message?.metadata?.codeUpdate}</code>
                  </pre>
                </div>
                <Button onClick={handleApplyCodeUpdate} className="mt-4">
                  Open in Editor
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Regular rendering for normal content
  return <div dangerouslySetInnerHTML={{ __html: processContent(cleanedContent) }} />;
};

export default MarkdownRenderer;
