
import React from "react";

interface WelcomeScreenProps {
  onSendMessage: (message: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSendMessage }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center px-4">
      <h1 className="text-3xl font-semibold text-gray-800 mb-8">What can I help with?</h1>
    </div>
  );
};

export default WelcomeScreen;
