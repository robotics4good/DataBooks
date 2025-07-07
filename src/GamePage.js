import React, { useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import SingleScreenLayout from "./SingleScreenLayout";
import DualScreenLayout from "./GameLayout";
import { useUserLog } from "./UserLog";
import { JournalProvider } from "./JournalContext";

const GamePage = ({ gameConfig }) => {
  const { gameKey } = useParams();
  const navigate = useNavigate();
  const { logAction } = useUserLog();
  const [dualScreen, setDualScreen] = useState(false);

  // Find the current game from config
  const currentGame = gameConfig.games.find(g => g.key === gameKey);
  
  // Redirect if game doesn't exist or is disabled
  if (!currentGame || !currentGame.enabled) {
    return <Navigate to="/" replace />;
  }

  const handleBackToGames = () => {
    logAction('Clicked back to games');
    navigate('/');
  };

  const handleToggleLayout = () => {
    const newLayout = !dualScreen;
    setDualScreen(newLayout);
    logAction(`Switched to ${newLayout ? 'dual' : 'single'} screen layout`);
  };

  return (
    <JournalProvider>
      {dualScreen ? (
        <DualScreenLayout
          selectedGame={currentGame}
          handleBackToGames={handleBackToGames}
          playerNames={gameConfig.playerNames}
          onToggleLayout={handleToggleLayout}
        />
      ) : (
        <SingleScreenLayout
          selectedGame={currentGame}
          handleBackToGames={handleBackToGames}
          playerNames={gameConfig.playerNames}
          onToggleLayout={handleToggleLayout}
        />
      )}
    </JournalProvider>
  );
};

export default GamePage;
