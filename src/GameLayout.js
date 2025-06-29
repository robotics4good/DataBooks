import React, { useState, useRef, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import OutbreakSquad from "./games/OutbreakSquad";
import WhisperWeb from "./games/WhisperWeb";
import LogisticsLeague from "./games/LogisticsLeague";
import PollinationParty from "./games/PollinationParty";
import RushHourRebels from "./games/RushHourRebels";
import { useUserLog } from "./UserLog";

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

const RightPanelContent = ({ gameName, theme }) => {
  switch (gameName) {
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
      return <div>Select a game</div>;
  }
};

const DualScreenLayout = ({ dualScreen, setDualScreen, showLogin, setShowLogin, selectedPlayer, setSelectedPlayer, selectedGame, setSelectedGame, handleGameSelect, handleLogin, handleBackToGames, games, playerNames }) => {
  const { logAction, exportLog, clearLog } = useUserLog();
  const { gameName } = useParams();
  const navigate = useNavigate();

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
    }}>
       {notification.message && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
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
        <div className="tab-header">
          <button
            className="tab-btn"
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
            className="tab-btn"
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
          <button
            className="tab-btn"
            onClick={() => setDualScreen(false)}
            style={{
              flex: 1,
              padding: "1rem",
              background: "var(--cream-panel)",
              color: "var(--text-dark)",
              border: "none",
              cursor: "pointer",
              fontSize: "1.1rem",
              fontWeight: 600
            }}
          >
            Single Screen
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
                  <button onClick={handleExport} style={{ width: '100%' }}>Export User Actions</button>
                  <button onClick={handleErase} className="danger" style={{ width: '100%' }}>Erase All User Data</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className="resizer"
        onMouseDown={handleMouseDown}
        style={{
          width: '8px',
          cursor: 'col-resize',
          background: isDragging ? 'var(--divider-green-dark)' : 'var(--divider-green-light)',
          zIndex: 2,
        }}
      />
      <div
        className="right-panel"
        style={{
          flex: 1,
          userSelect: isDragging ? 'none' : 'auto',
          overflow: 'hidden',
          background: 'var(--offwhite-bg)'
        }}
      >
        <RightPanelContent gameName={gameName} theme={theme} />
      </div>
    </div>
  );
};

export default DualScreenLayout; 