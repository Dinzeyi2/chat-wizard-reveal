
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface WelcomeScreenProps {
  onSendMessage: (message: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSendMessage }) => {
  const examplePrompts = [
    "Create a Twitter clone with basic tweet and profile functionality",
    "Build a task management app with drag and drop features",
    "Generate a personal portfolio website with project showcase",
    "Design an e-commerce dashboard with product management"
  ];

  return (
    <div className="h-full flex flex-col items-center justify-center px-4 py-12">
      <h1 className="text-3xl font-semibold text-gray-800 mb-8">What can I help with?</h1>
      
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
      
      <div className="mt-12 text-center max-w-md">
        <p className="text-gray-600 mb-4">
          Describe what you want to build, and I'll generate a complete application for you. You can then customize it through our conversation.
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
