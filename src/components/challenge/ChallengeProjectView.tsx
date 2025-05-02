
import React, { useState } from 'react';
import { ChallengeOverview } from './ChallengeOverview';
import { ChallengeDetail } from './ChallengeDetail';
import { ChallengeResult } from '@/utils/GeminiCodeGenerator';

interface ChallengeProjectViewProps {
  challenge: ChallengeResult;
}

export const ChallengeProjectView: React.FC<ChallengeProjectViewProps> = ({
  challenge
}) => {
  const [selectedChallenge, setSelectedChallenge] = useState<number | null>(null);
  const [completedChallenges, setCompletedChallenges] = useState<number[]>([]);
  
  // Handler for when user selects a challenge
  const handleChallengeSelect = (index: number) => {
    setSelectedChallenge(index);
  };
  
  // Handler for when user completes a challenge
  const handleChallengeComplete = () => {
    if (selectedChallenge !== null && !completedChallenges.includes(selectedChallenge)) {
      setCompletedChallenges([...completedChallenges, selectedChallenge]);
    }
  };
  
  // Go back to challenge overview
  const handleBackToOverview = () => {
    setSelectedChallenge(null);
  };

  // Prepare challenges with completion status
  const challengesWithStatus = challenge.challenges.map((c, index) => ({
    ...c,
    completed: completedChallenges.includes(index)
  }));

  // Get the related files for a challenge
  const getChallengeFiles = (challengeIndex: number) => {
    const currentChallenge = challenge.challenges[challengeIndex];
    if (!currentChallenge) return [];
    
    // Return the file paths associated with this challenge
    return currentChallenge.filesPaths || [];
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {selectedChallenge !== null ? (
        <ChallengeDetail 
          challenge={challenge.challenges[selectedChallenge]}
          onBack={handleBackToOverview}
          onComplete={() => handleChallengeComplete()}
          relatedFiles={getChallengeFiles(selectedChallenge)}
        />
      ) : (
        <ChallengeOverview 
          projectName={challenge.projectName}
          projectDescription={challenge.description}
          challenges={challengesWithStatus}
          onChallengeSelect={handleChallengeSelect}
        />
      )}
    </div>
  );
};
