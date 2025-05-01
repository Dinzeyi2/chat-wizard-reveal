
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ChatHistory from "./pages/ChatHistory";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import GitHubCallback from "./pages/GitHubCallback";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import "./components/artifact/ArtifactSystem.css";

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  
  return <>{children}</>;
};

// Auth route component - redirects to home if already logged in
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/signin" element={
        <AuthRoute>
          <SignIn />
        </AuthRoute>
      } />
      <Route path="/signup" element={
        <AuthRoute>
          <SignUp />
        </AuthRoute>
      } />
      <Route path="/" element={
        <ProtectedRoute>
          <Index />
        </ProtectedRoute>
      } />
      <Route path="/history" element={
        <ProtectedRoute>
          <ChatHistory />
        </ProtectedRoute>
      } />
      <Route path="/github-callback" element={<GitHubCallback />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  // Create a client
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
