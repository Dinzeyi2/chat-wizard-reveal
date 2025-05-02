
import React from "react";
import { Button } from "@/components/ui/button";

interface WelcomeScreenProps {
  onSendMessage: (message: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSendMessage }) => {
  const examplePrompts = [
    "Create a Twitter clone with missing authentication features",
    "Build an e-commerce app with incomplete shopping cart functionality",
    "Generate a task management app with missing drag-and-drop feature"
  ];

  return (
    <div className="h-full flex flex-col items-center justify-center px-4 max-w-3xl mx-auto">
      <h1 className="text-3xl font-semibold text-gray-800 mb-4">CodeLab: Learn by Solving Real-World Challenges</h1>
      <p className="text-gray-600 mb-8 text-center">
        Generate incomplete projects with real-world coding challenges. 
        Fix the intentionally missing features to gain practical experience.
      </p>
      
      <div className="w-full space-y-3">
        <p className="text-sm font-medium text-gray-700">Try these examples:</p>
        {examplePrompts.map((prompt, index) => (
          <Button 
            key={index}
            variant="outline" 
            className="w-full text-left justify-start h-auto py-3 px-4"
            onClick={() => onSendMessage(prompt)}
          >
            {prompt}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default WelcomeScreen;
