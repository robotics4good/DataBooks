import { Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import GameLayout from "./GameLayout";
import { UserLogProvider } from "./UserLog";
import "./App.css";

const App = () => (
  <UserLogProvider>
    <div className="App">
      <div className="size-unsupported-message">
        Please make your browser window larger to use the application.
      </div>
      <div className="main-content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/games/:gameName" element={<GameLayout />} />
        </Routes>
      </div>
    </div>
  </UserLogProvider>
);

export default App;
