// src/games/AlienInvasion.js - Updated to use real ESP data

// IMPORTS & DEPENDENCIES
import React, { useState, useEffect } from 'react';
import { useESPData } from "../hooks/useESPData";
import { useUserLog } from "../UserLog";
import PlotComponent from "../plots/PlotComponent";
import LinePlot from '../plots/LinePlot';
import ScatterPlot from '../plots/ScatterPlot';
import PiePlot from '../plots/PiePlot';
import BarPlot from '../plots/BarPlot';
import HistogramPlot from '../plots/HistogramPlot';

// @param {string} sessionId - Unique identifier for this game session (passed from parent)
const AlienInvasion = () => {
  const { logAction } = useUserLog();
  
  // Game state
  const [gameState, setGameState] = useState('waiting');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);
  const [alienShips, setAlienShips] = useState([]);
  const [playerPosition, setPlayerPosition] = useState({ x: 50, y: 50 });
  
  // Control ESP data access - no session ID needed
  const { 
    espData, 
    loading, 
    error, 
    getPlotData 
  } = useESPData();

  // Game loop
  useEffect(() => {
    if (gameState === 'playing') {
      const gameTimer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('gameOver');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(gameTimer);
    }
  }, [gameState]);

  // Generate alien ships based on ESP data
  useEffect(() => {
    if (gameState === 'playing' && espData.length > 0) {
      const newAlienShips = espData.slice(-5).map((dataPoint, index) => ({
        id: `alien_ship_${Date.now()}_${index}`,
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        intensity: (dataPoint.status || 0), // Use status as intensity
        type: dataPoint.beaconArray === 1 ? 'interactive' : 'standard' // Use beacon array for type
      }));
      setAlienShips(newAlienShips);
    }
  }, [espData, gameState]);

  // Handle player movement
  const handleKeyPress = (e) => {
    if (gameState !== 'playing') return;
    
    const speed = 5;
    setPlayerPosition(prev => {
      let newPos = { ...prev };
      
      switch(e.key) {
        case 'ArrowUp':
        case 'w':
          newPos.y = Math.max(10, prev.y - speed);
          break;
        case 'ArrowDown':
        case 's':
          newPos.y = Math.min(90, prev.y + speed);
          break;
        case 'ArrowLeft':
        case 'a':
          newPos.x = Math.max(10, prev.x - speed);
          break;
        case 'ArrowRight':
        case 'd':
          newPos.x = Math.min(90, prev.x + speed);
          break;
        default:
          return prev;
      }
      
      // Check for alien ship destruction
      const nearbyAlienShip = alienShips.find(ship => 
        Math.sqrt((newPos.x - ship.x) ** 2 + (newPos.y - ship.y) ** 2) < 15
      );
      
      if (nearbyAlienShip) {
        setScore(prev => prev + Math.floor(nearbyAlienShip.intensity * 100));
        setAlienShips(prev => prev.filter(o => o.id !== nearbyAlienShip.id));
      }
      
      return newPos;
    });
  };

  // Start game
  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setLevel(1);
    setTimeLeft(60);
    setPlayerPosition({ x: 50, y: 50 });
    setAlienShips([]);
  };

  // Reset game
  const resetGame = () => {
    setGameState('waiting');
    setScore(0);
    setLevel(1);
    setTimeLeft(60);
    setPlayerPosition({ x: 50, y: 50 });
    setAlienShips([]);
  };

  // Add keyboard listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, alienShips]);

  // Custom log action for AlienInvasion plots
  const handlePlotAction = (action) => {
    logAction(`AlienInvasion plot: ${action}`);
  };

  // Transform ESP data for different plot types
  const getAlienData = (plotType) => {
    switch (plotType) {
      case 'line':
        // Show interaction values over time
        return getPlotData('line', 'timestamp', 'interaction');
      
      case 'scatter':
        // Scatter plot of interactions vs time
        return getPlotData('scatter', 'timestamp', 'interaction');
      
      case 'bar':
        // Bar chart of interactions by student
        return getPlotData('bar');
      
      case 'histogram':
        // Distribution of interaction values
        return getPlotData('histogram');
      
      case 'pie':
        // Pie chart of interactions by student
        return getPlotData('pie');
      
      default:
        return getPlotData('line', 'timestamp', 'interaction');
    }
  };

  // Only render error message if no session ID
  if (!espData.length) {
    return (
      <div style={{ 
        padding: 32, 
        color: '#b00', 
        fontWeight: 'bold',
        textAlign: 'center'
      }}>
        No ESP data available. Please start a new game session.
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div style={{
        height: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
          Loading Alien Invasion data...
        </div>
        <div style={{ fontSize: "0.9rem", color: "#666" }}>
          Connecting to ESP data source
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
  return (
    <div style={{
      height: "100vh",           
      width: "100%",            
      display: "flex",           
      flexDirection: "column",   
      alignItems: "center",      
      justifyContent: "center"   
    }}>
        <div style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "#b00" }}>
          Error loading Alien Invasion data
        </div>
        <div style={{ fontSize: "0.9rem", color: "#666", textAlign: "center" }}>
          {error}
        </div>
      </div>
    );
  }

  // RENDER: USER INTERFACE
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#f0f8ff',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Game Header */}
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#2c3e50', 
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2>Alien Invasion - Real ESP Data</h2>
        <div style={{ display: 'flex', gap: '20px' }}>
          <span>Score: {score}</span>
          <span>Level: {level}</span>
          <span>Time: {timeLeft}s</span>
        </div>
      </div>

      {/* Game Content */}
      <div style={{ 
        flex: 1, 
        display: 'flex',
        gap: '10px',
        padding: '10px'
      }}>
        {/* Game Area */}
        <div style={{ 
          flex: '1',
          position: 'relative',
          backgroundColor: '#e8f4f8',
          border: '2px solid #3498db',
          borderRadius: '10px',
          overflow: 'hidden'
        }}>
          {gameState === 'waiting' && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              zIndex: 10
            }}>
              <h3>Alien Invasion</h3>
              <p>Use WASD or arrow keys to move and destroy alien ships!</p>
              <p>ESP data controls alien ship generation</p>
        <button 
                onClick={startGame}
                style={{
                  padding: '10px 20px',
                  fontSize: '16px',
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Start Game
        </button>
            </div>
          )}

          {gameState === 'gameOver' && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              zIndex: 10,
              backgroundColor: 'rgba(255,255,255,0.9)',
              padding: '20px',
              borderRadius: '10px'
            }}>
              <h3>Game Over!</h3>
              <p>Final Score: {score}</p>
        <button 
                onClick={resetGame}
                style={{
                  padding: '10px 20px',
                  fontSize: '16px',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Play Again
        </button>
            </div>
          )}

          {/* Player */}
          {gameState === 'playing' && (
            <div style={{
              position: 'absolute',
              left: `${playerPosition.x}%`,
              top: `${playerPosition.y}%`,
              width: '20px',
              height: '20px',
              backgroundColor: '#e74c3c',
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 5,
              border: '2px solid #c0392b'
            }} />
          )}

          {/* Alien Ships */}
          {gameState === 'playing' && alienShips.map(ship => (
            <div
              key={ship.id}
              style={{
                position: 'absolute',
                left: `${ship.x}%`,
                top: `${ship.y}%`,
                width: `${20 + ship.intensity * 30}px`,
                height: `${20 + ship.intensity * 30}px`,
                backgroundColor: ship.type === 'interactive' ? '#9b59b6' : '#f39c12',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 3,
                border: '2px solid #e67e22',
                animation: 'pulse 1s infinite'
              }}
            />
          ))}

          {/* ESP Data Status */}
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: 'rgba(255,255,255,0.9)',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '12px'
          }}>
            <div>ESP Data: {loading ? 'Loading...' : espData.length} points</div>
          </div>
        </div>

        {/* Plots Panel */}
        <div style={{ 
          width: '400px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {/* Line Plot */}
          <div style={{ 
            height: '200px', 
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '5px',
            padding: '10px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>ESP Interactions Over Time</h4>
            <LinePlot data={espData} />
          </div>

          {/* Scatter Plot */}
          <div style={{ 
            height: '200px', 
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '5px',
            padding: '10px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>ESP Data Scatter</h4>
            <ScatterPlot data={espData} />
          </div>

          {/* Bar Plot */}
          <div style={{ 
            height: '200px', 
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '5px',
            padding: '10px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Interactions by Student</h4>
            <BarPlot data={getAlienData('bar')} />
          </div>

          {/* Histogram Plot */}
          <div style={{ 
            height: '200px', 
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '5px',
            padding: '10px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Interaction Distribution</h4>
            <HistogramPlot data={getAlienData('histogram')} />
          </div>

          {/* Pie Plot */}
          <div style={{ 
            height: '200px', 
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '5px',
            padding: '10px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Student Participation</h4>
            <PiePlot data={getAlienData('pie')} />
          </div>
        </div>
      </div>

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.1); }
          100% { transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default AlienInvasion;

/*
ALIENINVASION COMPONENT DOCUMENTATION
=====================================

AlienInvasion is a real-time data monitoring game that simulates alien invasion
scenarios using live ESP (Embedded System Platform) data. The game dynamically
generates alien ships based on incoming sensor data, creating an engaging
educational experience that teaches data visualization and real-time monitoring.

KEY FEATURES:
- Real-time ESP data integration
- Dynamic alien ship generation
- Interactive player movement (WASD/Arrow keys)
- Multiple data visualization plots
- Score-based gameplay mechanics
- Responsive design for different screen sizes

DATA INTEGRATION:
- Uses useESPData hook for real-time data fetching
- Transforms ESP data into game mechanics
- Provides multiple plot types for data analysis
- Integrates with user logging system

GAMEPLAY MECHANICS:
- Player moves around to destroy alien ships
- Alien ships are generated based on ESP interaction data
- Score increases when alien ships are destroyed
- Time-based gameplay with countdown timer
- Multiple difficulty levels

VISUALIZATION COMPONENTS:
- Line Plot: Shows ESP interactions over time
- Scatter Plot: Displays data point distribution
- Bar Plot: Shows interactions by student
- Histogram Plot: Displays interaction distribution
- Pie Plot: Shows student participation breakdown

TECHNICAL DETAILS:
- Built with React hooks for state management
- Uses Firebase for real-time data synchronization
- Implements responsive design principles
- Integrates with the broader DataBooks ecosystem
*/