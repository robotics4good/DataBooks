const LandingPageTemplate = ({ gameRoutes, onNavigate }) => {
  return (
    <div style={{ height: "100vh", background: "#0a0a0a", color: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <h1 style={{ fontSize: "4rem", marginBottom: "2rem" }}>DataOrganisms</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {Object.entries(gameRoutes).map(([game, route]) => (
          <button
            key={game}
            onClick={() => onNavigate(route)}
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

export default LandingPageTemplate; 