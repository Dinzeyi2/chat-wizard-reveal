
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import NotFound from './pages/NotFound';
import Landing from './pages/Landing';
import ChallengeWorkspace from './pages/ChallengeWorkspace';
import ChallengeGenerator from './pages/ChallengeGenerator';
import GitHubCallback from './pages/GitHubCallback';
import Index from './pages/Index';
import Auth from './pages/Auth';
import ChatHistory from './pages/ChatHistory';
import { Toaster } from './components/ui/toaster';
import { ArtifactProvider } from './components/artifact/ArtifactSystem';

import './App.css';

const App: React.FC = () => {
  return (
    <div className="app">
      <ArtifactProvider>
        <Router>
          <Routes>
            <Route path="/chat/:chatId?" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/history" element={<ChatHistory />} />
            <Route path="/challenge-workspace/:challengeId?" element={<ChallengeWorkspace />} />
            <Route path="/challenge-generator" element={<ChallengeGenerator />} />
            <Route path="/github-callback" element={<GitHubCallback />} />
            <Route path="/" element={<Landing />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </ArtifactProvider>
    </div>
  );
};

export default App;
