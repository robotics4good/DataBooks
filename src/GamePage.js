import { useEffect, useState, useRef } from "react";
import LinePlot from "./plots/LinePlot"; // adjust path if needed

const WEBSOCKET_URL = "wss://echo.websocket.org"; // <-- Replace this

const GamePage = () => {
  const [data, setData] = useState([{ id: "series1", data: [] }]);
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(WEBSOCKET_URL);

    ws.current.onopen = () => {
      console.log("WebSocket connection opened!");
      setInterval(() => {
        ws.current.send(JSON.stringify({ value: Math.floor(Math.random() * 100) }));
      }, 1000);
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.value !== undefined) {
          setData(prevData =>
            prevData.map(series => ({
              ...series,
              data: [
                ...series.data.slice(-19),
                { x: new Date().toLocaleTimeString(), y: message.value }
              ]
            }))
          );
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.current.onclose = () => {
      console.log("WebSocket connection closed.");
    };

    return () => {
      ws.current.close();
    };
  }, []);

  return (
    <div style={{ height: "100vh", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ height: "80%", width: "80%" }}>
        <LinePlot data={data} />
      </div>
    </div>
  );
};

export default GamePage;
