// src/games/RushHourRebels.js
import AreaPlot from "../plots/AreaPlot";
import { useEffect, useRef, useState } from "react";

const WEBSOCKET_URL = "wss://echo.websocket.org";

const RushHourRebels = () => {
  const [data, setData] = useState([
    { id: "car", data: [] },
    { id: "bus", data: [] },
  ]);
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(WEBSOCKET_URL);

    ws.current.onopen = () => {
      console.log("WebSocket connected (RushHourRebels)");
      setInterval(() => {
        ws.current.send(JSON.stringify({ vehicle: Math.floor(Math.random() * 2), value: Math.floor(Math.random() * 100) }));
      }, 1000);
    };

    ws.current.onmessage = (event) => {
      try {
        const { vehicle, value } = JSON.parse(event.data);
        if (vehicle !== undefined) {
          setData(prev => prev.map((series, idx) =>
            idx === vehicle ? {
              ...series,
              data: [...series.data.slice(-19), { x: new Date().toLocaleTimeString(), y: value }]
            } : series
          ));
        }
      } catch (err) {
        console.error("Parsing error (RushHourRebels):", err);
      }
    };

    return () => ws.current.close();
  }, []);

  return <AreaPlot data={data} />;
};

export default RushHourRebels;