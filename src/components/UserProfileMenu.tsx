
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
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
} from "lucide-react";

interface UserProfileMenuProps {
  username?: string;
}

export function UserProfileMenu({ username = "O" }: UserProfileMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="cursor-pointer">
        <div className="ml-2 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white">
          {username.charAt(0)}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64 bg-[#1A1F2C] border-[#2A2A2A] text-white">
        <ContextMenuItem className="hover:bg-[#2A2A2A] cursor-pointer">
          <User className="mr-2 size-4" />
          View Profile
        </ContextMenuItem>
        <ContextMenuItem className="hover:bg-[#2A2A2A] cursor-pointer">
          <Edit className="mr-2 size-4" />
          Edit Profile
        </ContextMenuItem>
        <ContextMenuItem className="hover:bg-[#2A2A2A] cursor-pointer">
          <ImageIcon className="mr-2 size-4" />
          Change Avatar
        </ContextMenuItem>
        <ContextMenuItem className="hover:bg-[#2A2A2A] cursor-pointer">
          <Pencil className="mr-2 size-4" />
          Update Bio
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-[#2A2A2A]" />
        <ContextMenuItem className="hover:bg-[#2A2A2A] cursor-pointer">
          <Bookmark className="mr-2 size-4" />
          View Bookmarks
        </ContextMenuItem>
        <ContextMenuItem className="hover:bg-[#2A2A2A] cursor-pointer">
          <Share2 className="mr-2 size-4" />
          View Shared Bookmarks
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-[#2A2A2A]" />
        <ContextMenuItem className="hover:bg-[#2A2A2A] cursor-pointer">
          <UserPlus className="mr-2 size-4" />
          Manage Followers
        </ContextMenuItem>
        <ContextMenuItem className="hover:bg-[#2A2A2A] cursor-pointer">
          <Users className="mr-2 size-4" />
          Manage Following
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-[#2A2A2A]" />
        <ContextMenuItem className="hover:bg-[#2A2A2A] cursor-pointer">
          <Settings className="mr-2 size-4" />
          Account Settings
        </ContextMenuItem>
        <ContextMenuItem className="hover:bg-[#2A2A2A] cursor-pointer">
          <Lock className="mr-2 size-4" />
          Privacy Settings
        </ContextMenuItem>
        <ContextMenuItem className="hover:bg-[#2A2A2A] cursor-pointer">
          <Bell className="mr-2 size-4" />
          Notification Settings
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-[#2A2A2A]" />
        <ContextMenuItem className="hover:bg-[#2A2A2A] cursor-pointer">
          <LogOut className="mr-2 size-4" />
          Logout
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
