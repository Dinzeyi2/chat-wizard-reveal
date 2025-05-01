
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  Bookmark,
  Settings,
  Edit,
  ImageIcon,
  Lock,
  LogOut,
  Pencil,
  Share2,
  User,
  UserPlus,
  Users,
  Github,
} from "lucide-react";
import { initiateGithubAuth, isGithubConnected, disconnectGithub } from "@/utils/githubAuth";
import { supabase } from "@/integrations/supabase/client";

interface UserProfileMenuProps {
  username?: string;
}

export function UserProfileMenu({ username = "O" }: UserProfileMenuProps) {
  const [githubConnected, setGithubConnected] = useState(false);
  
  useEffect(() => {
    const checkGithubConnection = async () => {
      const connected = await isGithubConnected();
      setGithubConnected(connected);
    };
    
    checkGithubConnection();
    
    // Set up auth state change listener to recheck GitHub connection
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkGithubConnection();
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleGithubConnection = () => {
    if (githubConnected) {
      disconnectGithub();
    } else {
      initiateGithubAuth();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer focus:outline-none">
        <div className="ml-2 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white">
          {username.charAt(0)}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 bg-[#1A1F2C] border-[#2A2A2A] text-white">
        <DropdownMenuItem className="hover:bg-[#2A2A2A] cursor-pointer">
          <User className="mr-2 size-4" />
          View Profile
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-[#2A2A2A] cursor-pointer">
          <Edit className="mr-2 size-4" />
          Edit Profile
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-[#2A2A2A] cursor-pointer">
          <ImageIcon className="mr-2 size-4" />
          Change Avatar
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-[#2A2A2A] cursor-pointer">
          <Pencil className="mr-2 size-4" />
          Update Bio
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#2A2A2A]" />
        <DropdownMenuItem className="hover:bg-[#2A2A2A] cursor-pointer">
          <Bookmark className="mr-2 size-4" />
          View Bookmarks
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-[#2A2A2A] cursor-pointer">
          <Share2 className="mr-2 size-4" />
          View Shared Bookmarks
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#2A2A2A]" />
        <DropdownMenuItem 
          onClick={handleGithubConnection}
          className="hover:bg-[#2A2A2A] cursor-pointer"
        >
          <Github className="mr-2 size-4" />
          {githubConnected ? "Disconnect GitHub" : "Connect GitHub"}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#2A2A2A]" />
        <DropdownMenuItem className="hover:bg-[#2A2A2A] cursor-pointer">
          <UserPlus className="mr-2 size-4" />
          Manage Followers
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-[#2A2A2A] cursor-pointer">
          <Users className="mr-2 size-4" />
          Manage Following
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#2A2A2A]" />
        <DropdownMenuItem className="hover:bg-[#2A2A2A] cursor-pointer">
          <Settings className="mr-2 size-4" />
          Account Settings
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-[#2A2A2A] cursor-pointer">
          <Lock className="mr-2 size-4" />
          Privacy Settings
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-[#2A2A2A] cursor-pointer">
          <Bell className="mr-2 size-4" />
          Notification Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#2A2A2A]" />
        <DropdownMenuItem className="hover:bg-[#2A2A2A] cursor-pointer">
          <LogOut className="mr-2 size-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
