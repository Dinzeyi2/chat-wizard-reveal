import { useState, useRef } from "react";
import { ArrowUp, Paperclip, X, Palette, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUiScraper } from "@/hooks/use-ui-scraper";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

interface InputAreaProps {
  onSendMessage: (message: string) => void;
  loading: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, loading }) => {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [perplexityApiKey, setPerplexityApiKey] = useState("");
  const [showPerplexityDialog, setShowPerplexityDialog] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const { findDesignCode, isLoading: isScraperLoading } = useUiScraper({
    onSuccess: (data) => {
      if (data.code) {
        const enhancedPrompt = `
I have a design code from Perplexity AI for a ${data.requirements?.componentType || 'component'}.
Please use this code as a reference for creating my application:

\`\`\`
${data.code}
\`\`\`

Based on this design, please ${message}
`;
        onSendMessage(enhancedPrompt);
        setShowPerplexityDialog(false);
        toast({
          title: "Design Search Complete",
          description: "Using the found design as a reference for your request",
        });
      }
    }
  });

  const handleSubmit = async () => {
    if (message.trim() || files.length > 0) {
      onSendMessage(message);
      setMessage("");
      setFiles([]);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (uploadInputRef?.current) {
      uploadInputRef.current.value = "";
    }
  };
  
  const handleSearchDesigns = async () => {
    // First check if we have a stored API key in Supabase
    try {
      const { data, error } = await supabase.functions.invoke('get-env', {
        body: { key: 'PERPLEXITY_API_KEY' }
      });
      
      if (!error && data?.value) {
        // We have an API key stored, use it
        setShowPerplexityDialog(true);
      } else {
        // No API key, prompt user
        setApiKeyDialogOpen(true);
      }
    } catch (error) {
      // Fallback to dialog if we can't check
      setApiKeyDialogOpen(true);
    }
  };
  
  const handleSaveApiKey = async () => {
    if (!perplexityApiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter a valid Perplexity API key",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Store the API key in Supabase secrets
      const { error } = await supabase.functions.invoke('set-env', {
        body: { key: 'PERPLEXITY_API_KEY', value: perplexityApiKey }
      });
      
      if (error) throw error;
      
      toast({
        title: "API Key Saved",
        description: "Your Perplexity API key has been securely saved"
      });
      
      setApiKeyDialogOpen(false);
      setShowPerplexityDialog(true);
    } catch (error) {
      toast({
        title: "Error Saving API Key",
        description: "Could not save your API key. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handlePerplexitySearch = async () => {
    if (!message.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a design request first",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Get the stored API key
      const { data, error } = await supabase.functions.invoke('get-env', {
        body: { key: 'PERPLEXITY_API_KEY' }
      });
      
      if (error || !data?.value) {
        setApiKeyDialogOpen(true);
        return;
      }
      
      await findDesignCode(message, data.value);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not perform design search. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full p-4">
      <PromptInput
        value={message}
        onValueChange={setMessage}
        isLoading={loading || isScraperLoading}
        onSubmit={handleSubmit}
        className="w-full"
      >
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="bg-secondary flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
              >
                <Paperclip className="size-4" />
                <span className="max-w-[120px] truncate">{file.name}</span>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="hover:bg-secondary/50 rounded-full p-1"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <PromptInputTextarea placeholder="Ask anything..." />

        <PromptInputActions className="flex items-center justify-between gap-2 pt-2">
          <div className="flex gap-2">
            <TooltipProvider>
              <PromptInputAction tooltip="Attach files">
                <label
                  htmlFor="file-upload"
                  className="hover:bg-secondary-foreground/10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-2xl"
                >
                  <input
                    ref={uploadInputRef}
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <Paperclip className="text-primary size-5" />
                </label>
              </PromptInputAction>
            </TooltipProvider>
            
            <TooltipProvider>
              <PromptInputAction tooltip="Search UI Designs with Perplexity AI">
                <button 
                  onClick={handleSearchDesigns}
                  className="hover:bg-secondary-foreground/10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-2xl"
                  disabled={loading || isScraperLoading}
                >
                  <Palette className="text-primary size-5" />
                </button>
              </PromptInputAction>
            </TooltipProvider>
            
            <Button variant="outline" size="sm" className="rounded-full">Search</Button>
            <Button variant="outline" size="sm" className="rounded-full">Reason</Button>
            <Button variant="outline" size="sm" className="hidden md:flex rounded-full">Deep research</Button>
            <Button variant="outline" size="sm" className="hidden md:flex rounded-full">Create image</Button>
          </div>

          <TooltipProvider>
            <PromptInputAction tooltip={loading ? "Stop generation" : "Send message"}>
              <Button
                variant="default"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={handleSubmit}
              >
                <ArrowUp className="size-5" />
              </Button>
            </PromptInputAction>
          </TooltipProvider>
        </PromptInputActions>
      </PromptInput>
      
      <div className="text-xs text-center mt-2 text-gray-500">
        ChatGPT can make mistakes. Check important info.
      </div>
      
      {/* API Key Dialog */}
      <Dialog open={apiKeyDialogOpen} onOpenChange={setApiKeyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Perplexity AI API Key</DialogTitle>
            <DialogDescription>
              Enter your Perplexity AI API key to enable UI design scraping.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="perplexity-api-key">API Key</Label>
              <Input
                id="perplexity-api-key"
                type="password"
                placeholder="pplx-xxxxxxxxxxxxxxxxxxxxxxxx"
                value={perplexityApiKey}
                onChange={(e) => setPerplexityApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Your API key will be stored securely in Supabase environment variables.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setApiKeyDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveApiKey}>Save API Key</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Perplexity Search Dialog */}
      <Dialog open={showPerplexityDialog} onOpenChange={setShowPerplexityDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Search UI Designs</DialogTitle>
            <DialogDescription>
              Use Perplexity AI to search for UI designs matching your prompt.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4 text-sm">
              Current prompt: <span className="font-medium">{message}</span>
            </p>
            <p className="mb-6 text-sm">
              Perplexity AI will search for UI components that match your prompt
              from design systems like shadcn/ui, Tailwind UI, and others.
            </p>
            <div className="flex flex-col gap-4">
              <Button 
                onClick={handlePerplexitySearch}
                disabled={isScraperLoading || loading}
                className="w-full"
              >
                {isScraperLoading ? (
                  <>
                    <span className="animate-spin mr-2">
                      <Code className="size-4" />
                    </span>
                    Searching designs...
                  </>
                ) : (
                  <>
                    <Palette className="mr-2 size-4" />
                    Find UI Designs
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowPerplexityDialog(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InputArea;
