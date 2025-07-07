import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./LandingPage";
import LoginPage from "./LoginPage";
import GamePage from "./GamePage";
import ControlPanel from "./ControlPanel";
import { UserLogProvider } from "./UserLog";
import "./App.css";

const games = [
  { name: "Alien Invasion", key: "alien-invasion", enabled: true },
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
  return (
    <UserLogProvider>
      <div className="App">
        <div className="size-unsupported-message">
          Please make your browser window larger to use the application.
        </div>
        <div className="main-content">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login/:gameKey" element={<LoginPage />} />
            <Route path="/games/:gameKey" element={<GamePage />} />
            <Route path="/control-panel" element={<ControlPanel />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </UserLogProvider>
  );
};

export default App;
