import React, { useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import SingleScreenLayout from "./SingleScreenLayout";
import DualScreenLayout from "./GameLayout";
import { useUserLog } from "./UserLog";

const GamePage = () => {
  const { gameKey } = useParams();
  const navigate = useNavigate();
  const { logAction } = useUserLog();
  const [dualScreen, setDualScreen] = useState(false);

  const games = [
    { name: "Outbreak Squad", key: "outbreak-squad", enabled: true },
    { name: "Whisper Web", key: "whisper-web", enabled: false },
    { name: "Logistics League", key: "logistics-league", enabled: false },
    { name: "Pollination Party", key: "pollination-party", enabled: false },
    { name: "Rush Hour Rebels", key: "rush-hour-rebels", enabled: false }
  ];

  const playerNames = [
    "Red Fox",
    "Blue Whale", 
    "Green Turtle",
    "Purple Butterfly",
    "Orange Tiger",
    "Yellow Lion",
    "Pink Dolphin",
    "Brown Bear",
    "Black Panther",
    "White Eagle",
    "Gray Wolf",
    "Golden Eagle"
  ];

  const game = games.find(g => g.key === gameKey);
  
  if (!game || !game.enabled) {
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
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Layout Toggle Bar */}
      <div style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "10px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        color: "white",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={handleBackToGames}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "white",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.9rem"
            }}
          >
            ← Back to Games
          </button>
          <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
            {game.name}
          </span>
        </div>
        
        <button
          onClick={handleToggleLayout}
          style={{
            background: "rgba(255,255,255,0.2)",
            border: "none",
            color: "white",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: "bold"
          }}
        >
          {dualScreen ? "Single Screen" : "Dual Screen"}
        </button>
      </div>

      {/* Game Content */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {dualScreen ? (
          <DualScreenLayout
            selectedGame={gameKey}
            handleBackToGames={handleBackToGames}
            playerNames={playerNames}
          />
        ) : (
          <SingleScreenLayout
            selectedGame={gameKey}
            handleBackToGames={handleBackToGames}
            playerNames={playerNames}
          />
        )}
      </div>
    </div>
  );
};

export default GamePage;
