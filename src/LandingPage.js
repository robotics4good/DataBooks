// src/LandingPage.js
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  const gameRoutes = {
    "Outbreak Squad": "/games/outbreak-squad",
    "Whisper Web": "/games/whisper-web",
    "Logistics League": "/games/logistics-league",
    "Pollination Party": "/games/pollination-party",
    "Rush Hour Rebels": "/games/rush-hour-rebels"
  };

  return (
    <div style={{ height: "100vh", background: "#0a0a0a", color: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <h1 style={{ fontSize: "4rem", marginBottom: "2rem" }}>DataOrganisms</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {Object.entries(gameRoutes).map(([game, route]) => (
          <button
            key={game}
            onClick={() => navigate(route)}
            style={{
              fontSize: "1.5rem",
              padding: "0.8rem 1.5rem",
              cursor: "pointer",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#4CAF50",
              color: "white"
            }}
          >
            {game}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LandingPage;
