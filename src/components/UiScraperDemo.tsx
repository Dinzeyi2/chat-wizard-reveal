
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useUiScraper } from "@/hooks/use-ui-scraper";
import { Loader2, Search, Code, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { UICodeGenerator } from "@/utils/UICodeGenerator";

export function UiScraperDemo() {
  // State for API key and prompt
  const [perplexityApiKey, setPerplexityApiKey] = useState("");
  const [claudeApiKey, setClaudeApiKey] = useState("");
  const [prompt, setPrompt] = useState("");
  const [activeTab, setActiveTab] = useState("original");
  
  // State for demo mode (using Supabase Edge Functions instead of direct API calls)
  const [demoMode, setDemoMode] = useState(true);
  
  // State for UI Code Generator
  const [generationResult, setGenerationResult] = useState<any>(null);
  
  // Use the UI scraper hook
  const { 
    findDesignCode, 
    customizeDesignCode,
    isLoading, 
    error, 
    result, 
    customizedResult 
  } = useUiScraper();
  
  const { toast } = useToast();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt) {
      toast({
        title: "Error",
        description: "Please enter a prompt",
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (demoMode) {
        // Use Supabase Edge Function
        const { data, error } = await supabase.functions.invoke('design-code', {
          body: { prompt, action: "find" }
        });
        
        if (error) throw new Error(error.message);
        if (!data.success) throw new Error(data.error || "Failed to find design");
        
        // Set the active tab to "original" to show the found design
        setActiveTab("original");
        
        // Toast success
        toast({
          title: "Design Found",
          description: `Found ${data.requirements?.componentType || 'component'} design code`,
        });
        
        // Optional: Customize the design using Claude
        if (data.success) {
          const { data: customizedData, error: customizeError } = await supabase.functions.invoke('design-code', {
            body: { 
              action: "customize",
              prompt,
              designData: data
            }
          });
          
          if (customizeError) console.error("Error customizing design:", customizeError);
          
          // Set the active tab to "customized" to show the customized design if successful
          if (customizedData && customizedData.success) {
            setActiveTab("customized");
            setGenerationResult(customizedData);
            
            toast({
              title: "Design Customized",
              description: "Successfully customized the design code",
            });
          }
        }
      } else {
        // Direct API calls mode (requires API keys)
        if (!perplexityApiKey) {
          toast({
            title: "API Key Required",
            description: "Please enter your Perplexity API key",
            variant: "destructive"
          });
          return;
        }
        
        if (!claudeApiKey) {
          toast({
            title: "API Key Required",
            description: "Please enter your Claude API key for customization",
            variant: "destructive"
          });
          return;
        }
        
        // Use the integrated UICodeGenerator
        const generator = new UICodeGenerator({
          perplexityApiKey,
          claudeApiKey,
          debug: true
        });
        
        toast({
          title: "Generating UI Code",
          description: "Searching and customizing design...",
        });
        
        const result = await generator.generateCode(prompt);
        
        if (result.success) {
          setGenerationResult(result);
          setActiveTab("customized");
          
          toast({
            title: "Code Generation Complete",
            description: `Created ${result.metadata?.componentType || 'component'} code`,
          });
        } else {
          throw new Error(result.error || "Failed to generate code");
        }
      }
    } catch (err: any) {
      console.error("Error:", err);
      toast({
        title: "Error",
        description: err.message || "An error occurred",
        variant: "destructive"
      });
    }
  };

  // Function to format code with syntax highlighting
  const formatCode = (code: string | null | undefined) => {
    if (!code) return null;
    
    return (
      <pre className="rounded-md bg-gray-900 p-4 overflow-x-auto text-sm text-gray-50">
        <code>{code}</code>
      </pre>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">UI Design Scraper & Customizer</CardTitle>
          <CardDescription>
            Find and customize UI component code based on your requirements using Perplexity AI and Claude
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="prompt">Describe what you're looking for</Label>
              <Textarea
                id="prompt"
                placeholder="e.g., 'Create a beautiful dashboard with shadcn/ui that has a white theme'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            {!demoMode && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="perplexityApiKey">Perplexity API Key</Label>
                  <Input
                    id="perplexityApiKey"
                    type="password"
                    placeholder="pk-..."
                    value={perplexityApiKey}
                    onChange={(e) => setPerplexityApiKey(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="claudeApiKey">Claude API Key</Label>
                  <Input
                    id="claudeApiKey"
                    type="password"
                    placeholder="sk-ant-..."
                    value={claudeApiKey}
                    onChange={(e) => setClaudeApiKey(e.target.value)}
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="demoMode"
                        checked={demoMode}
                        onChange={() => setDemoMode(!demoMode)}
                        className="mr-2"
                      />
                      <Label htmlFor="demoMode" className="cursor-pointer">Use Demo Mode</Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Demo mode uses Supabase Edge Functions instead of direct API calls</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <div className="space-x-2">
                <Button variant="outline" type="reset" disabled={isLoading}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Generate UI Code
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {((result?.success || customizedResult?.success) || generationResult?.success) && (
        <Card>
          <CardHeader>
            <CardTitle>Design Results</CardTitle>
            <CardDescription>
              {generationResult?.metadata?.componentType ? (
                <>Generated {generationResult.metadata.componentType} component</>
              ) : result?.requirements?.componentType ? (
                <>Found {result.requirements.componentType} component</>
              ) : (
                <>Found component code</>
              )}
              {(result?.requirements?.designSystem || generationResult?.metadata?.designSystem) && (
                <> using {result?.requirements?.designSystem || generationResult?.metadata?.designSystem}</>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="original" disabled={!result?.success}>
                  <Code className="mr-2 h-4 w-4" />
                  Original
                </TabsTrigger>
                <TabsTrigger value="customized" disabled={!(customizedResult?.success || generationResult?.success)}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Customized
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="original">
                {result?.code ? (
                  <ScrollArea className="h-[600px] w-full rounded-md">
                    {formatCode(result.code)}
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No code found yet. Try searching for a design.
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="customized">
                {(customizedResult?.success || generationResult?.success) ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium">Frontend Code</h3>
                      <ScrollArea className="h-[300px] w-full rounded-md">
                        {formatCode(generationResult?.result?.code?.frontend || customizedResult?.customizedCode?.frontend)}
                      </ScrollArea>
                    </div>
                    
                    {(generationResult?.result?.code?.backend || customizedResult?.customizedCode?.backend) && (
                      <div>
                        <h3 className="text-lg font-medium">Backend Code</h3>
                        <ScrollArea className="h-[200px] w-full rounded-md">
                          {formatCode(generationResult?.result?.code?.backend || customizedResult?.customizedCode?.backend)}
                        </ScrollArea>
                      </div>
                    )}
                    
                    {(generationResult?.result?.explanation || customizedResult?.explanation) && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-md">
                        <h3 className="text-lg font-medium mb-2">Explanation</h3>
                        <p className="text-gray-700">{generationResult?.result?.explanation || customizedResult?.explanation}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No customized code yet. Use Claude API to customize the design.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-gray-500">
              {result?.requirements?.styles && result.requirements.styles.length > 0 && (
                <>Style: {result.requirements.styles.join(', ')}</>
              )}
            </div>
            <Button variant="outline" onClick={() => {
              // Copy code to clipboard
              const codeToCopy = activeTab === 'original' 
                ? result?.code 
                : (generationResult?.result?.code?.frontend || customizedResult?.customizedCode?.frontend);
              
              if (codeToCopy) {
                navigator.clipboard.writeText(codeToCopy);
                toast({ title: "Copied to clipboard" });
              }
            }}>
              Copy Code
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {error && (
        <Card className="mt-4 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error.message}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
