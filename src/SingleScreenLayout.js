import React, { useState, useRef, useLayoutEffect } from 'react';
import AlienInvasion from "./games/AlienInvasion";
import WhisperWeb from "./games/WhisperWeb";
import LogisticsLeague from "./games/LogisticsLeague";
import PollinationParty from "./games/PollinationParty";
import RushHourRebels from "./games/RushHourRebels";
import { useUserLog } from "./UserLog";
import PlotComponent from "./plots/PlotComponent";
import { useJournal } from "./JournalContext";

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
    const { journalAnswers, setJournalAnswer } = useJournal();
    const answer = journalAnswers[index] || "";
    const handleAnswerChange = (e) => {
        setJournalAnswer(index, e.target.value);
    };

    const handleAnswerBlur = (e) => {
        const value = e.target.value;
        const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
        logAction(`journal_entry`, `Question ${index + 1} word_count: ${wordCount}`);
    };

    return (
        <div style={styles.questionBox}>
            <label style={styles.questionLabel}>
                {question}
            </label>
            <AutoResizingTextarea
                placeholder="Your answer..."
                value={answer}
                onChange={handleAnswerChange}
                onBlur={handleAnswerBlur}
                style={styles.textarea}
            />
        </div>
    );
};

const GameContent = ({ selectedGame, theme }) => {
  switch (selectedGame) {
    case 'alien-invasion':
      return <AlienInvasion theme={theme} />;
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

// Style objects for SingleScreenLayout
const styles = {
  main: {
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    background: "var(--offwhite-bg)"
  },
  tabHeader: {
    display: "flex",
    background: "var(--cream-panel)",
    borderBottom: "2px solid var(--panel-border)",
    height: 48,
    alignItems: 'flex-end',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
  },
  contentArea: {
    minHeight: '100vh',
    padding: 0,
    paddingBottom: 0
  },
  plotRow: {
    display: "flex",
    gap: "20px",
    paddingBottom: 0
  },
  plotContainer: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    padding: '20px',
    paddingBottom: 0,
    marginBottom: '2rem',
    boxSizing: 'border-box'
  },
  card: {
    background: "var(--cream-panel)",
    borderRadius: "8px",
    padding: "20px",
    border: "1px solid var(--panel-border)"
  },
  notification: {
    // Notification styles are handled by CSS class, but you can add fallback styles here if needed
  },
  settingsButton: (color) => ({
    padding: "10px 20px",
    background: color,
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer"
  }),
  questionBox: {
    marginBottom: '1rem'
  },
  questionLabel: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: 'bold'
  },
  textarea: {
    width: "100%",
    minHeight: '50px',
    background: "var(--cream-panel)",
    color: "var(--text-dark)",
    border: "1px solid var(--panel-border)",
    borderRadius: "4px",
    padding: "0.5rem",
    resize: "none",
    boxSizing: 'border-box',
    margin: 0
  }
};

// Helper to get display name for header
const getGameDisplayName = (selectedGame) => {
  if (!selectedGame) return "";
  if (typeof selectedGame === "string") {
    return selectedGame.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  if (selectedGame.name) return selectedGame.name;
  if (selectedGame.key) {
    return selectedGame.key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  return String(selectedGame);
};

const SingleScreenLayout = ({ selectedGame, handleBackToGames, playerNames, onToggleLayout }) => {
  const { logAction, exportLog, clearLog, exportLogAsJson } = useUserLog();
  const [activeTab, setActiveTab] = useState('plot');
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [theme, setTheme] = useState('unity');
  
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

  const handleTabClick = (tabName) => {
    if (activeTab === tabName) {
      return;
    }
    logAction(`Switched to ${tabName} tab`);
    setActiveTab(tabName);
  };

  const handlePlotTypeChange = (plotNumber, newType) => {
    logAction(`Plot ${plotNumber} type changed to ${newType}`);
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

  return (
    <div className={`${theme}-mode`} style={styles.main}>
      {notification.message && (
        <div className={`notification ${notification.type}`}>{notification.message}</div>
      )}
      
      {/* Header with back button and toggle */}
      <div className="tab-header" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 32px',
        height: '56px',
        background: 'linear-gradient(90deg, #7b8ed6 0%, #8f6ed5 100%)',
        borderBottom: 'none',
        boxShadow: '0 2px 8px rgba(34,34,34,0.04)'
      }}>
        <button
          onClick={handleBackToGames}
          style={{
            background: 'rgba(255,255,255,0.15)',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '10px',
            padding: '0.7em 1.5em',
            fontSize: '1.1rem',
            border: 'none',
            boxShadow: '0 1px 4px rgba(80,200,120,0.08)',
            transition: 'background 0.2s',
            cursor: 'pointer',
            marginRight: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5em',
          }}
        >
          <span style={{fontSize: '1.2em', marginRight: '0.3em'}}>&larr;</span> Back to Games
        </button>
        <div style={{ flex: 1, textAlign: 'center', color: 'white', fontWeight: 700, fontSize: '1.5rem', letterSpacing: '0.02em', textShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          {getGameDisplayName(selectedGame)}
        </div>
        <button
          onClick={onToggleLayout}
          style={{
            background: 'rgba(255,255,255,0.15)',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '10px',
            padding: '0.7em 1.5em',
            fontSize: '1.1rem',
            border: 'none',
            boxShadow: '0 1px 4px rgba(80,200,120,0.08)',
            transition: 'background 0.2s',
            cursor: 'pointer',
            marginLeft: '16px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          Single Screen
        </button>
      </div>
      {/* Main content area */}
      <div style={{
        marginTop: '56px', // Push content below fixed header
        display: "flex",
        flexDirection: "column"
      }}>
        {/* Full-width tab bar for Plot/Journal/Settings */}
        <div className="tab-header single-tab-header" style={{
          display: 'flex',
          justifyContent: 'space-evenly',
          alignItems: 'center',
          background: 'var(--offwhite-bg)',
          borderBottom: 'none',
          height: 48,
          width: '100%',
          margin: 0,
          marginBottom: '12px',
          borderRadius: 0,
          boxShadow: 'none',
          position: 'relative',
          zIndex: 1,
        }}>
          <button
            className="tab-btn"
            onClick={() => setActiveTab('plot')}
            style={{
              background: 'none',
              color: 'var(--text-dark)',
              border: 'none',
              borderRadius: 0,
              fontSize: '1.15rem',
              fontWeight: activeTab === 'plot' ? 700 : 600,
              cursor: 'pointer',
              outline: 'none',
              position: 'relative',
              transition: 'color 0.2s',
              boxShadow: 'none',
              padding: 0,
              minWidth: '120px',
            }}
          >
            {activeTab === 'plot' ? (
              <span style={{
                display: 'inline-block',
                background: 'rgba(80, 200, 120, 0.13)',
                borderRadius: 999,
                padding: '0.4em 1.5em',
                fontWeight: 700,
                color: 'var(--accent-green)',
                fontSize: '1.1em',
              }}>Plot</span>
            ) : 'Plot'}
          </button>
          <button
            className="tab-btn"
            onClick={() => setActiveTab('journal')}
            style={{
              background: 'none',
              color: 'var(--text-dark)',
              border: 'none',
              borderRadius: 0,
              fontSize: '1.15rem',
              fontWeight: activeTab === 'journal' ? 700 : 600,
              cursor: 'pointer',
              outline: 'none',
              position: 'relative',
              transition: 'color 0.2s',
              boxShadow: 'none',
              padding: 0,
              minWidth: '120px',
            }}
          >
            {activeTab === 'journal' ? (
              <span style={{
                display: 'inline-block',
                background: 'rgba(80, 200, 120, 0.13)',
                borderRadius: 999,
                padding: '0.4em 1.5em',
                fontWeight: 700,
                color: 'var(--accent-green)',
                fontSize: '1.1em',
              }}>Journal</span>
            ) : 'Journal'}
          </button>
          <button
            className="tab-btn"
            onClick={() => setActiveTab('settings')}
            style={{
              background: 'none',
              color: 'var(--text-dark)',
              border: 'none',
              borderRadius: 0,
              fontSize: '1.15rem',
              fontWeight: activeTab === 'settings' ? 700 : 600,
              cursor: 'pointer',
              outline: 'none',
              position: 'relative',
              transition: 'color 0.2s',
              boxShadow: 'none',
              padding: 0,
              minWidth: '120px',
            }}
          >
            {activeTab === 'settings' ? (
              <span style={{
                display: 'inline-block',
                background: 'rgba(80, 200, 120, 0.13)',
                borderRadius: 999,
                padding: '0.4em 1.5em',
                fontWeight: 700,
                color: 'var(--accent-green)',
                fontSize: '1.1em',
              }}>Settings</span>
            ) : 'Settings'}
          </button>
        </div>
        {activeTab === 'plot' && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={styles.plotRow}>
              {/* Left Plot */}
              <div style={styles.plotContainer}>
                <PlotComponent
                  plotLabel="Plot 1"
                  theme={theme}
                  data={[]}
                  logAction={logAction}
                />
              </div>
              {/* Right Plot */}
              <div style={styles.plotContainer}>
                <PlotComponent
                  plotLabel="Plot 2"
                  theme={theme}
                  data={[]}
                  logAction={logAction}
                />
              </div>
            </div>
          </div>
        )}
        {activeTab === 'journal' && (
          <React.Fragment>
            <div style={{ height: "100%", padding: "20px", overflow: "auto" }}>
              <div style={styles.card}>
                <h3 style={{ marginBottom: "20px", color: "var(--text-dark)" }}>Reflection Journal</h3>
                {questions.map((question, index) => (
                  <QuestionBox
                    key={index}
                    question={question}
                    index={index}
                    logAction={logAction}
                  />
                ))}
              </div>
            </div>
          </React.Fragment>
        )}
        {activeTab === 'settings' && (
          <React.Fragment>
            <div style={{ height: "100%", padding: "20px", overflow: "auto" }}>
              <div style={styles.card}>
                <h3 style={{ marginBottom: "20px", color: "var(--text-dark)" }}>Settings</h3>
                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ marginBottom: "10px", color: "var(--text-dark)" }}>Data Management</h4>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={exportLogAsJson}
                      style={styles.settingsButton("var(--accent-green)")}
                    >
                      Export Data
                    </button>
                    <button
                      onClick={handleErase}
                      style={styles.settingsButton("#dc3545")}
                    >
                      Erase All Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
};

export default SingleScreenLayout; 