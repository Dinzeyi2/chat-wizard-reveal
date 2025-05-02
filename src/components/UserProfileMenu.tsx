
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { useToast } from "@/hooks/use-toast";

interface UserProfileMenuProps {
  username?: string;
}

export function UserProfileMenu({ username = "O" }: UserProfileMenuProps) {
  const [githubConnected, setGithubConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInitial, setUserInitial] = useState(username);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    const checkGithubConnection = async () => {
      const connected = await isGithubConnected();
      setGithubConnected(connected);
    };
    
    const checkAuthStatus = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
      
      // Update user initial if authenticated
      if (data.session?.user) {
        const userEmail = data.session.user.email;
        const userMeta = data.session.user.user_metadata;
        
        if (userMeta?.full_name) {
          setUserInitial(userMeta.full_name.charAt(0));
        } else if (userEmail) {
          setUserInitial(userEmail.charAt(0).toUpperCase());
        }
      }
    };
    
    checkAuthStatus();
    checkGithubConnection();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuthStatus();
      checkGithubConnection();
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleGithubConnection = async () => {
    if (githubConnected) {
      await disconnectGithub();
    } else {
      await initiateGithubAuth();
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out."
      });
      
      // Navigate to home page
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Logout error",
        description: error.message || "An error occurred during logout."
      });
    }
  };

  const handleLogin = () => {
    navigate("/auth");
  };

  // If not authenticated, show sign in button
  if (!isAuthenticated) {
    return (
      <button
        onClick={handleLogin}
        className="flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
      >
        <LogOut className="mr-2 size-4" />
        Sign in
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer focus:outline-none">
        <div className="ml-2 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white">
          {userInitial}
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
        <DropdownMenuItem 
          onClick={handleLogout}
          className="hover:bg-[#2A2A2A] cursor-pointer"
        >
          <LogOut className="mr-2 size-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
