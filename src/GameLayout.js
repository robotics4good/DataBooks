import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import OutbreakSquad from "./games/OutbreakSquad";
import WhisperWeb from "./games/WhisperWeb";
import LogisticsLeague from "./games/LogisticsLeague";
import PollinationParty from "./games/PollinationParty";
import RushHourRebels from "./games/RushHourRebels";
import { useUserLog } from "./UserLog";

const MIN_WIDTH = 0.3; // 30%
const MAX_WIDTH = 0.7; // 70%

const GameLayout = () => {
  const { gameName } = useParams();
  const [activeTab, setActiveTab] = useState('journal');
  const [sidebarWidth, setSidebarWidth] = useState(window.innerWidth * MIN_WIDTH);
  const dragging = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [journalText, setJournalText] = useState("");
  const { logAction, exportActions, userActions, clearActions } = useUserLog();
  const navigate = useNavigate();

  // Map game names to components
  const gameComponents = {
    'outbreak-squad': OutbreakSquad,
    'whisper-web': WhisperWeb,
    'logistics-league': LogisticsLeague,
    'pollination-party': PollinationParty,
    'rush-hour-rebels': RushHourRebels
  };

  const GameComponent = gameComponents[gameName];

  // Drag handlers
  const onMouseDown = (e) => {
    dragging.current = true;
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
    // Attach listeners directly
    const onMouseMove = (e) => {
      if (!dragging.current) return;
      const newWidth = Math.max(
        window.innerWidth * MIN_WIDTH,
        Math.min(e.clientX, window.innerWidth * MAX_WIDTH)
      );
      setSidebarWidth(newWidth);
    };
    const onMouseUp = () => {
      dragging.current = false;
      setIsDragging(false);
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  if (!GameComponent) {
    return <div>Game not found</div>;
  }

  // Logging for tab switches
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    logAction('tab_switch', `Switched to tab: ${tab}`);
  };

  // Logging for left-side button clicks (future extensibility)
  const handleButtonClick = (label) => {
    logAction('button_click', `Clicked button: ${label}`);
  };

  // Logging for journal textarea
  const handleJournalFocus = () => {
    const wordCount = journalText.trim() ? journalText.trim().split(/\s+/).length : 0;
    logAction('journal_focus', `Journal focus (word count: ${wordCount})`);
  };
  const handleJournalChange = (e) => {
    setJournalText(e.target.value);
    const wordCount = e.target.value.trim() ? e.target.value.trim().split(/\s+/).length : 0;
    logAction('journal_change', `Journal changed (word count: ${wordCount})`);
  };

  // Export and log so that the export action is included in the same CSV
  const handleExportActions = () => {
    // Log, then export after state updates (next tick)
    logAction('export_user_actions', `Exported user actions (count: ${userActions.length + 1})`);
    setTimeout(() => {
      exportActions();
    }, 0);
  };

  return (
    <div style={{ 
      height: "100vh", 
      display: "flex", 
      background: "#0a0a0a",
      color: "white"
    }}>
      {/* Left Side - Tabs */}
      <div style={{ 
        width: sidebarWidth, 
        minWidth: window.innerWidth * MIN_WIDTH, 
        maxWidth: window.innerWidth * MAX_WIDTH, 
        background: "var(--cream-panel)",
        display: "flex",
        flexDirection: "column",
        userSelect: dragging.current ? 'none' : 'auto',
        zIndex: 1,
        boxSizing: 'border-box',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: 0,
        position: 'relative',
      }}>
        {/* Tab Headers */}
        <div className="tab-header">
          <button
            className="tab-btn"
            onClick={() => { handleTabSwitch('journal'); handleButtonClick('Journal Tab'); }}
            style={{
              flex: 1,
              padding: "1rem",
              background: activeTab === 'journal' ? "var(--accent-green)" : "var(--cream-panel)",
              color: activeTab === 'journal' ? "var(--text-dark)" : "var(--text-dark)",
              border: "none",
              cursor: "pointer",
              fontSize: "1.1rem"
            }}
          >
            Journal
          </button>
          <button
            className="tab-btn"
            onClick={() => { handleTabSwitch('settings'); handleButtonClick('Settings Tab'); }}
            style={{
              flex: 1,
              padding: "1rem",
              background: activeTab === 'settings' ? "var(--accent-green)" : "var(--cream-panel)",
              color: activeTab === 'settings' ? "var(--text-dark)" : "var(--text-dark)",
              border: "none",
              cursor: "pointer",
              fontSize: "1.1rem"
            }}
          >
            Settings
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ 
          flex: 1, 
          padding: "1rem",
          overflowY: "auto",
          overflowX: "hidden",
          boxSizing: 'border-box'
        }}>
          {activeTab === 'journal' && (
            <div>
              <h3>Game Journal</h3>
              <p>Track your progress and observations here.</p>
              <textarea
                placeholder="Write your notes here..."
                value={journalText}
                onFocus={handleJournalFocus}
                onChange={handleJournalChange}
                style={{
                  width: "100%",
                  minWidth: 0,
                  maxWidth: "100%",
                  background: "var(--cream-panel)",
                  color: "var(--text-dark)",
                  border: "1px solid var(--panel-border)",
                  borderRadius: "4px",
                  padding: "0.5rem",
                  resize: "none",
                  boxSizing: 'border-box',
                  margin: 0
                }}
              />
              <button
                onClick={handleExportActions}
                className="primary"
                style={{
                  marginTop: '1rem',
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Export User Actions
              </button>
              <button
                onClick={clearActions}
                className="danger"
                style={{
                  marginTop: '0.5rem',
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Erase All User Data (Testing Only)
              </button>
              <div style={{ position: 'fixed', left: 0, bottom: 0, width: sidebarWidth, zIndex: 10, background: 'var(--cream-panel)', boxSizing: 'border-box', padding: '0.5rem' }}>
                <button
                  onClick={() => navigate('/')}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: 'var(--accent-blue)', color: 'var(--text-light)', fontWeight: 600, fontSize: '1.1rem', cursor: 'pointer', border: 'none', boxShadow: 'none', outline: 'none' }}
                >
                  Back to Game Selection
                </button>
              </div>
            </div>
          )}
          {activeTab === 'settings' && (
            <div></div>
          )}
        </div>
      </div>
      {/* Draggable Divider */}
      <div
        onMouseDown={onMouseDown}
        style={{
          width: '6px',
          cursor: 'col-resize',
          background: dragging.current ? 'var(--divider-green-dark)' : 'var(--divider-green-light)',
          zIndex: 2
        }}
      />
      {/* Right Side - Game Content */}
      <div style={{ 
        flex: 1, 
        display: "flex",
        flexDirection: "column",
        userSelect: isDragging ? 'none' : 'auto',
        background: 'var(--offwhite-bg)'
      }}>
        <GameComponent sessionId={`${gameName}-${Date.now()}`} />
      </div>
    </div>
  );
};

export default GameLayout; 