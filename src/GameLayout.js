import React, { useState, useRef, useLayoutEffect } from 'react';
import AlienInvasion from "./games/AlienInvasion";
import WhisperWeb from "./games/WhisperWeb";
import LogisticsLeague from "./games/LogisticsLeague";
import PollinationParty from "./games/PollinationParty";
import RushHourRebels from "./games/RushHourRebels";
import PlotComponent from "./plots/PlotComponent";
import { useUserLog } from "./UserLog";
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
                }}
            />
        </div>
    );
};

const RightPanelContent = ({ selectedGame, theme, sessionId = "1234567890" }) => {
  switch (selectedGame) {
    case 'alien-invasion':
      return <AlienInvasion sessionId={sessionId} />;
    case 'whisper-web':
      return <WhisperWeb sessionId={sessionId} />;
    case 'logistics-league':
      return <LogisticsLeague sessionId={sessionId} />;
    case 'pollination-party':
      return <PollinationParty sessionId={sessionId} />;
    case 'rush-hour-rebels':
      return <RushHourRebels sessionId={sessionId} />;
    default:
      return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '1.2rem' }}>
        Select a game to begin
      </div>;
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

const DualScreenLayout = ({ selectedGame, handleBackToGames, playerNames, onToggleLayout }) => {
  const { logAction, exportLog, clearLog, exportLogAsJson } = useUserLog();

  const [leftWidth, setLeftWidth] = useState(30);
  const [activeTab, setActiveTab] = useState('journal');
  const [isDragging, setIsDragging] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [theme, setTheme] = useState('unity');

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

  const handleTabClick = (tabName) => {
    if (activeTab === tabName) {
      return;
    }
    logAction(`Switched to ${tabName} tab`);
    setActiveTab(tabName);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newLeftWidth = (e.clientX / window.innerWidth) * 100;
    const clampedWidth = Math.max(MIN_WIDTH_PERCENT, Math.min(newLeftWidth, MAX_WIDTH_PERCENT));
    setLeftWidth(clampedWidth);
  };

  useLayoutEffect(() => {
    const mouseMoveHandler = (e) => handleMouseMove(e);
    const mouseUpHandler = () => handleMouseUp();

    if (isDragging) {
      window.addEventListener('mousemove', mouseMoveHandler);
      window.addEventListener('mouseup', mouseUpHandler);
    }

    return () => {
      window.removeEventListener('mousemove', mouseMoveHandler);
      window.removeEventListener('mouseup', mouseUpHandler);
    };
  }, [isDragging]);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification({ message: '', type: '' });
    }, 3000);
  };

  const handleExport = () => {
    logAction('Clicked Export button');
    setTimeout(() => {
      exportLogAsJson();
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
      flexDirection: "column"
    }}>
       {notification.message && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
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
        borderBottom: '4px solid var(--tab-header-border)',
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
          Dual Screen
        </button>
      </div>
      {/* Main content area */}
      <div style={{
        display: "flex",
        flex: 1,
        overflow: "hidden",
        marginTop: '56px', // Push content below fixed header
      }}>
        <div
          className="left-panel"
          style={{
            width: `${leftWidth}%`,
            minWidth: `${MIN_WIDTH_PERCENT}%`,
            maxWidth: `${MAX_WIDTH_PERCENT}%`,
            display: "flex",
            flexDirection: "column",
            userSelect: isDragging ? 'none' : 'auto',
            zIndex: 1,
            position: 'relative',
          }}
        >
          {/* Secondary tab bar for Journal/Settings */}
          <div className="tab-header left-tab-header" style={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            background: 'var(--cream-panel)',
            borderBottom: '1px solid var(--panel-border)',
            height: 40,
            maxWidth: '320px',
            width: '90%',
            margin: '0 auto',
            marginTop: '8px',
            marginBottom: '12px',
            borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            position: 'relative',
            zIndex: 1,
            overflow: 'visible',
          }}>
            <button
              className="tab-btn"
              onClick={() => handleTabClick('journal')}
              style={{
                padding: '0.4em 1.2em',
                marginRight: '8px',
                background: 'var(--cream-panel)',
                color: 'var(--text-dark)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                position: 'relative',
                transition: 'background 0.2s, color 0.2s',
                boxShadow: 'none',
              }}
            >
              {activeTab === 'journal' ? (
                <span style={{
                  display: 'inline-block',
                  background: 'rgba(80, 200, 120, 0.10)',
                  borderRadius: 999,
                  padding: '0.3em 1em',
                  fontWeight: 700,
                  color: 'var(--accent-green)',
                  boxShadow: 'none',
                  fontSize: '1.05em',
                }}>Journal</span>
              ) : 'Journal'}
            </button>
            <button
              className="tab-btn"
              onClick={() => handleTabClick('settings')}
              style={{
                padding: '0.4em 1.2em',
                background: 'var(--cream-panel)',
                color: 'var(--text-dark)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                position: 'relative',
                transition: 'background 0.2s, color 0.2s',
                boxShadow: 'none',
              }}
            >
              {activeTab === 'settings' ? (
                <span style={{
                  display: 'inline-block',
                  background: 'rgba(80, 200, 120, 0.10)',
                  borderRadius: 999,
                  padding: '0.3em 1em',
                  fontWeight: 700,
                  color: 'var(--accent-green)',
                  boxShadow: 'none',
                  fontSize: '1.05em',
                }}>Settings</span>
              ) : 'Settings'}
            </button>
          </div>
          <div className="tab-content" style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
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
                    <button onClick={handleExport} style={{ width: '100%', background: 'var(--accent-green)', color: 'white' }}>Export Data</button>
                    <button onClick={handleErase} className="danger" style={{ width: '100%' }}>Erase All User Data</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Resizer */}
        <div
          style={{
            width: '4px',
            background: 'var(--panel-border)',
            cursor: 'col-resize',
            position: 'relative'
          }}
          onMouseDown={handleMouseDown}
        >
          <div style={{
            position: 'absolute',
            left: '-2px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '8px',
            height: '40px',
            background: 'var(--accent-color)',
            borderRadius: '4px'
          }} />
        </div>

        {/* Right Panel: Show PlotComponent */}
        <div
          className="right-panel"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "var(--offwhite-bg)",
            padding: "20px",
            overflowX: "hidden"
          }}
        >
          <PlotComponent
            plotLabel="Data Visualization"
            theme={theme}
            data={[]}
            logAction={logAction}
          />
        </div>
      </div>
    </div>
  );
};

export default DualScreenLayout; 