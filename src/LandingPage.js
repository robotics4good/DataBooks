// src/LandingPage.js
import { useNavigate } from "react-router-dom";
import LandingPageTemplate from "./templates/LandingPageTemplate";

const LandingPage = () => {
  const navigate = useNavigate();

  const gameRoutes = {
    "Outbreak Squad": "/games/outbreak-squad",
    "Whisper Web": "/games/whisper-web",
    "Logistics League": "/games/logistics-league",
    "Pollination Party": "/games/pollination-party",
    "Rush Hour Rebels": "/games/rush-hour-rebels"
  };

  return <LandingPageTemplate gameRoutes={gameRoutes} onNavigate={navigate} />;
};

export default LandingPage;
