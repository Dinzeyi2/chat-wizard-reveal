
import { Button } from "./ui/button";
import { useAuth } from "../context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function UserProfileMenu() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out. Please try again.",
      });
    }
  };

  return (
    <div className="flex items-center gap-4 ml-4">
      {user && (
        <>
          <div className="text-sm font-medium">
            {user.email}
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleSignOut}
            className="h-8 px-2 text-xs"
          >
            Sign Out
          </Button>
        </>
      )}
    </div>
  );
}
