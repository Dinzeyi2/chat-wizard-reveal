
import { useState, useRef } from "react";
import { ArrowUp, Paperclip, X } from "lucide-react";
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
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, loading }) => {
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
        className="w-full border border-gray-300 bg-white shadow-sm"
      >
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="bg-gray-100 flex items-center gap-2 rounded-full px-3 py-1 text-sm"
              >
                <Paperclip className="size-4" />
                <span className="max-w-[120px] truncate">{file.name}</span>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="hover:bg-gray-200 rounded-full p-1"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <PromptInputTextarea placeholder="Ask anything..." className="py-3 px-4 min-h-[44px] text-gray-800" />

        <PromptInputActions className="flex items-center justify-between gap-2 pt-2 px-3 pb-3">
          <div className="flex gap-2">
            <PromptInputAction tooltip="Attach files">
              <label
                htmlFor="file-upload"
                className="hover:bg-gray-100 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full"
              >
                <input
                  ref={uploadInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <Paperclip className="text-gray-500 size-5" />
              </label>
            </PromptInputAction>
            <Button variant="outline" size="sm" className="rounded-full bg-gray-100 border-0 text-gray-600 hover:bg-gray-200">Search</Button>
            <Button variant="outline" size="sm" className="rounded-full bg-gray-100 border-0 text-gray-600 hover:bg-gray-200">Reason</Button>
            <Button variant="outline" size="sm" className="hidden md:flex rounded-full bg-gray-100 border-0 text-gray-600 hover:bg-gray-200">Deep research</Button>
            <Button variant="outline" size="sm" className="hidden md:flex rounded-full bg-gray-100 border-0 text-gray-600 hover:bg-gray-200">Create image</Button>
          </div>

          <PromptInputAction tooltip={loading ? "Stop generation" : "Send message"}>
            <Button
              variant="default"
              size="icon"
              className="h-8 w-8 rounded-full bg-black hover:bg-gray-800"
              onClick={handleSubmit}
            >
              <ArrowUp className="size-5" />
            </Button>
          </PromptInputAction>
        </PromptInputActions>
      </PromptInput>
      
      <div className="text-xs text-center mt-2 text-gray-500">
        ChatGPT can make mistakes. Check important info.
      </div>
    </div>
  );
};

export default InputArea;
