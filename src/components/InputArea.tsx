
import { useState } from "react";
import { Plus, Search, MessageSquare, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InputAreaProps {
  onSendMessage: (message: string) => void;
  loading: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, loading }) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute left-2 text-gray-500"
          >
            <Plus className="h-5 w-5" />
          </Button>
          
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask anything"
            className="w-full pl-12 pr-32 py-3 rounded-full border border-gray-200 focus:outline-none focus:border-gray-300 focus:ring-0"
            disabled={loading}
          />
          
          <div className="absolute right-2 flex items-center gap-1">
            <Button variant="ghost" size="icon" className="text-gray-500">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-500">
              <MessageSquare className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-500">
              <Mic className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </form>
      
      <div className="text-xs text-center mt-2 text-gray-500">
        ChatGPT can make mistakes. Check important info.
      </div>
    </div>
  );
};

export default InputArea;
