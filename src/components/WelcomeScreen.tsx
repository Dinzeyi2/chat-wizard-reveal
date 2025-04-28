
import React from "react";

interface WelcomeScreenProps {
  onSendMessage: (message: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSendMessage }) => {
  const examplePrompts = [
    "Write a story about a magical forest",
    "Help me plan a weekend trip to Paris",
    "Explain quantum computing to a 10-year-old",
    "Create a workout routine for beginners",
  ];

  return (
    <div className="h-full flex flex-col items-center justify-center px-4">
      <h1 className="text-3xl font-semibold text-gray-800 mb-8">What can I help with?</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl w-full mb-8">
        {examplePrompts.map((prompt, index) => (
          <button
            key={index}
            className="text-left p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => onSendMessage(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default WelcomeScreen;
