
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Icons } from '@/components/ui/icons';

export function Header() {
  const { user, signOut, isLoading } = useAuth();

  return (
    <header className="bg-white dark:bg-gray-950 border-b sticky top-0 z-10">
      <div className="container flex items-center justify-between h-16 px-4">
        <Link to="/" className="text-xl font-bold">
          Your App
        </Link>
        
        <nav className="flex items-center gap-4">
          {isLoading ? (
            <Icons.spinner className="h-5 w-5 animate-spin" />
          ) : user ? (
            <>
              <Link to="/history" className="text-sm hover:underline">
                History
              </Link>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => signOut()}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link to="/signin">
                <Button variant="outline" size="sm">Sign in</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
