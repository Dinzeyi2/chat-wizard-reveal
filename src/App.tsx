
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ChatHistory from "./pages/ChatHistory";
import GitHubCallback from "./pages/GitHubCallback";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import ChallengeGenerator from "./pages/ChallengeGenerator";
import ChallengeWorkspace from "./pages/ChallengeWorkspace";
import "./components/artifact/ArtifactSystem.css";

const App = () => {
  // Create a client
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* New landing page as the default route */}
            <Route path="/" element={<Landing />} />
            
            {/* Original Index page now at /app route with chat parameter support */}
            <Route path="/app" element={<Index />} />
            
            {/* All other existing routes preserved */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/history" element={<ChatHistory />} />
            
            {/* GitHub callback routes with both path styles */}
            <Route path="/github-callback" element={<GitHubCallback />} />
            <Route path="github-callback" element={<GitHubCallback />} />
            <Route path="/callback/github" element={<GitHubCallback />} />
            <Route path="callback/github" element={<GitHubCallback />} />
            
            {/* CodeCraft Challenge routes */}
            <Route path="/challenges" element={<ChallengeGenerator />} />
            <Route path="/challenge/:projectId" element={<ChallengeWorkspace />} />
            <Route path="/challenge/:projectId/:challengeId" element={<ChallengeWorkspace />} />
            <Route path="/implementation-steps/:stepId" element={<ChallengeWorkspace />} />
            
            {/* Catch-all route for 404s */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
