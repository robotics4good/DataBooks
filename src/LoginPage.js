import React, { useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useUserLog } from "./UserLog";

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

const games = [
  { name: "Alien Invasion", key: "alien-invasion", enabled: true },
  { name: "Whisper Web", key: "whisper-web", enabled: false },
  { name: "Logistics League", key: "logistics-league", enabled: false },
  { name: "Pollination Party", key: "pollination-party", enabled: false },
  { name: "Rush Hour Rebels", key: "rush-hour-rebels", enabled: false }
];

const LoginPage = () => {
  const { gameKey } = useParams();
  const navigate = useNavigate();
  const { logAction } = useUserLog();
  const [selectedPlayer, setSelectedPlayer] = useState('');

  const game = games.find(g => g.key === gameKey);
  
  if (!game || !game.enabled) {
    return <Navigate to="/" replace />;
  }

  const handlePlayerSelect = (player) => {
    setSelectedPlayer(player);
  };

  const handleStartGame = () => {
    if (selectedPlayer) {
      // Store the selected player in localStorage for use throughout the app
      localStorage.setItem('selectedPlayer', selectedPlayer);
      logAction(`Player logged in: ${selectedPlayer}`);
      navigate(`/games/${gameKey}`);
    }
  };

  const handleBackToGames = () => {
    logAction('Clicked back to games');
    navigate('/');
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{
        background: "rgba(255, 255, 255, 0.95)",
        borderRadius: "20px",
        padding: "40px",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
        maxWidth: "500px",
        width: "100%",
        textAlign: "center"
      }}>
        <h1 style={{
          color: "#333",
          marginBottom: "10px",
          fontSize: "2.5rem",
          fontWeight: "bold"
        }}>
          {game.name}
        </h1>
        
        <p style={{
          color: "#666",
          marginBottom: "30px",
          fontSize: "1.1rem"
        }}>
          Select your player identity
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: "10px",
          marginBottom: "30px"
        }}>
          {playerNames.map((player) => (
            <button
              key={player}
              onClick={() => handlePlayerSelect(player)}
              style={{
                padding: "12px 16px",
                border: selectedPlayer === player ? "3px solid #667eea" : "2px solid #ddd",
                borderRadius: "10px",
                background: selectedPlayer === player ? "#f0f4ff" : "white",
                color: selectedPlayer === player ? "#667eea" : "#333",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: selectedPlayer === player ? "bold" : "normal",
                transition: "all 0.3s ease"
              }}
            >
              {player}
            </button>
          ))}
        </div>

        <div style={{
          display: "flex",
          gap: "15px",
          justifyContent: "center"
        }}>
          <button
            onClick={handleBackToGames}
            style={{
              padding: "12px 24px",
              border: "2px solid #ddd",
              borderRadius: "8px",
              background: "white",
              color: "#666",
              cursor: "pointer",
              fontSize: "1rem",
              transition: "all 0.3s ease"
            }}
          >
            Back to Games
          </button>
          
          <button
            onClick={handleStartGame}
            disabled={!selectedPlayer}
            style={{
              padding: "12px 24px",
              border: "none",
              borderRadius: "8px",
              background: selectedPlayer ? "#667eea" : "#ccc",
              color: "white",
              cursor: selectedPlayer ? "pointer" : "not-allowed",
              fontSize: "1rem",
              fontWeight: "bold",
              transition: "all 0.3s ease"
            }}
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 