
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Code, Wrench, BookOpen, Sparkles } from "lucide-react";

interface WelcomeScreenProps {
  onSendMessage: (message: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSendMessage }) => {
  const examplePrompts = [
    "Create a Twitter clone with missing profile functionality",
    "Build a task management app with incomplete drag-and-drop feature",
    "Generate a personal portfolio site with placeholder project sections",
    "Design an e-commerce dashboard with missing product search"
  ];

  return (
    <div className="h-full flex flex-col items-center justify-center px-4 py-12">
      <div className="flex items-center mb-2">
        <Code className="h-6 w-6 mr-2 text-primary" />
        <h1 className="text-3xl font-semibold text-gray-800">CodeLab</h1>
      </div>
      <p className="text-gray-600 mb-8 text-center max-w-2xl">
        Learn by doing! Request an app and we'll generate an intentionally incomplete version with real-world 
        coding challenges for you to solve and learn from.
      </p>
      
      <div className="max-w-2xl w-full grid grid-cols-1 md:grid-cols-2 gap-4">
        {examplePrompts.map((prompt, index) => (
          <Button
            key={index}
            variant="outline"
            className="justify-between text-left h-auto py-4 px-6"
            onClick={() => onSendMessage(prompt)}
          >
            <span className="mr-2">{prompt}</span>
            <ArrowRight className="h-4 w-4 flex-shrink-0" />
          </Button>
        ))}
      </div>
      
      <div className="mt-12 text-center max-w-2xl grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-secondary/20 p-6 rounded-lg flex flex-col items-center">
          <BookOpen className="h-8 w-8 text-primary mb-4" />
          <h3 className="font-medium mb-2">Learn By Doing</h3>
          <p className="text-sm text-gray-600">
            Practice with real-world coding challenges designed to build practical skills.
          </p>
        </div>
        
        <div className="bg-secondary/20 p-6 rounded-lg flex flex-col items-center">
          <Wrench className="h-8 w-8 text-primary mb-4" />
          <h3 className="font-medium mb-2">Fix Real Problems</h3>
          <p className="text-sm text-gray-600">
            Solve intentionally incomplete code that mimics scenarios from actual development jobs.
          </p>
        </div>
        
        <div className="bg-secondary/20 p-6 rounded-lg flex flex-col items-center">
          <Sparkles className="h-8 w-8 text-primary mb-4" />
          <h3 className="font-medium mb-2">AI Feedback</h3>
          <p className="text-sm text-gray-600">
            Get instant feedback on your code solutions to accelerate your learning.
          </p>
        </div>
      </div>
      
      <p className="mt-8 text-sm text-gray-500">
        Perfect for interview preparation and building your portfolio with hands-on projects.
      </p>
    </div>
  );
};

export default WelcomeScreen;
