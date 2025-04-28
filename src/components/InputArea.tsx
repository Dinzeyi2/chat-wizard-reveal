
import { useState, useRef } from "react";
import { ArrowUp, Paperclip, X, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input";

interface InputAreaProps {
  onSendMessage: (message: string) => void;
  loading: boolean;
  deepReasoningMode?: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, loading, deepReasoningMode = false }) => {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
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

  return (
    <div className="max-w-3xl mx-auto w-full p-4">
      <PromptInput
        value={message}
        onValueChange={setMessage}
        isLoading={loading}
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

        <PromptInputTextarea placeholder={deepReasoningMode ? "Ask anything with deep reasoning..." : "Ask anything..."} />

        <PromptInputActions className="flex items-center justify-between gap-2 pt-2">
          <div className="flex gap-2">
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
            
            {deepReasoningMode ? (
              <Button variant="outline" size="sm" className="rounded-full flex items-center gap-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700">
                <Brain className="size-4" />
                <span>Deep Reasoning</span>
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" className="rounded-full">Search</Button>
                <Button variant="outline" size="sm" className="rounded-full">Reason</Button>
                <Button variant="outline" size="sm" className="hidden md:flex rounded-full">Deep research</Button>
                <Button variant="outline" size="sm" className="hidden md:flex rounded-full">Create image</Button>
              </>
            )}
          </div>

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
        </PromptInputActions>
      </PromptInput>
      
      <div className="text-xs text-center mt-2 text-gray-500">
        {deepReasoningMode 
          ? "Deep Reasoning Mode: Enhanced answers with comprehensive analysis." 
          : "ChatGPT can make mistakes. Check important info."}
      </div>
    </div>
  );
};

export default InputArea;
