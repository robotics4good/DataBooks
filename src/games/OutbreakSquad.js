// src/games/OutbreakSquad.js
import LinePlot from "../plots/LinePlot";
import { useEffect, useState, useRef } from "react"; // useEffect for side effects (websocket setup), useState for state management (chart data), useRef for mutable references (websocket instances)

const WEBSOCKET_URL = "wss://echo.websocket.org"; // UPDATE THIS TO WEBSOCKET URL -> default echo

// Creating the OutbreakSquad React component
const OutbreakSquad = () => {
  const [data, setData] = useState([{ id: "cases", data: [] }]);
  const ws = useRef(null);

  useEffect(() => {
    // Initialize WebSocket connection
    ws.current = new WebSocket(WEBSOCKET_URL);

    // Sends a random value every second
    ws.current.onopen = () => { 
      console.log("WebSocket connected (OutbreakSquad)");
      setInterval(() => {
        ws.current.send(JSON.stringify({ value: Math.floor(Math.random() * 100) }));
      }, 1000);
    };

    // Handle incoming messages by parsing JSON, adding to chart, and keeping only last 20 points
    ws.current.onmessage = (event) => { 
      try {
        const message = JSON.parse(event.data);
        if (message.value !== undefined) {
          setData(prev => [{
            ...prev[0],
            data: [...prev[0].data.slice(-19), { x: new Date().toLocaleTimeString(), y: message.value }]
          }]);
        }
      } catch (err) {
        console.error("Parsing error (OutbreakSquad):", err);
      }
    };

    // Closing the WS connection
    return () => ws.current.close();
  }, []);

  // Render the chart with the data
  return <LinePlot data={data} />;
};

export default OutbreakSquad;