
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  signOut: async () => {}
});

export const useAuth = () => useContext(AuthContext);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setIsLoading(false);

        // If we have a user and a session, check if we need to link with GitHub
        if (newSession?.user && event === 'SIGNED_IN') {
          // Using setTimeout to avoid Supabase deadlock
          setTimeout(() => {
            checkAndLinkGitHubAccount(newSession.user);
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
      
      if (currentSession?.user) {
        // Using setTimeout to avoid Supabase deadlock
        setTimeout(() => {
          checkAndLinkGitHubAccount(currentSession.user);
        }, 0);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Check if user has a GitHub connection, if not and they're authenticated through other means, prompt them
  const checkAndLinkGitHubAccount = async (user: User) => {
    // We need to check if user has GitHub provider linked
    // This can be done by checking identities in user.identities
    const hasGitHub = user.app_metadata?.providers?.includes('github');
    
    if (!hasGitHub) {
      console.log('GitHub account not linked yet');
      // You could show a notification or prompt here
      // But don't automatically trigger the GitHub OAuth flow
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    session,
    user,
    isLoading,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
