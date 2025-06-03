// src/games/PollinationParty.js
import PiePlot from "../plots/PiePlot";
import { useEffect, useRef, useState } from "react";

const WEBSOCKET_URL = "wss://echo.websocket.org";

const PollinationParty = () => {
  const [data, setData] = useState([
    { id: "bees", label: "Bees", value: 0 },
    { id: "butterflies", label: "Butterflies", value: 0 },
    { id: "birds", label: "Birds", value: 0 },
  ]);
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(WEBSOCKET_URL);

    ws.current.onopen = () => {
      console.log("WebSocket connected (PollinationParty)");
      setInterval(() => {
        ws.current.send(JSON.stringify({ species: Math.floor(Math.random() * 3), value: Math.floor(Math.random() * 100) }));
      }, 1000);
    };

    ws.current.onmessage = (event) => {
      try {
        const { species, value } = JSON.parse(event.data);
        if (species !== undefined) {
          setData(prev => prev.map((entry, idx) =>
            idx === species ? { ...entry, value } : entry
          ));
        }
      } catch (err) {
        console.error("Parsing error (PollinationParty):", err);
      }
    };

    return () => ws.current.close();
  }, []);

  return <PiePlot data={data} />;
};

export default PollinationParty;