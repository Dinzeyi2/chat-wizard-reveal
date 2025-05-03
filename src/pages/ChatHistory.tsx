import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { PlusIcon, Search, ArrowLeft, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { Message, ChatHistoryItem } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";

const ChatHistory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<ChatHistoryItem | null>(null);
  const [newTitle, setNewTitle] = useState("");
  
  // Load chat history from Supabase when component mounts
  useEffect(() => {
    const fetchChatHistory = async () => {
      setLoading(true);
      try {
        const { data: session } = await supabase.auth.getSession();
        
        if (!session.session) {
          // If no session (user not logged in), get from localStorage as fallback
          const storedHistory = localStorage.getItem('chatHistory');
          console.log("Fetching from localStorage, found:", storedHistory ? "yes" : "no");
          if (storedHistory) {
            try {
              const parsedHistory = JSON.parse(storedHistory);
              console.log("Parsed history:", parsedHistory);
              setChatHistory(parsedHistory);
            } catch (error) {
              console.error("Error parsing chat history from localStorage:", error);
            }
          }
        } else {
          // User is logged in, fetch from Supabase
          console.log("User is logged in, fetching from Supabase");
          const { data, error } = await supabase
            .from('chat_history')
            .select('*')
            .order('updated_at', { ascending: false });
          
          if (error) {
            console.error("Error fetching chat history:", error);
            toast({
              variant: "destructive",
              title: "Error",
              description: `Failed to load chat history: ${error.message}`,
            });
            
            // Try fallback to localStorage
            const storedHistory = localStorage.getItem('chatHistory');
            if (storedHistory) {
              try {
                setChatHistory(JSON.parse(storedHistory));
              } catch (error) {
                console.error("Error parsing chat history from localStorage:", error);
              }
            }
          } else if (data) {
            // Format data from Supabase to match our ChatHistoryItem interface
            const formattedHistory = data.map((item: any) => ({
              id: item.id,
              title: item.title,
              last_message: item.last_message || "No messages",
              timestamp: formatTimestamp(item.updated_at || item.created_at),
              messages: item.messages || []
            }));
            
            console.log("Formatted history from Supabase:", formattedHistory);
            setChatHistory(formattedHistory);
          }
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChatHistory();
  }, []);

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return 'Just now';
      if (diffInHours === 1) return '1 hour ago';
      if (diffInHours < 24) return `${diffInHours} hours ago`;
      if (diffInHours < 48) return '1 day ago';
      return `${Math.floor(diffInHours / 24)} days ago`;
    } catch (e) {
      return 'Unknown time';
    }
  };

  const filteredChats = chatHistory.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChatSelection = (chatId: string) => {
    // Here we navigate to the main chat page with the specific chat ID
    navigate(`/app?chat=${chatId}`);
  };

  // Function to handle creating a new chat
  const handleNewChat = () => {
    // Navigate to the home page without any chat ID parameter to start fresh
    navigate('/app');
  };
  
  const openRenameDialog = (chat: ChatHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigating to the chat
    setSelectedChat(chat);
    setNewTitle(chat.title);
    setIsRenameDialogOpen(true);
  };
  
  const openDeleteDialog = (chat: ChatHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigating to the chat
    setSelectedChat(chat);
    setIsDeleteDialogOpen(true);
  };
  
  const handleRename = async () => {
    if (selectedChat && newTitle.trim()) {
      try {
        const { data: session } = await supabase.auth.getSession();
        
        if (session.session) {
          // Update in Supabase
          const { error } = await supabase
            .from('chat_history')
            .update({ title: newTitle.trim(), updated_at: new Date().toISOString() })
            .eq('id', selectedChat.id);
            
          if (error) {
            console.error("Error updating chat title:", error);
            toast({
              variant: "destructive",
              title: "Error",
              description: `Failed to update chat title: ${error.message}`,
            });
            return;
          }
        } else {
          // Update in localStorage as fallback
          const storedHistory = localStorage.getItem('chatHistory');
          if (storedHistory) {
            try {
              const historyArray = JSON.parse(storedHistory);
              const updatedHistory = historyArray.map((chat: any) => 
                chat.id === selectedChat.id ? { ...chat, title: newTitle.trim() } : chat
              );
              localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
            } catch (error) {
              console.error("Error updating chat history in localStorage:", error);
            }
          }
        }
        
        // Update local state
        const updatedHistory = chatHistory.map(chat => 
          chat.id === selectedChat.id ? { ...chat, title: newTitle.trim() } : chat
        );
        
        setChatHistory(updatedHistory);
        setIsRenameDialogOpen(false);
        toast({
          title: "Chat renamed",
          description: "Chat title has been updated successfully.",
        });
      } catch (error) {
        console.error("Error in rename operation:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to rename chat. Please try again.",
        });
      }
    }
  };
  
  const handleDelete = async () => {
    if (selectedChat) {
      try {
        const { data: session } = await supabase.auth.getSession();
        
        if (session.session) {
          // Delete from Supabase
          const { error } = await supabase
            .from('chat_history')
            .delete()
            .eq('id', selectedChat.id);
            
          if (error) {
            console.error("Error deleting chat:", error);
            toast({
              variant: "destructive",
              title: "Error",
              description: `Failed to delete chat: ${error.message}`,
            });
            return;
          }
        } else {
          // Delete from localStorage as fallback
          const storedHistory = localStorage.getItem('chatHistory');
          if (storedHistory) {
            try {
              const historyArray = JSON.parse(storedHistory);
              const updatedHistory = historyArray.filter((chat: any) => chat.id !== selectedChat.id);
              localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
            } catch (error) {
              console.error("Error updating chat history in localStorage:", error);
            }
          }
        }
        
        // Update local state
        const updatedHistory = chatHistory.filter(chat => chat.id !== selectedChat.id);
        
        setChatHistory(updatedHistory);
        setIsDeleteDialogOpen(false);
        toast({
          title: "Chat deleted",
          description: "Chat has been deleted successfully.",
        });
      } catch (error) {
        console.error("Error in delete operation:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete chat. Please try again.",
        });
      }
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <Link to="/app">
            <Button variant="outline" size="icon" className="rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-medium text-gray-800">Your chat history</h1>
        </div>
        <Button className="rounded-full" onClick={handleNewChat}>
          <PlusIcon className="mr-2 h-4 w-4" />
          New chat
        </Button>
      </div>
      
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input 
          type="search"
          placeholder="Search your chats..." 
          className="pl-10 border-blue-300 focus:border-blue-500 rounded-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <p className="text-gray-600 mb-6">
        You have {filteredChats.length} previous chats. <span className="text-blue-500 cursor-pointer">Select one to continue</span>
      </p>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredChats.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No chat history found.</p>
          <Button onClick={handleNewChat} variant="link" className="text-blue-500 mt-2">
            Start a new chat
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredChats.map(chat => (
            <Card 
              key={chat.id}
              className="cursor-pointer hover:bg-gray-50 p-4 transition-colors relative"
              onClick={() => handleChatSelection(chat.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-medium text-gray-800">{chat.title}</h2>
                  <p className="text-sm text-gray-500">{chat.last_message || "No messages"}</p>
                  {chat.messages && (
                    <p className="text-xs text-gray-400 mt-1">
                      {chat.messages.length} messages
                    </p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="sr-only">Open menu</span>
                      <svg width="15" height="3" viewBox="0 0 15 3" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-600">
                        <path d="M2.5 2.5C3.32843 2.5 4 1.82843 4 1C4 0.171573 3.32843 -0.5 2.5 -0.5C1.67157 -0.5 1 0.171573 1 1C1 1.82843 1.67157 2.5 2.5 2.5Z" fill="currentColor"/>
                        <path d="M7.5 2.5C8.32843 2.5 9 1.82843 9 1C9 0.171573 8.32843 -0.5 7.5 -0.5C6.67157 -0.5 6 0.171573 6 1C6 1.82843 6.67157 2.5 7.5 2.5Z" fill="currentColor"/>
                        <path d="M14 1C14 1.82843 13.3284 2.5 12.5 2.5C11.6716 2.5 11 1.82843 11 1C11 0.171573 11.6716 -0.5 12.5 -0.5C13.3284 -0.5 14 0.171573 14 1Z" fill="currentColor"/>
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => openRenameDialog(chat, e)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      onClick={(e) => openDeleteDialog(chat, e)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename chat</DialogTitle>
            <DialogDescription>
              Enter a new name for this chat conversation.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Chat title"
            className="mt-2"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this chat
              and remove all associated conversation data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChatHistory;
