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

const SingleScreenLayout = ({ selectedGame, handleBackToGames, playerNames }) => {
  const { logAction, exportLog, clearLog } = useUserLog();
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

      {/* Tab Header */}
      <div style={{
        display: "flex",
        background: "var(--cream-panel)",
        borderBottom: "2px solid var(--panel-border)",
        padding: "0 20px"
      }}>
        <button
          onClick={() => handleTabClick('plot')}
          style={{
            padding: "15px 20px",
            border: "none",
            background: activeTab === 'plot' ? "var(--accent-color)" : "transparent",
            color: activeTab === 'plot' ? "white" : "var(--text-dark)",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "bold",
            borderBottom: activeTab === 'plot' ? "3px solid var(--accent-color)" : "none"
          }}
        >
          Plot
        </button>
        <button
          onClick={() => handleTabClick('journal')}
          style={{
            padding: "15px 20px",
            border: "none",
            background: activeTab === 'journal' ? "var(--accent-color)" : "transparent",
            color: activeTab === 'journal' ? "white" : "var(--text-dark)",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "bold",
            borderBottom: activeTab === 'journal' ? "3px solid var(--accent-color)" : "none"
          }}
        >
          Journal
        </button>
        <button
          onClick={() => handleTabClick('settings')}
          style={{
            padding: "15px 20px",
            border: "none",
            background: activeTab === 'settings' ? "var(--accent-color)" : "transparent",
            color: activeTab === 'settings' ? "white" : "var(--text-dark)",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "bold",
            borderBottom: activeTab === 'settings' ? "3px solid var(--accent-color)" : "none"
          }}
        >
          Settings
        </button>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'plot' && (
          <div style={{
            flex: 1,
            minHeight: 0,
            height: '100%',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'row',
            gap: '20px',
            padding: '20px'
          }}>
            {/* Plot 1 */}
            <div style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <PlotComponent
                plotLabel="Plot 1"
                theme={theme}
                playerNames={playerNames}
                // Each PlotComponent manages its own state
              />
            </div>
            {/* Plot 2 */}
            <div style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <PlotComponent
                plotLabel="Plot 2"
                theme={theme}
                playerNames={playerNames}
                // Each PlotComponent manages its own state
              />
            </div>
          </div>
        )}

        {activeTab === 'journal' && (
          <div style={{
            height: "100%",
            padding: "20px",
            overflow: "auto"
          }}>
            <div style={{
              background: "var(--cream-panel)",
              borderRadius: "8px",
              padding: "20px",
              border: "1px solid var(--panel-border)"
            }}>
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
        )}

        {activeTab === 'settings' && (
          <div style={{
            height: "100%",
            padding: "20px",
            overflow: "auto"
          }}>
            <div style={{
              background: "var(--cream-panel)",
              borderRadius: "8px",
              padding: "20px",
              border: "1px solid var(--panel-border)"
            }}>
              <h3 style={{ marginBottom: "20px", color: "var(--text-dark)" }}>Settings</h3>
              
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ marginBottom: "10px", color: "var(--text-dark)" }}>Theme</h4>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  style={{
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid var(--panel-border)",
                    background: "white"
                  }}
                >
                  <option value="unity">Unity</option>
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ marginBottom: "10px", color: "var(--text-dark)" }}>Data Management</h4>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={handleExport}
                    style={{
                      padding: "10px 20px",
                      background: "var(--accent-color)",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    Export Data
                  </button>
                  <button
                    onClick={handleErase}
                    style={{
                      padding: "10px 20px",
                      background: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    Erase All Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleScreenLayout; 