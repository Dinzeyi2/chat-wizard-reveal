
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, ArrowUp, Plus, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Icons } from "@/components/ui/icons";
import { supabase } from "@/integrations/supabase/client";
import { isGithubConnected } from "@/utils/githubAuth";

interface InputAreaProps {
  onSendMessage: (message: string) => void;
  loading?: boolean;
}

const InputArea = ({ onSendMessage, loading = false }: InputAreaProps) => {
  const [message, setMessage] = useState("");
  const [showRepoDialog, setShowRepoDialog] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkGithubConnection = async () => {
      const connected = await isGithubConnected();
      setGithubConnected(connected);
    };

    checkGithubConnection();
  }, []);

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const importRepository = async () => {
    if (!repoUrl.trim()) {
      toast({
        variant: "destructive",
        title: "Repository URL required",
        description: "Please enter a valid GitHub repository URL",
      });
      return;
    }

    try {
      setIsImporting(true);

      // Extract owner and repo from URL
      // Support formats like:
      // https://github.com/owner/repo
      // https://github.com/owner/repo.git
      // git@github.com:owner/repo.git
      let owner = "";
      let repo = "";

      if (repoUrl.includes("github.com")) {
        const urlParts = repoUrl
          .replace("https://github.com/", "")
          .replace("http://github.com/", "")
          .replace("git@github.com:", "")
          .replace(".git", "")
          .split("/");

        if (urlParts.length >= 2) {
          owner = urlParts[0];
          repo = urlParts[1];
        }
      }

      if (!owner || !repo) {
        throw new Error(
          "Invalid GitHub URL format. Please use https://github.com/owner/repo"
        );
      }

      const { data, error } = await supabase.functions.invoke("fetch-github-repo", {
        body: { owner, repo },
      });

      if (error) throw error;

      setShowRepoDialog(false);
      setRepoUrl("");

      // Construct a message about the imported repository
      const message = `I've imported the GitHub repository ${owner}/${repo}. Please help me analyze and understand this codebase.`;
      onSendMessage(message);

      toast({
        title: "Repository Imported",
        description: `Successfully imported ${owner}/${repo}`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: error.message || "Failed to import repository",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-end gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="outline" className="shrink-0">
              <Plus className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" side="top">
            <div className="grid gap-1">
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => setShowRepoDialog(true)}
                disabled={!githubConnected}
              >
                <Icons.gitHub className="mr-2 h-4 w-4" />
                Import GitHub Repository
              </Button>
              {!githubConnected && (
                <div className="px-2 py-1 text-xs text-muted-foreground">
                  Connect GitHub account first
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
        <Textarea
          ref={textareaRef}
          placeholder="Message Lovable..."
          className="min-h-12 flex-1 resize-none rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          rows={1}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            overflowY: message.split("\n").length > 10 ? "visible" : "hidden",
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "inherit";
            target.style.height = `${target.scrollHeight}px`;
          }}
        />
        <Button disabled={loading} size="icon" onClick={handleSendMessage}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowUp className="h-4 w-4" />
          )}
        </Button>
      </div>

      <Dialog open={showRepoDialog} onOpenChange={setShowRepoDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import GitHub Repository</DialogTitle>
            <DialogDescription>
              Enter the URL of a GitHub repository to import
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 pb-4">
            <div className="space-y-2">
              <Label htmlFor="repo-url">Repository URL</Label>
              <Input
                id="repo-url"
                placeholder="https://github.com/username/repository"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={importRepository}
              disabled={isImporting}
              className="w-full sm:w-auto"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                "Import Repository"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InputArea;
