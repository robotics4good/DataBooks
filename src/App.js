import React, { useState } from "react";
import SingleScreenLayout from "./SingleScreenLayout";
import DualScreenLayout from "./GameLayout";
import { UserLogProvider } from "./UserLog";
import "./App.css";

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

const App = () => {
  const [dualScreen, setDualScreen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);

  // Handlers to pass down
  const handleGameSelect = (game, logAction) => {
    if (game.enabled) {
      if (logAction) logAction(`Selected game: ${game.name}`);
      setSelectedGame(game.key);
      setShowLogin(true);
    }
  };

  const handleLogin = (logAction) => {
    if (selectedPlayer) {
      if (logAction) logAction(`Player logged in: ${selectedPlayer}`);
      setShowLogin(false);
    }
  };

  const handleBackToGames = (logAction) => {
    if (logAction) logAction('Clicked back to games');
    setSelectedGame(null);
    setShowLogin(false);
    setSelectedPlayer('');
  };

  return (
    <UserLogProvider>
      <div className="App">
        <div className="size-unsupported-message">
          Please make your browser window larger to use the application.
        </div>
        <div className="main-content">
          {dualScreen ? (
            <DualScreenLayout
              dualScreen={dualScreen}
              setDualScreen={setDualScreen}
              showLogin={showLogin}
              setShowLogin={setShowLogin}
              selectedPlayer={selectedPlayer}
              setSelectedPlayer={setSelectedPlayer}
              selectedGame={selectedGame}
              setSelectedGame={setSelectedGame}
              handleGameSelect={handleGameSelect}
              handleLogin={handleLogin}
              handleBackToGames={handleBackToGames}
              games={games}
              playerNames={playerNames}
            />
          ) : (
            <SingleScreenLayout
              dualScreen={dualScreen}
              setDualScreen={setDualScreen}
              showLogin={showLogin}
              setShowLogin={setShowLogin}
              selectedPlayer={selectedPlayer}
              setSelectedPlayer={setSelectedPlayer}
              selectedGame={selectedGame}
              setSelectedGame={setSelectedGame}
              handleGameSelect={handleGameSelect}
              handleLogin={handleLogin}
              handleBackToGames={handleBackToGames}
              games={games}
              playerNames={playerNames}
            />
          )}
        </div>
      </div>
    </UserLogProvider>
  );
};

export default App;
