// ControlPanel.js - Comprehensive server data control panel
import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ESPDataPlot from './plots/ESPDataPlot';
import { useESPData } from './hooks/useESPData';
import { useUserLog } from './UserLog';
// Removed useUserLog import - Control Panel actions should not be logged
import { db, ref, get, set, remove, onValue, push } from './firebase';
import { formatSanDiegoTime, formatSanDiegoTimeOnly, getSanDiegoTimezoneInfo, timeService, getNistTime, getSanDiegoISOString } from './utils/timeUtils';
import { JOURNAL_QUESTIONS } from './components/JournalQuestions';

const cardStyle = {
  background: '#fff',
  borderRadius: '14px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
  padding: '28px 32px',
  marginBottom: '28px',
  maxWidth: '100%',
};
const badge = (color, text) => (
  <span style={{
    display: 'inline-block',
    background: color,
    color: '#fff',
    borderRadius: 8,
    padding: '4px 14px',
    fontWeight: 700,
    fontSize: 15,
    marginLeft: 12,
    marginRight: 0,
    letterSpacing: 0.5,
  }}>{text}</span>
);

// Add a simple toast notification component
const Toast = ({ message, onClose }) => (
  <div style={{
    position: 'fixed',
    top: 30,
    right: 30,
    background: '#222',
    color: '#fff',
    padding: '16px 28px',
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 18,
    boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
    zIndex: 9999,
    transition: 'opacity 0.3s',
  }}>
    {message}
    <button onClick={onClose} style={{ marginLeft: 18, background: 'transparent', color: '#fff', border: 'none', fontSize: 20, cursor: 'pointer' }}>&times;</button>
  </div>
);

// User Action Log Viewer component
const UserActionLogViewer = ({ sessionId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('clean'); // default to 'clean'

  const fetchLogs = async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const logsRef = ref(db, `sessions/${sessionId}/UserLogs`);
      const snapshot = await get(logsRef);
      const data = snapshot.val() || {};
      // Flatten: [{userId, timestamp, ...logPacket}] for every log in every batch
      const flatLogs = [];
      Object.entries(data).forEach(([userId, userLogs]) => {
        Object.entries(userLogs || {}).forEach(([batchTimestamp, logArray]) => {
          if (Array.isArray(logArray)) {
            logArray.forEach((logPacket) => {
              flatLogs.push({ userId, batchTimestamp, ...logPacket });
            });
          }
        });
      });
      // Sort by event timestamp descending (not batch timestamp)
      flatLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setLogs(flatLogs);
    } catch (err) {
      setError('Failed to fetch user action logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line
  }, [sessionId]);

  // Clean formatter for log entries
  const formatCleanLog = (log) => {
    const date = new Date(log.timestamp).toLocaleString();
    let summary = '';
    if (log.type === 'journal_entry') {
      if (log.action === 'submit') {
        summary = `${log.userId} submitted journal ${log.details?.journalNumber ?? '?'}: answered ${log.details?.answeredCount ?? '?'} of ${log.details?.totalQuestions ?? '?'} questions, total words: ${log.details?.totalWords ?? '?'}`;
      } else if (log.action === 'click_on') {
        summary = `${log.userId} clicked ON journal ${log.details?.journalNumber ?? '?'} question ${log.details?.questionIndex ?? '?'} (started editing)`;
      } else if (log.action === 'click_off') {
        summary = `${log.userId} clicked OFF journal ${log.details?.journalNumber ?? '?'} question ${log.details?.questionIndex ?? '?'} (word count: ${log.details?.wordCount ?? '?'})`;
      } else {
        summary = `${log.userId} journal action '${log.action}' on journal ${log.details?.journalNumber ?? '?'} question ${log.details?.questionIndex ?? '?'} (details: ${JSON.stringify(log.details)})`;
      }
    } else if (log.type === 'plot_interaction') {
      if (log.action === 'y_variable_toggled' || log.action === 'x_variable_toggled') {
        summary = `${log.userId} toggled ${log.action[0]} variable '${log.details?.variable ?? '?'}' on plot '${log.details?.plotLabel ?? '?'}' (selected: ${log.details?.selected ?? '?'})`;
      } else if (log.action === 'cadet_filter_toggled') {
        summary = `${log.userId} toggled cadet '${log.details?.cadet ?? '?'}' on plot '${log.details?.plotLabel ?? '?'}' (selected: ${log.details?.selected ?? '?'})`;
      } else if (log.action === 'cadet_filter_select_all' || log.action === 'cadet_filter_deselect_all') {
        summary = `${log.userId} ${log.action.replace('_', ' ')} on plot '${log.details?.plotLabel ?? '?'}'`;
      } else if (log.action === 'type_changed') {
        summary = `${log.userId} changed plot type to '${log.details?.newType ?? '?'}' on plot '${log.details?.plotLabel ?? '?'}'`;
      } else {
        summary = `${log.userId} plot interaction '${log.action}' on plot '${log.details?.plotLabel ?? '?'}' (details: ${JSON.stringify(log.details)})`;
      }
    } else if (log.type === 'navigation') {
      if (log.action === 'tab_change') {
        summary = `${log.userId} changed tab from '${log.details?.from ?? '?'}' to '${log.details?.to ?? '?'}'`;
      } else if (log.action === 'toggle_screen') {
        summary = `${log.userId} toggled screen to '${log.details?.to ?? '?'}' (triggered from: ${log.details?.triggeredFrom ?? '?'})`;
      } else {
        summary = `${log.userId} navigation action '${log.action}' (details: ${JSON.stringify(log.details)})`;
      }
    } else {
      summary = `${log.userId} did '${log.type}' (${log.action}) (details: ${JSON.stringify(log.details)})`;
    }
    return `${date} | ${summary}`;
  };

  return (
    <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: 24, marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontWeight: 800, fontSize: 22 }}>Recent User Action Logs</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 0, borderRadius: 6, overflow: 'hidden', border: '1.5px solid #e0e6f7', marginRight: 8 }}>
            <button
              onClick={() => setViewMode('raw')}
              style={{
                background: viewMode === 'raw' ? '#7c8cf8' : '#f7f9fc',
                color: viewMode === 'raw' ? '#fff' : '#222',
                border: 'none',
                padding: '7px 18px',
                fontWeight: 700,
                fontSize: 15,
                cursor: 'pointer',
                outline: 'none',
                transition: 'background 0.2s',
              }}
            >Raw</button>
            <button
              onClick={() => setViewMode('clean')}
              style={{
                background: viewMode === 'clean' ? '#7c8cf8' : '#f7f9fc',
                color: viewMode === 'clean' ? '#fff' : '#222',
                border: 'none',
                padding: '7px 18px',
                fontWeight: 700,
                fontSize: 15,
                cursor: 'pointer',
                outline: 'none',
                transition: 'background 0.2s',
              }}
            >Clean</button>
          </div>
          <button onClick={fetchLogs} disabled={loading} style={{ background: '#7c8cf8', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>{loading ? 'Loading...' : 'Refresh'}</button>
        </div>
      </div>
      {error && <div style={{ color: '#b71c1c', marginBottom: 12 }}>{error}</div>}
      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {viewMode === 'raw' ? (
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
              <thead>
                <tr style={{ background: '#f7f9fc' }}>
                  <th style={{ textAlign: 'left', padding: '8px 6px' }}>All Details (Full JSON)</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && !loading ? (
                  <tr><td style={{ color: '#888', textAlign: 'left', padding: 18 }}>No user action logs found for this session.</td></tr>
                ) : (
                  logs.map((log, idx) => (
                    <tr key={log.userId + log.timestamp + idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '6px 6px', fontFamily: 'monospace', whiteSpace: 'pre', fontSize: 13, textAlign: 'left' }}>
                        {JSON.stringify(log, null, 2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {logs.length === 0 && !loading ? (
              <li style={{ color: '#888', textAlign: 'center', padding: 18 }}>No user action logs found for this session.</li>
            ) : (
              logs.map((log, idx) => (
                <li key={log.userId + log.timestamp + idx} style={{ borderBottom: '1px solid #eee', padding: '10px 0', fontSize: 15 }}>
                  {formatCleanLog(log)}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

const ControlPanel = () => {
  const navigate = useNavigate();
  const { logAction } = useUserLog();
  
  const { 
    espData, 
    getPlotData, 
    getAvailableVariables,
    totalPackets,
    uniqueStudents,
    timeRange 
  } = useESPData();

  const [serverData, setServerData] = useState({});
  const [serverLoading, setServerLoading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [timezoneInfo, setTimezoneInfo] = useState(null);
  const [serverStatus, setServerStatus] = useState('connected');
  const [latestPacketsState, setLatestPacketsState] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [lastUpdatedESP, setLastUpdatedESP] = useState(null);
  const [lastUpdatedWebsite, setLastUpdatedWebsite] = useState(null);
  const [websiteDataState, setWebsiteDataState] = useState({});
  const [journalDataState, setJournalDataState] = useState({});
  const [websiteLoading, setWebsiteLoading] = useState(false);
  const [journalLoading, setJournalLoading] = useState(false);
  const [websiteError, setWebsiteError] = useState(null);
  const [journalError, setJournalError] = useState(null);
  const [websiteLastRefreshed, setWebsiteLastRefreshed] = useState(null);
  const [journalLastRefreshed, setJournalLastRefreshed] = useState(null);
  const [showFullLog, setShowFullLog] = useState(false);
  const [selectedLogSession, setSelectedLogSession] = useState(null);
  const logRefs = useRef({});
  const logScrollTops = useRef({});

  // Session management state
  const [currentSessionId, setCurrentSessionId] = useState("");
  const [sessionLoading, setSessionLoading] = useState(false);

  // Meeting state
  const [meetingActive, setMeetingActive] = useState(false);
  const [meetingLoading, setMeetingLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Manual refresh function for server data
  const refreshServerData = async () => {
    setServerLoading(true);
    setServerError(null);
    
    try {
      const serverDataRef = ref(db, '/');
      const snapshot = await get(serverDataRef);
      const data = snapshot.val();
      setServerData(data || {});
      
      // Update latest packets for real-time monitoring
      if (data?.devicePackets) {
        const packets = Object.values(data.devicePackets)
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 10);
        setLatestPacketsState(packets);
      }

      // Fetch NIST time
      try {
        const resp = await fetch('http://worldtimeapi.org/api/timezone/America/Los_Angeles');
        const nistData = await resp.json();
        if (nistData && nistData.datetime) {
          setLastUpdated(new Date(nistData.datetime));
        } else {
          setLastUpdated(new Date()); // fallback
        }
      } catch {
        setLastUpdated(new Date()); // fallback
      }
    } catch (err) {
      console.error("Error fetching server data:", err);
      setServerError(err.message);
    } finally {
      setServerLoading(false);
    }
  };

  // Get timezone information
  useEffect(() => {
    setTimezoneInfo(getSanDiegoTimezoneInfo());
  }, []);

  // Firebase is always connected when the app loads
  useEffect(() => {
    setServerStatus('connected');
  }, []);

  // Effect to handle scroll position for all logs
  useEffect(() => {
    if (!showFullLog) return;
    Object.entries(logRefs.current).forEach(([sessionId, ref]) => {
      if (ref && ref.scrollHeight > ref.clientHeight) {
        // If user was at bottom before update, keep at bottom
        const isAtBottom = ref.scrollTop + ref.clientHeight >= ref.scrollHeight - 5;
        if (isAtBottom) {
          ref.scrollTop = ref.scrollHeight;
        }
        // Otherwise, do not change scroll position
      }
    });
  }, [websiteDataState, showFullLog]);

  // Save scroll position BEFORE update (useLayoutEffect runs before DOM paint)
  useLayoutEffect(() => {
    if (!showFullLog) return;
    Object.entries(logRefs.current).forEach(([sessionId, ref]) => {
      if (ref) {
        logScrollTops.current[sessionId] = ref.scrollTop;
      }
    });
  }, [showFullLog, websiteDataState]);

  // Restore scroll position AFTER update
  useEffect(() => {
    if (!showFullLog) return;
    Object.entries(logRefs.current).forEach(([sessionId, ref]) => {
      if (ref && typeof logScrollTops.current[sessionId] === 'number') {
        ref.scrollTop = logScrollTops.current[sessionId];
      }
    });
  }, [showFullLog, websiteDataState]);

  // Fetch current session ID from Firebase on mount
  useEffect(() => {
    const sessionRef = ref(db, 'activeSessionId');
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      setCurrentSessionId(snapshot.val() || "");
    });
    return () => unsubscribe();
  }, []);

  // Start a new session and write to Firebase
  const handleStartSession = useCallback(async () => {
    setSessionLoading(true);
    try {
      // Use San Diego time for session ID
      const now = timeService.getCurrentTime();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hour = now.getHours();
      const period = hour < 12 ? 'period1' : 'period2';
      const sessionId = `${year}${month}${day}${period}`;
      await set(ref(db, 'activeSessionId'), sessionId);
      await set(ref(db, `sessions/${sessionId}/meta`), {
        startedAt: getSanDiegoISOString(now),
        createdBy: 'teacher',
        createdAt: getSanDiegoISOString(timeService.getCurrentTime()),
      });
    } catch (err) {
      // Optionally log error
    } finally {
      setSessionLoading(false);
    }
  }, []);

  const handleBackToGames = () => {
    navigate('/');
  };

  // Helper to sanitize keys for Firebase paths
  const sanitizeForFirebase = (str) => (str || '').replace(/[.#$\[\]:/]/g, '_');
  const userId = 'teacher'; // Always 'teacher' for meeting logs

  // Log meeting event to Firebase under sessions/{sessionId}/MeetingLogs/{timestamp}
  const logMeetingEvent = async (eventType, rawTimestamp) => {
    try {
      const rawSessionId = localStorage.getItem('sessionId') || '';
      const sessionId = sanitizeForFirebase(rawSessionId);
      if (!sessionId) throw new Error('No sessionId found');
      const timestamp = sanitizeForFirebase(rawTimestamp);
      const meetingLogRef = ref(db, `sessions/${sessionId}/MeetingLogs/${timestamp}`);
      await set(meetingLogRef, {
        event: eventType,
        timestamp: getSanDiegoISOString(new Date(rawTimestamp))
      });
    } catch (err) {
      // Optionally handle/log error
    }
  };

  // Optimized meeting toggle: use timeService.getCurrentTime() for instant, NIST-anchored timestamps
  const handleMeetingToggle = async () => {
    if (meetingLoading) return;
    setMeetingLoading(true);
    try {
      const now = timeService.getCurrentTime();
      const rawTimestamp = getSanDiegoISOString(now);
      if (!meetingActive) {
        await logMeetingEvent('MEETINGSTART', rawTimestamp);
        logAction && logAction('navigation', { action: 'meeting_start', timestamp: rawTimestamp });
        setToast('Data meeting started!');
        setMeetingActive(true);
      } else {
        await logMeetingEvent('MEETINGEND', rawTimestamp);
        logAction && logAction('navigation', { action: 'meeting_end', timestamp: rawTimestamp });
        setToast('Data meeting ended.');
        setMeetingActive(false);
      }
    } catch (err) {
      setToast('Error: Could not update data meeting status.');
    } finally {
      setTimeout(() => setToast(null), 3000);
      setMeetingLoading(false);
    }
  };

  const renderWebsiteDataTree = (data, level = 0) => {
    if (!data || typeof data !== 'object') {
      return <span style={{ color: '#666' }}>{JSON.stringify(data)}</span>;
    }

    const getColorForKey = (key) => {
      if (key.includes('session')) return '#28a745';
      if (key.includes('user')) return '#17a2b8';
      return '#6f42c1';
    };

    return (
      <div style={{ marginLeft: level * 20 }}>
        {Object.entries(data).map(([key, value]) => (
          <div key={key} style={{ marginBottom: '8px' }}>
            <span style={{ 
              fontWeight: 'bold', 
              color: getColorForKey(key),
              cursor: 'pointer'
            }}>
              {key}:
            </span>
            {typeof value === 'object' ? (
              <renderWebsiteDataTree data={value} level={level + 1} />
            ) : (
              <span style={{ color: '#666', marginLeft: '8px' }}>{JSON.stringify(value)}</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Website data stats
  const websiteData = websiteDataState.sessions || {};
  const sessionCount = Object.keys(websiteData).length;
  const userActionsCount = (() => {
    let count = 0;
    Object.values(websiteData).forEach(session => {
      Object.values(session).forEach(entry => {
        if (entry.userActions) count += entry.userActions.length;
      });
    });
    return count;
  })();
  const journalEntriesCount = (() => {
    let count = 0;
    Object.values(websiteData).forEach(session => {
      Object.values(session).forEach(entry => {
        if (entry.journal && entry.journal.answers) count += Object.keys(entry.journal.answers).length;
      });
    });
    return count;
  })();

  // Device activity (latest 5 packets)
  const recentPackets = espData
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

  // Real-time data (latest X packets)
  const latestPackets = espData
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);

  // Firebase status
  const firebaseStatus = serverStatus === 'connected' ? (
    <span style={{ color: '#28a745', fontWeight: 600 }}>Firebase Connected</span>
  ) : (
    <span style={{ color: '#dc3545', fontWeight: 600 }}>Firebase Disconnected</span>
  );

  // Logging/streaming status
  const loggingActive = false; // dataSyncService.getSyncStatus()?.isRunning;

  // Top bar: Control Panel title and back button only
  const TopBar = () => (
    <div style={{ 
      background: 'linear-gradient(90deg, #6a82fb 0%, #a084ee 100%)',
      borderRadius: '0 0 18px 18px',
      padding: '32px 40px 24px 40px',
      marginBottom: 32,
      color: '#fff',
      boxShadow: '0 2px 12px rgba(80,80,180,0.10)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'relative',
      minHeight: 80,
    }}>
      <button onClick={handleBackToGames} style={{ background: '#7c8cf8', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, fontSize: 18, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>&larr; Back to Games</button>
      <h1 style={{ margin: 0, fontSize: 38, fontWeight: 800, letterSpacing: 1, textShadow: '0 2px 8px rgba(0,0,0,0.10)', color: '#fffbe8' }}>Control Panel</h1>
      <div style={{ width: 180, position: 'relative', height: 0 }}>
        <div style={{
          position: 'absolute',
          right: 0,
          bottom: -18,
          fontSize: 13,
          padding: '3px 12px',
          borderRadius: 10,
          background: serverStatus === 'connected' ? '#43d675' : '#dc3545',
          color: '#fff',
          fontWeight: 700,
          boxShadow: '0 1px 4px #e0e6f7',
          minWidth: 0,
          whiteSpace: 'nowrap',
          zIndex: 2,
        }}>
          {serverStatus === 'connected' ? 'Firebase Connected' : 'Firebase Disconnected'}
        </div>
      </div>
    </div>
  );

  // Header/status card: all status/info badges and time
  const HeaderSection = ({ noCard, hideLogging }) => (
    <div style={{ padding: 0, margin: 0 }}>
      <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
        {serverStatus === 'connected' ? badge('#43d675', 'Firebase Connected') : badge('#dc3545', 'Firebase Disconnected')}
      </div>
      <div style={{ color: '#666', fontSize: '0.95rem', marginBottom: 0 }}>
        {serverStatus !== 'connected' && (
          <>Firebase connection failed. Check your internet connection and Firebase configuration.</>
        )}
      </div>
    </div>
  );

  // Streaming controls card
  const StreamingControls = () => (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#222', marginBottom: 2 }}>Real-Time Streaming</div>
          <div style={{ fontSize: 15, color: '#666', fontStyle: 'italic' }}>{loggingActive ? 'Data is being sent to server and Firebase.' : 'No data being sent to server or Firebase'}</div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <button onClick={() => {}} style={{ background: loggingActive ? '#e74c3c' : '#43d675', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 32px', fontWeight: 800, fontSize: 20, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>{loggingActive ? 'STOP' : 'START'}</button>
        </div>
      </div>
      <div style={{ background: '#fffbe6', borderRadius: 8, padding: '16px 18px', margin: '18px 0 10px 0', border: '1px solid #ffe58f', color: '#8d6a00', fontWeight: 600, fontSize: 17 }}>
        <b>Streaming {loggingActive ? 'Enabled' : 'Disabled'}:</b> {loggingActive ? 'User actions and journal entries are being sent to the server and Firebase in real time.' : 'No data is being sent to the server or Firebase. User actions and journal entries are only stored locally in your browser. Click the START button to enable one-minute logging to server and immediate Firebase logging.'}
      </div>
      <div style={{ fontWeight: 700, color: '#4a5cff', fontSize: 18, marginTop: 8 }}>
        Status: <span style={{ color: '#222' }}>{loggingActive ? 'All Logging Enabled' : 'All Logging Disabled'}</span>
        <span style={{ marginLeft: 32, color: '#4a5cff' }}>Server:</span>
      </div>
    </div>
  );

  // Session Management UI
  const SessionManager = () => (
    <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: 24, margin: '24px 0', display: 'flex', alignItems: 'center', gap: 24 }}>
      <div>
        <b>Current Session:</b> {currentSessionId ? <span style={{ color: '#2a6ebb' }}>{currentSessionId}</span> : <span style={{ color: '#888' }}>No session active</span>}
      </div>
      <button
        onClick={handleStartSession}
        style={{ background: '#2a6ebb', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}
        disabled={sessionLoading}
      >
        {sessionLoading ? 'Starting...' : 'Start New Session'}
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <TopBar />
      </div>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
        {/* --- GAME RUNNING SECTION --- */}
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 2px 12px rgba(80,80,180,0.10)',
          padding: '32px 32px 24px 32px',
          marginBottom: '38px',
          maxWidth: '100%',
          border: '1.5px solid #e0e6f7',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 0.5, color: '#2a2a2a', marginBottom: 32, textAlign: 'center', width: '100%' }}>
            Game Control Center
          </div>
          {/* Data Meeting controls: button and status in one line */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 28, width: '100%' }}>
            <button
              onClick={handleMeetingToggle}
              disabled={meetingLoading}
              style={{
                background: meetingActive ? '#e74c3c' : '#43d675',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '12px 28px',
                fontWeight: 800,
                fontSize: 18,
                cursor: meetingLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                minWidth: 170,
                outline: 'none',
                borderBottom: meetingActive ? '3px solid #b71c1c' : '3px solid #1e824c',
                filter: meetingLoading ? 'brightness(0.95)' : 'none',
                transition: 'background 0.2s, box-shadow 0.2s',
              }}
            >
              {meetingLoading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <span className="spinner" style={{
                    width: 20, height: 20, border: '3px solid #fff', borderTop: '3px solid #888', borderRadius: '50%', display: 'inline-block', marginRight: 10, animation: 'spin 1s linear infinite'
                  }} />
                  {meetingActive ? 'Ending...' : 'Starting...'}
                </span>
              ) : (
                meetingActive ? 'End Data Meeting' : 'Start Data Meeting'
              )}
            </button>
            <span style={{
              fontWeight: 700,
              fontSize: 16,
              color: meetingActive ? '#e74c3c' : '#43d675',
              background: meetingActive ? '#fbeaea' : '#eafbf0',
              borderRadius: 16,
              padding: '6px 18px',
              boxShadow: '0 1px 4px #e0e6f7',
              letterSpacing: 0.2,
              display: 'inline-block',
              transition: 'background 0.2s',
              marginLeft: 8,
            }}>
              Data Meeting {meetingActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          {/* Session controls row */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 12, width: '100%' }}>
            <button
              onClick={handleStartSession}
              style={{
                background: '#2a6ebb',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '12px 28px',
                fontWeight: 800,
                fontSize: 18,
                cursor: sessionLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 4px #e0e6f7',
                outline: 'none',
                borderBottom: '3px solid #1a4a8a',
                transition: 'background 0.2s',
              }}
              disabled={sessionLoading}
            >
              {sessionLoading ? 'Starting...' : 'Start New Session'}
            </button>
            <span style={{
              fontWeight: 700,
              fontSize: 16,
              color: currentSessionId ? '#2a6ebb' : '#888',
              background: currentSessionId ? '#eaf0fb' : '#f3f3f3',
              borderRadius: 16,
              padding: '6px 18px',
              boxShadow: '0 1px 4px #e0e6f7',
              letterSpacing: 0.2,
              display: 'inline-block',
              transition: 'background 0.2s',
              marginLeft: 8,
            }}>
              {currentSessionId ? currentSessionId : 'No session active'}
            </span>
          </div>
          {/* Firebase error message if not connected */}
          {serverStatus !== 'connected' && (
            <div style={{ color: '#b71c1c', background: '#fbeaea', borderRadius: 8, padding: '10px 18px', margin: '0 0 18px 0', textAlign: 'center', fontWeight: 600, fontSize: 15 }}>
              Firebase connection failed. Check your internet connection and Firebase configuration.
            </div>
          )}
        </div>
        {/* --- END GAME RUNNING SECTION --- */}

        {/* --- TESTING & DATA INSPECTION SECTION --- */}
        <hr style={{ margin: '40px 0', border: 0, borderTop: '2px solid #e0e0e0' }} />
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ color: '#7c8cf8', fontWeight: 800, marginBottom: 24, textAlign: 'center' }}>Testing & Data Inspection</h2>
          <UserActionLogViewer sessionId={currentSessionId} />
        </div>
        {/* --- END TESTING & DATA INSPECTION SECTION --- */}
      </div>
    </div>
  );
};

export default ControlPanel; 