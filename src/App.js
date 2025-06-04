import { Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import OutbreakSquad from "./games/OutbreakSquad";
import WhisperWeb from "./games/WhisperWeb";
import LogisticsLeague from "./games/LogisticsLeague";
import PollinationParty from "./games/PollinationParty";
import RushHourRebels from "./games/RushHourRebels";
import "./App.css";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/games/outbreak-squad" element={<OutbreakSquad />} />
        <Route path="/games/whisper-web" element={<WhisperWeb />} />
        <Route path="/games/logistics-league" element={<LogisticsLeague />} />
        <Route path="/games/pollination-party" element={<PollinationParty />} />
        <Route path="/games/rush-hour-rebels" element={<RushHourRebels />} />
      </Routes>
    </div>
  );
}

export default App;
