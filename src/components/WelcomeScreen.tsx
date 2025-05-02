
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Code, Wrench } from "lucide-react";

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
      <h1 className="text-3xl font-semibold text-gray-800 mb-2">What can I help with?</h1>
      <p className="text-gray-600 mb-8 text-center max-w-2xl">
        Learn by doing! Request an app and I'll create an intentionally incomplete version with real-world coding challenges for you to solve.
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
      
      <div className="mt-8 text-center max-w-lg">
        <div className="flex items-center justify-center mb-4">
          <Code className="h-5 w-5 mr-2 text-primary" />
          <span className="font-medium">Code Learning Platform</span>
          <Wrench className="h-5 w-5 ml-2 text-primary" />
        </div>
        <p className="text-gray-600">
          Practice solving real-world coding challenges by completing intentionally incomplete applications.
          Perfect for interview preparation and building practical skills.
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
