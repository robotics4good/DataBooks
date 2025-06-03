// src/games/WhisperWeb.js
import HeatmapPlot from "../plots/HeatmapPlot";
import { useEffect, useRef, useState } from "react";

const WEBSOCKET_URL = "wss://echo.websocket.org";

const WhisperWeb = () => {
  const [data, setData] = useState([
    { id: "user1", msg1: 0, msg2: 0, msg3: 0 },
    { id: "user2", msg1: 0, msg2: 0, msg3: 0 },
    { id: "user3", msg1: 0, msg2: 0, msg3: 0 },
  ]);
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(WEBSOCKET_URL);

    ws.current.onopen = () => {
      console.log("WebSocket connected (WhisperWeb)");
      setInterval(() => {
        ws.current.send(JSON.stringify({ user: Math.floor(Math.random() * 3), msg: Math.floor(Math.random() * 3), value: Math.floor(Math.random() * 100) }));
      }, 1000);
    };

    ws.current.onmessage = (event) => {
      try {
        const { user, msg, value } = JSON.parse(event.data);
        if (user !== undefined && msg !== undefined && value !== undefined) {
          setData(prev => prev.map((row, idx) =>
            idx === user ? { ...row, [`msg${msg + 1}`]: value } : row
          ));
        }
      } catch (err) {
        console.error("Parsing error (WhisperWeb):", err);
      }
    };

    return () => ws.current.close();
  }, []);

  return <HeatmapPlot data={data} keys={["msg1", "msg2", "msg3"]} indexBy="id" />;
};

export default WhisperWeb;