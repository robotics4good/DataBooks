// src/games/LogisticsLeague.js
import BarPlot from "../plots/BarPlot";
import { useEffect, useRef, useState } from "react";

const WEBSOCKET_URL = "wss://echo.websocket.org";

const LogisticsLeague = () => {
  const [data, setData] = useState([
    { region: "North", shipped: 0, delayed: 0 },
    { region: "South", shipped: 0, delayed: 0 },
    { region: "East", shipped: 0, delayed: 0 },
  ]);
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(WEBSOCKET_URL);

    ws.current.onopen = () => {
      console.log("WebSocket connected (LogisticsLeague)");
      setInterval(() => {
        ws.current.send(JSON.stringify({ region: Math.floor(Math.random() * 3), shipped: Math.floor(Math.random() * 100), delayed: Math.floor(Math.random() * 20) }));
      }, 1000);
    };

    ws.current.onmessage = (event) => {
      try {
        const { region, shipped, delayed } = JSON.parse(event.data);
        if (region !== undefined) {
          setData(prev => prev.map((entry, idx) =>
            idx === region ? { ...entry, shipped, delayed } : entry
          ));
        }
      } catch (err) {
        console.error("Parsing error (LogisticsLeague):", err);
      }
    };

    return () => ws.current.close();
  }, []);

  return <BarPlot data={data} keys={["shipped", "delayed"]} indexBy="region" />;
};

export default LogisticsLeague;