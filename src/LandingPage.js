// src/LandingPage.js
import { useNavigate } from "react-router-dom";
import LandingPageTemplate from "./templates/LandingPageTemplate";
import { useUserLog } from "./UserLog";

const LandingPage = () => {
  const navigate = useNavigate();
  const { logAction } = useUserLog();

  const gameRoutes = {
    "Outbreak Squad": "/login/outbreak-squad",
    "Whisper Web": "/login/whisper-web",
    "Logistics League": "/login/logistics-league",
    "Pollination Party": "/login/pollination-party",
    "Rush Hour Rebels": "/login/rush-hour-rebels"
  };

  const handleGameSelect = (route) => {
    const gameName = Object.keys(gameRoutes).find(key => gameRoutes[key] === route);
    if (gameName) {
      logAction(`Selected game: ${gameName}`);
    }
    navigate(route);
  };

  return <LandingPageTemplate gameRoutes={gameRoutes} onNavigate={handleGameSelect} className="landing-bg" />;
};

export default LandingPage;
