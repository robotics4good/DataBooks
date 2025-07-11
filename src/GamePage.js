import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import SingleScreenLayout from "./SingleScreenLayout";
import DualScreenLayout from "./GameLayout";
import { useUserLog } from "./UserLog";
import { JournalProvider } from "./JournalContext";

const GamePage = ({ gameConfig }) => {
  const { gameKey } = useParams();
  const navigate = useNavigate();
  const { logAction, startLogging } = useUserLog();
  const [dualScreen, setDualScreen] = useState(false);

  useEffect(() => {
    // Enable logging as soon as the game page loads
    startLogging();
  }, [startLogging]);

  // Find the current game from config
  const currentGame = gameConfig.games.find(g => g.key === gameKey);
  
  // Redirect if game doesn't exist or is disabled
  if (!currentGame || !currentGame.enabled) {
    return <Navigate to="/" replace />;
  }

  const handleBackToGames = () => {
    logAction('navigation', 'back_to_games', {});
    navigate('/');
  };

  const handleToggleLayout = (source) => {
    const newLayout = !dualScreen;
    setDualScreen(newLayout);
    logAction('navigation', 'toggle_screen', {
      to: newLayout ? 'dual' : 'single',
      triggeredFrom: source
    });
  };

  return (
    <JournalProvider>
      {dualScreen ? (
        <DualScreenLayout
          selectedGame={currentGame}
          handleBackToGames={handleBackToGames}
          playerNames={gameConfig.playerNames}
          onToggleLayout={() => handleToggleLayout('DualScreenLayout')}
          isDualScreen={true}
        />
      ) : (
        <SingleScreenLayout
          selectedGame={currentGame}
          handleBackToGames={handleBackToGames}
          playerNames={gameConfig.playerNames}
          onToggleLayout={() => handleToggleLayout('SingleScreenLayout')}
          isDualScreen={false}
        />
      )}
    </JournalProvider>
  );
};

export default GamePage;
