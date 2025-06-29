// src/games/OutbreakSquad.js

// IMPORTS & DEPENDENCIES
import LinePlot from "../plots/LinePlot"; // Custom chart component for visualizing data
import ScatterPlot from "../plots/ScatterPlot"; // Custom chart component for visualizing data
import PiePlot from "../plots/PiePlot"; // Custom chart component for visualizing data
import { useEffect, useState, useRef, useMemo } from "react"; // React hooks for component lifecycle and state
import { getSessionCollection, addDoc } from "../firebase"; // Firebase functions for database operations
import { query, orderBy, onSnapshot, getDocs } from "firebase/firestore"; // Firestore query utilities

// CONFIGURATION
const WEBSOCKET_URL = "ws://localhost:8081"; // WebSocket server endpoint for real-time data

// @param {string} sessionId - Unique identifier for this game session (passed from parent)
const OutbreakSquad = ({ sessionId, theme }) => {
  // State: chart data, game status, selected plot
  const [data, setData] = useState([{ id: "cases", data: [] }]); 
  const [isGameOver, setIsGameOver] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState("line");

  // Refs: WebSocket connection and interval timer
  const ws = useRef(null);
  const intervalRef = useRef(null);
  
  // Firebase collection for this specific game session
  // Memoize the collection reference to prevent re-creation on re-renders
  const sessionCollection = useMemo(() => getSessionCollection(sessionId), [sessionId]);

  // EFFECT 1 - REAL-TIME DATA VISUALIZATION
  useEffect(() => {
    if (!sessionCollection) return; // Defensive guard
    const q = query(sessionCollection, orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const points = snapshot.docs.map(doc => {
        const d = doc.data(); 
        return {
          x: new Date(d.timestamp).toLocaleTimeString(), 
          y: d.value
        };
      }).reverse();
      setData([{ id: "cases", data: points.slice(-25) }]);
    });
    return () => unsubscribe();
  }, [sessionCollection]);

  // EFFECT 2: WEBSOCKET CONNECTION & DATA GENERATION
  useEffect(() => {
    if (!sessionCollection || isGameOver) return;
    ws.current = new WebSocket(WEBSOCKET_URL);

    // WebSocket connection established successfully, start the data generation process
    ws.current.onopen = () => {
      console.log("WebSocket connected (OutbreakSquad)");

      // Generate simulated outbreak data every second if game is active and connection is open
      intervalRef.current = setInterval(() => {
        if (!isGameOver && ws.current?.readyState === WebSocket.OPEN) {
          const simulatedValue = Math.floor(Math.random() * 100);
          
          // Send data to server as JSON
          ws.current.send(JSON.stringify({ value: simulatedValue }));
        }
      }, 1000); // Send every 1000ms
    };

    // Handle incoming messages from WebSocket server
    ws.current.onmessage = async (event) => {
      try {
        // Parse JSON message from server
        const message = JSON.parse(event.data);
        
        // Validate message and check game state, store data point in Firestore database
        if (message.value !== undefined && !isGameOver) {
          await addDoc(sessionCollection, {
            value: message.value,        // The outbreak case count
            timestamp: Date.now(),       // Current timestamp
            source: "websocket"          // Data source identifier
          });
          // This triggers the Firestore listener in Effect 1, updating the chart
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    };

    // Cleanup function - runs when component unmounts or dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [sessionCollection, isGameOver]); // Re-run if session or game state changes

  // FUNCTION: DATA EXPORT
  const downloadData = async () => {
    if (!sessionCollection) return; // Defensive guard
    try {
      const snapshot = await getDocs(query(sessionCollection, orderBy("timestamp")));
      const allData = snapshot.docs.map(doc => doc.data());
      const csv = [
        "timestamp,value,source",
        ...allData.map(d =>
          `${new Date(d.timestamp).toISOString()},${d.value},${d.source}`
        )
      ].join("\n"); 
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `OutbreakSquad-${sessionId}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading data:", error);
    }
  };

  // Transform data for pie chart format
  const pieData = useMemo(() => {
    if (selectedPlot !== 'pie') return [];
    if (!data[0]?.data?.length) {
      return [
        { id: '0-20', label: '0-20', value: 0 },
        { id: '21-40', label: '21-40', value: 0 },
        { id: '41-60', label: '41-60', value: 0 },
        { id: '61-80', label: '61-80', value: 0 },
        { id: '81-100', label: '81-100', value: 0 }
      ];
    }
    const valueRanges = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0
    };
    data[0].data.forEach(point => {
      const value = point.y;
      if (value <= 20) valueRanges['0-20']++;
      else if (value <= 40) valueRanges['21-40']++;
      else if (value <= 60) valueRanges['41-60']++;
      else if (value <= 80) valueRanges['61-80']++;
      else valueRanges['81-100']++;
    });
    return Object.entries(valueRanges).map(([label, value]) => ({
      id: label,
      label: label,
      value: value
    }));
  }, [data, selectedPlot]);

  // Only render error message after all hooks
  if (!sessionId) {
    return <div style={{ padding: 32, color: '#b00', fontWeight: 'bold' }}>No session ID provided. Please start a new game session.</div>;
  }

  // RENDER: USER INTERFACE
  return (
    <div style={{
      height: "100vh",           
      width: "100%",            
      display: "flex",           
      flexDirection: "column",   
      alignItems: "center",      
      justifyContent: "center"   
    }}>

      {/* PLOT SELECTION DROPDOWN */}
      <div style={{ marginBottom: '1rem' }}>
        <select className="plot-selector" value={selectedPlot} onChange={e => setSelectedPlot(e.target.value)}>
          <option value="line">Line Plot</option>
          <option value="scatter">Scatter Plot</option>
          <option value="pie">Pie Plot</option>
        </select>
      </div>

      {/* CHART CONTAINER */}
      <div style={{ height: "75%", width: "95%" }}>
        {selectedPlot === 'line' && <LinePlot data={data} theme={theme} />}
        {selectedPlot === 'scatter' && <ScatterPlot data={data} theme={theme} />}
        {selectedPlot === 'pie' && <PiePlot data={pieData} theme={theme} />}
      </div>

      {/* Show "End Game" button while game is active */}
      {!isGameOver && (
        <button 
          onClick={() => setIsGameOver(true)} 
          style={{ marginTop: "1rem" }}
        >
          End Game
        </button>
      )}

      {/* Show "Download" button after game ends */}
      {isGameOver && (
        <button 
          onClick={downloadData} 
          style={{ marginTop: "0.5rem" }}
        >
          Download Session Data
        </button>
      )}
    </div>
  );
};

// EXPORT
export default OutbreakSquad;



/*
================================================================================
OUTBREAKSQUAD COMPONENT DOCUMENTATION
================================================================================

COMPONENT OVERVIEW:
OutbreakSquad is a real-time data monitoring game that simulates disease outbreak 
tracking. It demonstrates real-time data flow through WebSocket → Server → 
Firestore → Chart visualization.

ARCHITECTURE:
1. WebSocket connects to local server and sends simulated outbreak data every second
2. Server echoes data back, which gets stored in Firebase Firestore database  
3. Firestore listener updates the chart in real-time with latest data points
4. When game ends, all session data can be exported as CSV

DATA FLOW:
Component → WebSocket → Server → WebSocket → Component → Firestore → Chart

PARAMETERS:
- sessionId (string): Unique identifier for this game session (passed from parent)

================================================================================
STATE MANAGEMENT
================================================================================

DATA STATE:
- data: Chart data structure for LinePlot component
  Format: [{ id: "cases", data: [{ x: timestamp, y: value }, ...] }]
  Only keeps last 20 data points for performance

GAME STATE: 
- isGameOver: Boolean tracking whether simulation is still running
  When true, stops data generation and shows download option

REFERENCES (useRef):
- ws: WebSocket connection reference (persists across re-renders)
- intervalRef: Interval timer reference for proper cleanup
- sessionCollection: Firebase collection reference for this game session

================================================================================
EFFECT 1: REAL-TIME DATA VISUALIZATION  
================================================================================

PURPOSE: Sets up live listener to Firebase Firestore that automatically updates 
the chart whenever new data is added to the database.

PROCESS:
1. Creates Firestore query to get session data ordered by timestamp (newest first)
2. onSnapshot creates real-time listener that fires whenever data changes
3. Transforms Firestore documents into chart-friendly format  
4. Reverses order for chronological display and limits to 20 points
5. Updates chart data state, triggering re-render

CLEANUP: Unsubscribes from Firestore listener when component unmounts

================================================================================
EFFECT 2: WEBSOCKET CONNECTION & DATA GENERATION
================================================================================

PURPOSE: Manages WebSocket connection and automated data generation.

DATA FLOW:
1. Connect to WebSocket server
2. When connected, start generating random outbreak data every second  
3. Send data to server via WebSocket
4. Server echoes data back
5. Store received data in Firestore (triggers chart update via Effect 1)

WHY THIS ARCHITECTURE?
- Simulates real-world scenario where data comes from external source
- WebSocket provides real-time bidirectional communication
- Firestore acts as persistent storage and real-time database
- Separates data generation, transmission, storage, and visualization

CONNECTION HANDLING:
- onopen: Start interval timer for data generation
- onmessage: Parse server response and store in Firestore  
- Cleanup: Clear interval and close WebSocket to prevent memory leaks

DATA GENERATION:
- Generates random outbreak case count (0-99) every second
- Only sends data if game is active and connection is open
- JSON format: { value: simulatedValue }

================================================================================
EXPORT FUNCTION
================================================================================

PURPOSE: Downloads all session data as CSV file for analysis

PROCESS:
1. Query Firestore for ALL data points in chronological order
2. Convert to CSV format with headers
3. Create downloadable blob and trigger browser download

CSV FORMAT:
timestamp,value,source
2024-01-01T12:00:00.000Z,45,websocket
2024-01-01T12:00:01.000Z,52,websocket
...

IMPLEMENTATION:
- Uses getDocs() for one-time data fetch (vs onSnapshot for real-time)
- Creates Blob with CSV content type
- Programmatically triggers download with unique filename per session
- Cleans up temporary URL after download

================================================================================
USER INTERFACE
================================================================================

LAYOUT: Full-screen centered layout with:
1. Chart container (80% height/width)
2. Real-time line chart showing outbreak data  
3. Conditional game control buttons

UI STATE MANAGEMENT:
- While game active: Shows "End Game" button
- After game ends: Shows "Download Session Data" button

CHART INTEGRATION:
- LinePlot component receives data in specific format
- Data automatically updates via Firestore listener
- Shows last 20 points for performance and readability

================================================================================
DEPENDENCIES & IMPORTS
================================================================================

REACT HOOKS:
- useEffect: Component lifecycle and side effects (WebSocket, Firestore listeners)
- useState: Component state management (chart data, game status)  
- useRef: Persistent references across renders (WebSocket, timers)
- useMemo: Memoization for performance optimization

FIREBASE:
- getSessionCollection: Gets Firestore collection reference for session
- addDoc: Adds new document to Firestore collection
- query, orderBy: Firestore query utilities
- onSnapshot: Real-time Firestore listener
- getDocs: One-time Firestore data fetch

CUSTOM COMPONENTS:
- LinePlot: Chart visualization component
- ScatterPlot: Chart visualization component
- PiePlot: Chart visualization component

CONFIGURATION:
- WEBSOCKET_URL: Local WebSocket server endpoint (ws://localhost:8081)

================================================================================
*/