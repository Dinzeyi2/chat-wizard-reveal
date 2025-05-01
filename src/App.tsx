
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
import "./components/artifact/ArtifactSystem.css";

const App = () => {
  // Create a client
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/history" element={<ChatHistory />} />
            
            {/* GitHub callback routes with both path styles */}
            <Route path="/github-callback" element={<GitHubCallback />} />
            <Route path="github-callback" element={<GitHubCallback />} />
            <Route path="/callback/github" element={<GitHubCallback />} />
            <Route path="callback/github" element={<GitHubCallback />} />
            
            {/* Catch-all route for 404s */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
