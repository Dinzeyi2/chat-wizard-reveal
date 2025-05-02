
import React from 'react';
import { ArrowRight, Code, Github, Sparkles, BookOpen, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeScreenProps {
  onSendMessage: (message: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSendMessage }) => {
  const examples = [
    {
      title: 'Create a Twitter clone',
      prompt: 'Create a Twitter clone with posts, likes, and user profiles for me to learn from',
      icon: <Code className="h-6 w-6 text-blue-500" />
    },
    {
      title: 'Build an e-commerce site',
      prompt: 'Build an e-commerce site with product listings, cart, and checkout for me to learn from',
      icon: <Sparkles className="h-6 w-6 text-purple-500" />
    },
    {
      title: 'Make a task management app',
      prompt: 'Make a todo app with task categories, due dates and priorities for me to learn from',
      icon: <Github className="h-6 w-6 text-green-500" />
    }
  ];

  const handleExampleClick = (prompt: string) => {
    onSendMessage(prompt);
  };

  return (
    <div className="flex flex-col items-center justify-center px-4 py-10">
      <div className="text-center max-w-2xl mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Welcome to CodeCraft Challenge
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Learn by completing coding challenges in intentionally incomplete applications.
          Ask me to build any application, and I'll create a structured learning experience
          with strategic code gaps for you to implement!
        </p>
        <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>⚠️ Important:</strong> The applications I generate are intentionally incomplete.
            Each one contains specific coding challenges designed as a learning experience - you'll
            need to implement key features with my guidance to make everything work!
          </p>
        </div>
      </div>

      <div className="w-full max-w-2xl grid gap-4">
        <h2 className="text-lg font-semibold mb-2">Try asking me to build:</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {examples.map((example, index) => (
            <div 
              key={index} 
              onClick={() => handleExampleClick(example.prompt)}
              className="bg-white border rounded-xl p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {example.icon}
                  <span className="font-medium">{example.title}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3">Or you can:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              onClick={() => handleExampleClick("Create a simple blog with posts and comments for me to learn from")}
              className="justify-start h-auto py-3 px-4"
            >
              <div className="flex items-center">
                <BookOpen className="mr-2 size-4" />
                <div className="flex flex-col items-start text-left">
                  <span className="font-medium">Generate a learning project</span>
                  <span className="text-sm text-gray-500">I'll create educational coding challenges</span>
                </div>
              </div>
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleExampleClick("Explain how React hooks work")}
              className="justify-start h-auto py-3 px-4"
            >
              <div className="flex items-center">
                <Code2 className="mr-2 size-4" />
                <div className="flex flex-col items-start text-left">
                  <span className="font-medium">Ask a coding question</span>
                  <span className="text-sm text-gray-500">Get help with programming concepts</span>
                </div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
