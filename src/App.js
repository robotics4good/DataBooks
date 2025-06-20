import { Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import GameLayout from "./GameLayout";
import { UserLogProvider } from "./UserLog";
import "./App.css";

function App() {
  return (
    <UserLogProvider>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/games/:gameName" element={<GameLayout />} />
        </Routes>
      </div>
    </UserLogProvider>
  );
}

export default App;
