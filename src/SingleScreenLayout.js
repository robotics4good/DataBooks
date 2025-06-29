import React, { useState, useRef, useLayoutEffect } from 'react';
import OutbreakSquad from "./games/OutbreakSquad";
import WhisperWeb from "./games/WhisperWeb";
import LogisticsLeague from "./games/LogisticsLeague";
import PollinationParty from "./games/PollinationParty";
import RushHourRebels from "./games/RushHourRebels";
import { useUserLog } from "./UserLog";
import PlotComponent from "./plots/PlotComponent";

const MIN_WIDTH_PERCENT = 30;
const MAX_WIDTH_PERCENT = 50;

const AutoResizingTextarea = ({ value, onChange, onBlur, ...props }) => {
  const textareaRef = useRef(null);

  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 50)}px`;
    }
  }, [value]);

  return <textarea ref={textareaRef} value={value} onChange={onChange} onBlur={onBlur} {...props} />;
};

const QuestionBox = ({ question, index, logAction }) => {
    const [answer, setAnswer] = useState("");
    const handleAnswerChange = (e) => {
        setAnswer(e.target.value);
    };

    const handleAnswerBlur = (e) => {
        const value = e.target.value;
        const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
        logAction(`journal_entry`, `Question ${index + 1} word_count: ${wordCount}`);
    };

    return (
        <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                {question}
            </label>
            <AutoResizingTextarea
                placeholder="Your answer..."
                value={answer}
                onChange={handleAnswerChange}
                onBlur={handleAnswerBlur}
                style={{
                    width: "100%",
                    minHeight: '50px',
                    background: "var(--cream-panel)",
                    color: "var(--text-dark)",
                    border: "1px solid var(--panel-border)",
                    borderRadius: "4px",
                    padding: "0.5rem",
                    resize: "none",
                    boxSizing: 'border-box',
                    margin: 0,
                    overflowY: 'hidden'
                }}
            />
        </div>
    );
};

const GameContent = ({ selectedGame, theme }) => {
  switch (selectedGame) {
    case 'outbreak-squad':
      return <OutbreakSquad theme={theme} />;
    case 'whisper-web':
      return <WhisperWeb />;
    case 'logistics-league':
      return <LogisticsLeague />;
    case 'pollination-party':
      return <PollinationParty />;
    case 'rush-hour-rebels':
      return <RushHourRebels />;
    default:
      return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '1.2rem' }}>
        Select a game to begin
      </div>;
  }
};

const SingleScreenLayout = () => {
  const { logAction, exportLog, clearLog } = useUserLog();
  const [selectedGame, setSelectedGame] = useState(null);
  const [activeTab, setActiveTab] = useState('plot');
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [theme, setTheme] = useState('unity');
  const [showLogin, setShowLogin] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  
  // Plot state tracking
  const [plot1Type, setPlot1Type] = useState('line');
  const [plot2Type, setPlot2Type] = useState('line');
  const [plot1XVariables, setPlot1XVariables] = useState([]);
  const [plot1YVariables, setPlot1YVariables] = useState([]);
  const [plot2XVariables, setPlot2XVariables] = useState([]);
  const [plot2YVariables, setPlot2YVariables] = useState([]);

  // State for each plot's X/Y for line plot
  const [plot1X, setPlot1X] = useState("");
  const [plot1Y, setPlot1Y] = useState("");
  const [plot2X, setPlot2X] = useState("");
  const [plot2Y, setPlot2Y] = useState("");

  const games = [
    { name: "Outbreak Squad", key: "outbreak-squad", enabled: true },
    { name: "Whisper Web", key: "whisper-web", enabled: false },
    { name: "Logistics League", key: "logistics-league", enabled: false },
    { name: "Pollination Party", key: "pollination-party", enabled: false },
    { name: "Rush Hour Rebels", key: "rush-hour-rebels", enabled: false }
  ];

  const playerNames = [
    "Red Fox",
    "Blue Whale", 
    "Green Turtle",
    "Purple Butterfly",
    "Orange Tiger",
    "Yellow Lion",
    "Pink Dolphin",
    "Brown Bear",
    "Black Panther",
    "White Eagle",
    "Gray Wolf",
    "Golden Eagle"
  ];

  // Plot types in the order and with the labels from the screenshot
  const plotTypes = [
    { value: 'line', label: 'Line Plot' },
    { value: 'scatter', label: 'Scatter Plot' },
    { value: 'bar', label: 'Bar Plot' },
    { value: 'histogram', label: 'Histogram Plot' },
    { value: 'pie', label: 'Pie Plot' },
    { value: 'sankey', label: 'Sankey Diagram' },
    { value: 'node', label: 'Node Proximity' }
  ];

  const xVariables = ["Time", "Distance", "Score", "Attempts"];
  const yVariables = ["Infections", "Vaccinations", "Population", "Efficiency"];

  const questions = [
    "What were your initial thoughts or feelings about the game when you first saw it?",
    "Describe your strategy during the game. Did it change over time?",
    "What was the most challenging part of the game for you?",
    "Were there any moments that you found particularly surprising or interesting?",
    "If you could change one thing about the game, what would it be and why?",
    "How did this game make you think about the real-world topic it represents?",
    "If you played before, how did this round compare to your previous experiences?",
    "If you were a researcher, what data would you collect from this game?",
    "What part of the game was most engaging?",
    "What part of the game was most confusing?",
    "How many times did you try the game?",
    "What was your final score?",
    "How do you think the creators of this game want you to feel?",
    "What is the key takeaway from the game?",
    "If you got infected, what time did it happen?",
    "How do you think the vaccine affected the spread this time?",
    "Is there anything else you would like to share about your experience?"
  ];

  // Person filter state (unique per plot, decorative for now)
  const [plot1PersonFilter, setPlot1PersonFilter] = useState(playerNames.reduce((acc, name) => ({ ...acc, [name]: false }), {}));
  const [plot2PersonFilter, setPlot2PersonFilter] = useState(playerNames.reduce((acc, name) => ({ ...acc, [name]: false }), {}));

  const handleGameSelect = (game) => {
    if (game.enabled) {
      logAction(`Selected game: ${game.name}`);
      setSelectedGame(game.key);
      setShowLogin(true);
    }
  };

  const handleLogin = () => {
    if (selectedPlayer) {
      logAction(`Player logged in: ${selectedPlayer}`);
      setShowLogin(false);
      setActiveTab('journal');
    }
  };

  const handleBackToGames = () => {
    logAction('Clicked back to games');
    setSelectedGame(null);
    setShowLogin(false);
    setSelectedPlayer('');
    setActiveTab('plot');
  };

  const handleTabClick = (tabName) => {
    if (activeTab === tabName) {
      return;
    }
    logAction(`Switched to ${tabName} tab`);
    setActiveTab(tabName);
  };

  const handlePlotTypeChange = (plotNumber, newType) => {
    logAction(`Plot ${plotNumber} type changed to: ${newType}`);
    if (plotNumber === 1) {
      setPlot1Type(newType);
    } else {
      setPlot2Type(newType);
    }
  };

  const handleVariableChange = (plotNumber, axis, variable, checked) => {
    logAction(`Plot ${plotNumber} ${axis}-variable "${variable}" ${checked ? 'selected' : 'deselected'}`);
    
    if (plotNumber === 1) {
      if (axis === 'X') {
        const newVars = checked 
          ? [...plot1XVariables, variable]
          : plot1XVariables.filter(v => v !== variable);
        setPlot1XVariables(newVars);
      } else {
        const newVars = checked 
          ? [...plot1YVariables, variable]
          : plot1YVariables.filter(v => v !== variable);
        setPlot1YVariables(newVars);
      }
    } else {
      if (axis === 'X') {
        const newVars = checked 
          ? [...plot2XVariables, variable]
          : plot2XVariables.filter(v => v !== variable);
        setPlot2XVariables(newVars);
      } else {
        const newVars = checked 
          ? [...plot2YVariables, variable]
          : plot2YVariables.filter(v => v !== variable);
        setPlot2YVariables(newVars);
      }
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification({ message: '', type: '' });
    }, 3000);
  };

  const handleExport = () => {
    logAction('Clicked Export button');
    setTimeout(() => {
      exportLog();
      showNotification('User actions exported successfully!', 'success');
    }, 100);
  };

  const handleErase = () => {
    logAction('Clicked Erase All User Data button');
    clearLog();
    showNotification('All user data has been erased.', 'error');
  };

  // Show game selection screen
  if (!selectedGame) {
    return (
      <div className={`${theme}-mode`} style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--offwhite-bg)"
      }}>
        {notification.message && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}
        
        <h1 style={{ fontSize: "4rem", marginBottom: "2rem", color: "var(--text-dark)" }}>DataOrganisms</h1>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {games.map((game) => (
            <button
              key={game.key}
              onClick={() => handleGameSelect(game)}
              className={game.enabled ? "dark-red" : "dimmer-red"}
              style={{
                fontSize: "1.5rem",
                padding: "0.8rem 1.5rem",
                cursor: game.enabled ? "pointer" : "not-allowed",
                opacity: game.enabled ? 1 : 0.5,
                borderRadius: "8px",
                border: "none"
              }}
            >
              {game.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Show login screen
  if (showLogin) {
    return (
      <div className={`${theme}-mode`} style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--offwhite-bg)"
      }}>
        {notification.message && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}
        
        <div style={{
          background: "var(--cream-panel)",
          padding: "2rem",
          borderRadius: "8px",
          border: "2px solid var(--divider-green-light)",
          minWidth: "300px",
          textAlign: "center"
        }}>
          <h2 style={{ marginBottom: "1.5rem", color: "var(--text-dark)" }}>Select Your Player</h2>
          <select
            value={selectedPlayer}
            onChange={(e) => setSelectedPlayer(e.target.value)}
            style={{
              width: "100%",
              padding: "0.8rem",
              fontSize: "1.1rem",
              background: "var(--offwhite-bg)",
              color: "var(--text-dark)",
              border: "1px solid var(--panel-border)",
              borderRadius: "4px",
              marginBottom: "1.5rem"
            }}
          >
            <option value="">Choose a player...</option>
            {playerNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <button
              onClick={() => {
                setShowLogin(false);
                setSelectedGame(null);
                setSelectedPlayer('');
              }}
              style={{
                padding: "0.8rem 1.5rem",
                background: "var(--dimmer-red)",
                color: "var(--text-light)",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "1rem"
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleLogin}
              disabled={!selectedPlayer}
              style={{
                padding: "0.8rem 1.5rem",
                background: selectedPlayer ? "var(--accent-green)" : "var(--dimmer-green)",
                color: "var(--text-dark)",
                border: "none",
                borderRadius: "8px",
                cursor: selectedPlayer ? "pointer" : "not-allowed",
                fontSize: "1rem",
                opacity: selectedPlayer ? 1 : 0.6
              }}
            >
              Start Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show game content with tabs
  return (
    <div className={`${theme}-mode`} style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "var(--offwhite-bg)"
    }}>
      {notification.message && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      
      {/* Header with tabs */}
      <div style={{
        padding: "1rem",
        background: "var(--cream-panel)",
        borderBottom: "2px solid var(--divider-green-light)",
        display: "flex",
        alignItems: "center",
        gap: "1rem"
      }}>
        <div style={{ flex: 1, display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => handleTabClick('plot')}
            style={{
              flex: 1,
              padding: "1rem",
              background: activeTab === 'plot' ? "var(--accent-green)" : "var(--cream-panel)",
              color: "var(--text-dark)",
              border: "none",
              cursor: "pointer",
              fontSize: "1.1rem"
            }}
          >
            Plot
          </button>
          <button
            onClick={() => handleTabClick('journal')}
            style={{
              flex: 1,
              padding: "1rem",
              background: activeTab === 'journal' ? "var(--accent-green)" : "var(--cream-panel)",
              color: "var(--text-dark)",
              border: "none",
              cursor: "pointer",
              fontSize: "1.1rem"
            }}
          >
            Journal
          </button>
          <button
            onClick={() => handleTabClick('settings')}
            style={{
              flex: 1,
              padding: "1rem",
              background: activeTab === 'settings' ? "var(--accent-green)" : "var(--cream-panel)",
              color: "var(--text-dark)",
              border: "none",
              cursor: "pointer",
              fontSize: "1.1rem"
            }}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Full screen content area */}
      <div style={{ flex: 1, overflow: 'auto', padding: '1rem', background: "var(--offwhite-bg)" }}>
        {activeTab === 'plot' && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '1rem',
              flex: 1,
              minHeight: '400px',
              marginBottom: '1rem',
              width: '100%',
              overflowX: 'auto',
            }}>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <PlotComponent plotLabel="Plot 1" theme={theme} data={[]} logAction={logAction} />
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <PlotComponent plotLabel="Plot 2" theme={theme} data={[]} logAction={logAction} />
              </div>
            </div>
          </div>
        )}
        {activeTab === 'journal' && (
          <div>
            <h3>Journal</h3>
            {questions.map((q, i) => (
              <QuestionBox key={i} question={q} index={i} logAction={logAction} />
            ))}
          </div>
        )}
        {activeTab === 'settings' && (
          <div>
            <h3>Settings</h3>
            <div style={{ marginBottom: '1rem' }}>
              <p>Current Player: <strong>{selectedPlayer}</strong></p>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <p>Color Palette</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button onClick={() => setTheme('unity')} className={theme === 'unity' ? 'primary' : ''}>Unity Mode</button>
                <button onClick={() => setTheme('dark')} className={theme === 'dark' ? 'primary' : ''}>Dark Mode</button>
                <button onClick={() => setTheme('light')} className={theme === 'light' ? 'primary' : ''}>Light Mode</button>
              </div>
            </div>
            <div style={{ marginTop: '1.5rem' }}>
              <p>Data Management</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button onClick={handleExport} style={{ width: '100%' }}>Export User Actions</button>
                <button onClick={handleErase} className="danger" style={{ width: '100%' }}>Erase All User Data</button>
              </div>
            </div>
            <div style={{ marginTop: '1.5rem' }}>
              <p>Navigation</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button onClick={handleBackToGames} style={{ width: '100%' }}>← Back to Games</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleScreenLayout; 