
import { useState, useRef, useEffect } from "react";
import { Search, MessageSquare, ArrowRight, Mic } from "lucide-react";

interface InputAreaProps {
  onSendMessage: (message: string) => void;
  loading: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, loading }) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "24px";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 200) + "px";
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !loading) {
      onSendMessage(message);
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "24px";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="relative rounded-lg border shadow-sm bg-white">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything"
          className="w-full resize-none outline-none py-3 px-4 pr-16 max-h-[200px] text-gray-800"
          rows={1}
          disabled={loading}
        />
        <div className="absolute right-2 bottom-2">
          <button
            onClick={handleSend}
            className={`p-1 rounded-md ${message.trim() && !loading ? "text-gray-700 hover:bg-gray-100" : "text-gray-300"}`}
            disabled={!message.trim() || loading}
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
      
      <div className="flex justify-between mt-2 px-1">
        <div className="flex gap-2">
          <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border rounded-md hover:bg-gray-50">
            <span className="hidden sm:inline">+</span>
          </button>
          
          <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border rounded-md hover:bg-gray-50">
            <Search size={16} />
            <span className="hidden sm:inline">Search</span>
          </button>
          
          <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border rounded-md hover:bg-gray-50">
            <MessageSquare size={16} />
            <span className="hidden sm:inline">Reason</span>
          </button>
          
          <button className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-sm bg-white border rounded-md hover:bg-gray-50">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 8h6m-5 4h4m-3 4h2m7-3v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3" />
              <path d="M15 6 A3 3 0 0 1 9 6 A3 3 0 0 1 15 6" />
            </svg>
            <span>Deep research</span>
          </button>
          
          <button className="hidden md:flex items-center gap-1 px-3 py-1.5 text-sm bg-white border rounded-md hover:bg-gray-50">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span>Create image</span>
          </button>
          
          <button className="flex sm:hidden items-center gap-1 px-3 py-1.5 text-sm bg-white border rounded-md hover:bg-gray-50">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          </button>
        </div>
        
        <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md">
          <Mic size={18} />
        </button>
      </div>
      
      <div className="text-xs text-center mt-2 text-gray-500">
        ChatGPT can make mistakes. Check important info.
      </div>
    </div>
  );
};

export default InputArea;
