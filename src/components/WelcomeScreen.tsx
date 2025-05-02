
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface WelcomeScreenProps {
  onSendMessage: (message: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSendMessage }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center px-4 py-12">
      <h1 className="text-3xl font-semibold text-gray-800">What can I help with?</h1>
    </div>
  );
};

export default WelcomeScreen;
