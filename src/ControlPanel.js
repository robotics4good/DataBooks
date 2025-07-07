import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, ref, get } from './firebase';
import dataSyncService from './services/dataSyncService';
import { default as ESPDataPlot } from './plots/ESPDataPlot';
import { formatSanDiegoTime } from './utils/timeUtils';
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

const ControlPanel = () => {
  const navigate = useNavigate();
  
  // State
  const [espData, setEspData] = useState({});
  const [websiteData, setWebsiteData] = useState({});
  const [espLoading, setEspLoading] = useState(false);
  const [websiteLoading, setWebsiteLoading] = useState(false);
  const [lastUpdatedESP, setLastUpdatedESP] = useState(null);
  const [lastUpdatedWebsite, setLastUpdatedWebsite] = useState(null);
  const [showRawESP, setShowRawESP] = useState(false);
  const [showRawWebsite, setShowRawWebsite] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [manualSyncLoading, setManualSyncLoading] = useState(false);
  const [journalEntries, setJournalEntries] = useState([]);
  const [journalLoading, setJournalLoading] = useState(false);
  const [sanDiegoTime, setSanDiegoTime] = useState('');
  const [firebaseConnected, setFirebaseConnected] = useState(true); // Assume true for now
  const [espError, setEspError] = useState(null);
  const [websiteError, setWebsiteError] = useState(null);

  // Fetch ESP data from Firebase
  const refreshESPData = async () => {
    setEspLoading(true);
    setEspError(null);
    try {
      const devicePacketsRef = ref(db, 'devicePackets');
      const snapshot = await get(devicePacketsRef);
      const data = snapshot.val();
      
      if (data) {
        console.log('ESP Data loaded:', data);
        setEspData(data);
      } else {
        console.log('No ESP data found in Firebase');
        setEspData({});
      }
      setLastUpdatedESP(new Date());
    } catch (err) {
      console.error('Error fetching ESP data:', err);
      setEspError(err.message);
      setEspData({});
    } finally {
      setEspLoading(false);
    }
  };

  // Fetch website data from Firebase
  const refreshWebsiteData = async () => {
    setWebsiteLoading(true);
    setWebsiteError(null);
    try {
      const syncDataRef = ref(db, 'syncData');
      const snapshot = await get(syncDataRef);
      const data = snapshot.val();
      
      if (data) {
        console.log('Website Data loaded:', data);
        setWebsiteData(data);
      } else {
        console.log('No website data found in Firebase');
        setWebsiteData({});
      }
      setLastUpdatedWebsite(new Date());
    } catch (err) {
      console.error('Error fetching website data:', err);
      setWebsiteError(err.message);
      setWebsiteData({});
    } finally {
      setWebsiteLoading(false);
    }
  };

  // Fetch journal entries from localStorage
  const refreshJournalEntries = () => {
    setJournalLoading(true);
    try {
      const stored = localStorage.getItem('journalAnswers');
      if (stored) {
        const answers = JSON.parse(stored);
        // Convert to array of {question, answer, index}
        const entries = Object.entries(answers).map(([index, answer]) => ({
          index,
          answer
        }));
        // Sort by index (or timestamp if available)
        entries.sort((a, b) => parseInt(b.index) - parseInt(a.index));
        setJournalEntries(entries);
      } else {
        setJournalEntries([]);
      }
    } catch (err) {
      setJournalEntries([]);
    } finally {
      setJournalLoading(false);
    }
  };

  // Manual sync
  const handleManualSync = async () => {
    setManualSyncLoading(true);
    try {
      await dataSyncService.performManualSync();
      setSyncStatus(dataSyncService.getSyncStatus());
    } catch (err) {
      // Optionally show error
    } finally {
      setManualSyncLoading(false);
    }
  };

  // San Diego time updater
  useEffect(() => {
    const updateTime = () => {
      setSanDiegoTime(formatSanDiegoTime(Date.now()));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load all data once on mount and set up periodic refresh
  useEffect(() => {
    testFirebaseConnection();
    refreshESPData();
    refreshWebsiteData();
    refreshJournalEntries();
    setSyncStatus(dataSyncService.getSyncStatus());
    
    // Set up periodic refresh every 30 seconds
    const espInterval = setInterval(refreshESPData, 30000);
    const websiteInterval = setInterval(refreshWebsiteData, 30000);
    
    return () => {
      clearInterval(espInterval);
      clearInterval(websiteInterval);
    };
  }, []);

  // Navigation
  const handleBackToGames = () => {
    navigate('/');
  };

  // Sync controls
  const handleToggleSync = () => {
    dataSyncService.toggleSync();
    setSyncStatus(dataSyncService.getSyncStatus());
  };

  // Data rendering components
  const DataTree = ({ data, level = 0 }) => {
    if (!data || typeof data !== 'object') {
      return <span style={{ color: '#666' }}>{JSON.stringify(data)}</span>;
    }
    return (
      <div style={{ marginLeft: level * 20 }}>
        {Object.entries(data).map(([key, value]) => (
          <div key={key} style={{ marginBottom: '8px' }}>
            <span style={{ fontWeight: 'bold', color: '#007bff' }}>{key}:</span>
            {typeof value === 'object' ? (
              <DataTree data={value} level={level + 1} />
            ) : (
              <span style={{ color: '#666', marginLeft: '8px' }}>{JSON.stringify(value)}</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  // ESP statistics
  const espPackets = Object.values(espData || {});
  const totalPackets = espPackets.length;
  const uniqueDevices = new Set(espPackets.map(p => p.id || p.deviceId)).size;
  const totalInteractions = espPackets.reduce((sum, p) => sum + (parseInt(p.beaconArray) || 0), 0);
  const totalButtonPresses = espPackets.reduce((sum, p) => sum + (parseInt(p.buttonA) || 0) + (parseInt(p.buttonB) || 0), 0);

  // Website data stats
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
  const recentPackets = espPackets
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

  // Real-time data (latest X packets)
  const latestPackets = espPackets
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);

  // Firebase status
  const firebaseStatus = firebaseConnected ? (
    <span style={{ color: '#28a745', fontWeight: 600 }}>Firebase Connected</span>
  ) : (
    <span style={{ color: '#dc3545', fontWeight: 600 }}>Firebase Disconnected</span>
  );

  // Test Firebase connection
  const testFirebaseConnection = async () => {
    try {
      console.log('Testing Firebase connection...');
      const testRef = ref(db, '.info/connected');
      const snapshot = await get(testRef);
      console.log('Firebase connection test successful');
      setFirebaseConnected(true);
    } catch (error) {
      console.error('Firebase connection test failed:', error);
      setFirebaseConnected(false);
    }
  };

  // Logging/streaming status
  const loggingActive = syncStatus?.isRunning;

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
      <h1 style={{ margin: 0, fontSize: 38, fontWeight: 800, letterSpacing: 1, textShadow: '0 2px 8px rgba(0,0,0,0.10)' }}>Control Panel</h1>
      <div style={{ width: 180 }} /> {/* Spacer for symmetry */}
    </div>
  );

  // Header/status card: all status/info badges and time
  const HeaderSection = () => (
    <div style={cardStyle}>
      <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
        {firebaseConnected ? badge('#43d675', 'Firebase Connected') : badge('#dc3545', 'Firebase Disconnected')}
        {badge('#e74c3c', `Logging ${loggingActive ? 'ON' : 'OFF'}`)}
        <span style={{ fontSize: 18, fontWeight: 500, color: '#222' }}>San Diego Time (PDT): <b style={{ fontWeight: 700 }}>{sanDiegoTime}</b></span>
        <span style={{ color: '#007bff', fontWeight: 600, fontSize: 17 }}>Real-Time Streaming</span>
      </div>
      <div style={{ color: '#666', fontSize: '0.95rem', marginBottom: 0 }}>
        {firebaseConnected ? (
          loggingActive ? (
            <>One-minute logging is <b>ENABLED</b>. User actions and journal entries are being sent to the server and Firebase in real time.</>
          ) : (
            <>Firebase is connected. Click <b>START</b> to enable one-minute logging to server and Firebase.</>
          )
        ) : (
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
          <button onClick={handleToggleSync} style={{ background: loggingActive ? '#e74c3c' : '#43d675', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 32px', fontWeight: 800, fontSize: 20, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>{loggingActive ? 'STOP' : 'START'}</button>
          <button onClick={handleManualSync} disabled={manualSyncLoading} style={{ background: '#7c8cf8', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontWeight: 700, fontSize: 18, cursor: manualSyncLoading ? 'not-allowed' : 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>{manualSyncLoading ? 'Syncing...' : 'Manual Sync'}</button>
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

  // ESP Device Testing Panel
  const ESPTestingPanel = () => (
    <div style={{ background: 'white', borderRadius: 8, padding: 20, marginBottom: 20, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 12 }}>
        {firebaseStatus}
        <span style={{ color: '#333', fontWeight: 600 }}>ESP Statistics</span>
        <span style={{ fontWeight: 700, color: '#1976d2' }}>{totalPackets}</span> Total Packets
        <span style={{ fontWeight: 700, color: '#2e7d32' }}>{uniqueDevices}</span> Active Devices
        <span style={{ fontWeight: 700, color: '#7b1fa2' }}>{totalInteractions}</span> Interactions
        <span style={{ fontWeight: 700, color: '#ff9800' }}>{totalButtonPresses}</span> Button Presses
      </div>
      
      {espError && (
        <div style={{ background: '#ffe6e6', color: '#d32f2f', padding: '8px 12px', borderRadius: 4, marginBottom: 12, fontSize: '0.9rem' }}>
          <strong>Error loading ESP data:</strong> {espError}
        </div>
      )}
      
      <div style={{ marginBottom: 12 }}>
        <span style={{ color: '#333', fontWeight: 600 }}>Device Activity</span>
        <div style={{ background: '#f8f9fa', padding: 12, borderRadius: 4, minHeight: 40, marginTop: 6 }}>
          {espLoading ? (
            <span style={{ color: '#888' }}>Loading ESP data...</span>
          ) : recentPackets.length === 0 ? (
            <span style={{ color: '#888' }}>No ESP data found in Firebase. ESP devices may not be connected or no data has been sent yet.</span>
          ) : (
            recentPackets.map((packet, idx) => (
              <div key={idx} style={{ marginBottom: 6, fontSize: '0.95rem' }}>
                <b>{packet.id || packet.deviceId || 'Unknown'}</b> @ {packet.timestamp ? new Date(packet.timestamp).toLocaleString() : 'N/A'} | 
                Status: {packet.status?.toFixed(2) || 'N/A'} | 
                A: {packet.buttonA || 0}, B: {packet.buttonB || 0} | 
                Beacon: {packet.beaconArray || 0}
              </div>
            ))
          )}
        </div>
      </div>
      
      <div>
        <span style={{ color: '#333', fontWeight: 600 }}>Real-Time Data</span>
        <div style={{ background: '#f8f9fa', padding: 12, borderRadius: 4, minHeight: 40, marginTop: 6 }}>
          {espLoading ? (
            <span style={{ color: '#888' }}>Loading ESP data...</span>
          ) : latestPackets.length === 0 ? (
            <span style={{ color: '#888' }}>No ESP packets found in Firebase. Check if ESP devices are connected and sending data.</span>
          ) : (
            <>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Latest {latestPackets.length} packets</div>
              {latestPackets.map((packet, idx) => (
                <div key={idx} style={{ fontSize: '0.95rem', marginBottom: 4 }}>
                  <b>{packet.id || packet.deviceId || 'Unknown'}</b> @ {packet.timestamp ? new Date(packet.timestamp).toLocaleString() : 'N/A'} | 
                  Status: {packet.status?.toFixed(2) || 'N/A'} | 
                  A: {packet.buttonA || 0}, B: {packet.buttonB || 0} | 
                  Beacon: {packet.beaconArray || 0}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );

  // ESP Device Data Section (toggle between raw and clean data)
  const ESPDataSection = () => {
    const espEntries = Object.entries(espData || {});
    return (
      <div style={{ background: 'white', borderRadius: 8, padding: 20, marginBottom: 20, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0, color: '#333' }}>ESP Device Data</h2>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={refreshESPData} disabled={espLoading} style={{ padding: '8px 16px', background: espLoading ? '#6c757d' : '#007bff', color: 'white', border: 'none', borderRadius: 4, cursor: espLoading ? 'not-allowed' : 'pointer' }}>
              {espLoading ? 'Loading...' : 'Refresh'}
            </button>
            <button onClick={() => setShowRawESP(!showRawESP)} style={{ padding: '8px 16px', background: showRawESP ? '#28a745' : '#6c757d', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>{showRawESP ? 'Clean Data' : 'Raw Data'}</button>
          </div>
        </div>
        {lastUpdatedESP && <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: 10 }}>Last updated: {lastUpdatedESP.toLocaleTimeString()}</div>}
        
        {espError && (
          <div style={{ background: '#ffe6e6', color: '#d32f2f', padding: '8px 12px', borderRadius: 4, marginBottom: 10, fontSize: '0.9rem' }}>
            <strong>Error loading ESP data:</strong> {espError}
          </div>
        )}
        
        {showRawESP ? (
          <div style={{ background: '#f8f9fa', padding: 15, borderRadius: 4, maxHeight: 400, overflow: 'auto', fontFamily: 'monospace', fontSize: 13 }}>
            <pre style={{ margin: 0 }}>{JSON.stringify(espData, null, 2)}</pre>
          </div>
        ) : (
          <div style={{ color: '#888', fontSize: '1rem', minHeight: 40 }}>
            {espLoading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>Loading ESP data from Firebase...</div>
            ) : espEntries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                <div style={{ fontSize: '1.1rem', marginBottom: '8px' }}>No ESP data found in Firebase</div>
                <div style={{ fontSize: '0.9rem' }}>ESP devices may not be connected or no data has been sent yet.</div>
              </div>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {espEntries.map(([key, value]) => (
                  <li key={key} style={{ marginBottom: 8, color: '#333', fontSize: 15, padding: '8px', background: '#f8f9fa', borderRadius: 4 }}>
                    <b>ID:</b> {value.id || value.deviceId || key} | 
                    <b>Status:</b> {value.status || 'N/A'} | 
                    <b>Time:</b> {value.timestamp ? new Date(value.timestamp).toLocaleString() : 'N/A'} | 
                    <b>Button A:</b> {value.buttonA || 0} | 
                    <b>Button B:</b> {value.buttonB || 0} | 
                    <b>Beacon:</b> {value.beaconArray || 0}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  };

  // Website Data Section (toggle between raw and clean data, show all and recent sessions)
  const WebsiteDataSection = () => {
    const websiteEntries = Object.entries(websiteData || {});
    // Get recent sessions (last 5 by timestamp)
    const recentSessions = websiteEntries
      .map(([sessionId, session]) => {
        // Find the latest timestamp in this session
        const timestamps = Object.keys(session);
        const latestTimestamp = timestamps.length > 0 ? Math.max(...timestamps.map(Number)) : null;
        return { sessionId, session, latestTimestamp };
      })
      .sort((a, b) => (b.latestTimestamp || 0) - (a.latestTimestamp || 0))
      .slice(0, 5);
    return (
      <div style={{ background: 'white', borderRadius: 8, padding: 20, marginBottom: 20, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0, color: '#333' }}>Website Data</h2>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={refreshWebsiteData} disabled={websiteLoading} style={{ padding: '8px 16px', background: websiteLoading ? '#6c757d' : '#007bff', color: 'white', border: 'none', borderRadius: 4, cursor: websiteLoading ? 'not-allowed' : 'pointer' }}>
              {websiteLoading ? 'Loading...' : 'Refresh'}
            </button>
            <button onClick={() => setShowRawWebsite(!showRawWebsite)} style={{ padding: '8px 16px', background: showRawWebsite ? '#28a745' : '#6c757d', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>{showRawWebsite ? 'Clean Data' : 'Raw Data'}</button>
          </div>
        </div>
        {lastUpdatedWebsite && <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: 10 }}>Last updated: {lastUpdatedWebsite.toLocaleTimeString()}</div>}
        
        {websiteError && (
          <div style={{ background: '#ffe6e6', color: '#d32f2f', padding: '8px 12px', borderRadius: 4, marginBottom: 10, fontSize: '0.9rem' }}>
            <strong>Error loading website data:</strong> {websiteError}
          </div>
        )}
        
        {showRawWebsite ? (
          <div style={{ background: '#f8f9fa', padding: 15, borderRadius: 4, maxHeight: 400, overflow: 'auto', fontFamily: 'monospace', fontSize: 13 }}>
            <pre style={{ margin: 0 }}>{JSON.stringify(websiteData, null, 2)}</pre>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 32, marginBottom: 12 }}>
              <div style={{ fontWeight: 700, color: '#1976d2' }}>{sessionCount}</div>
              <div>Sync Sessions</div>
              <div style={{ fontWeight: 700, color: '#ff9800' }}>{userActionsCount}</div>
              <div>User Actions</div>
              <div style={{ fontWeight: 700, color: '#2e7d32' }}>{journalEntriesCount}</div>
              <div>Journal Entries</div>
            </div>
            <div style={{ marginTop: 16 }}>
              <h3 style={{ margin: 0, color: '#333', fontSize: 18 }}>All Website Sessions</h3>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {websiteLoading ? (
                  <li style={{ color: '#888' }}>Loading website data from Firebase...</li>
                ) : websiteEntries.length === 0 ? (
                  <li style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                    <div style={{ fontSize: '1.1rem', marginBottom: '8px' }}>No website data found in Firebase</div>
                    <div style={{ fontSize: '0.9rem' }}>No users have interacted with the website yet or data hasn't been synced.</div>
                  </li>
                ) : (
                  websiteEntries.map(([sessionId, session]) => (
                    <li key={sessionId} style={{ marginBottom: 10, color: '#333', fontSize: 15, padding: '8px', background: '#f8f9fa', borderRadius: 4 }}>
                      <b>Session:</b> {sessionId} | <b>Entries:</b> {Object.keys(session).length}
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div style={{ marginTop: 16 }}>
              <h3 style={{ margin: 0, color: '#333', fontSize: 18 }}>Recent Website Sessions</h3>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {websiteLoading ? (
                  <li style={{ color: '#888' }}>Loading recent sessions...</li>
                ) : recentSessions.length === 0 ? (
                  <li style={{ color: '#666', textAlign: 'center', padding: '10px' }}>No recent website sessions found.</li>
                ) : (
                  recentSessions.map(({ sessionId, session, latestTimestamp }) => (
                    <li key={sessionId} style={{ marginBottom: 10, color: '#333', fontSize: 15, padding: '8px', background: '#f8f9fa', borderRadius: 4 }}>
                      <b>Session:</b> {sessionId} | <b>Latest:</b> {latestTimestamp ? new Date(latestTimestamp).toLocaleString() : 'N/A'}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </>
        )}
      </div>
    );
  };

  // Recent Journal Entries Section (from websiteData only)
  const JournalEntriesSection = () => {
    // Find the most recent session with journal entries from websiteData
    let latestSession = null;
    let latestSessionId = null;
    let latestSessionTime = null;
    let latestUser = null;
    let latestGame = null;
    let latestActions = 0;
    let latestJournal = 0;
    let latestJournalAnswers = [];
    
    if (websiteData && Object.keys(websiteData).length > 0) {
      Object.entries(websiteData).forEach(([sessionId, session]) => {
        Object.entries(session).forEach(([timestamp, entry]) => {
          if (entry.journal && entry.journal.answers && Object.keys(entry.journal.answers).length > 0) {
            if (!latestSessionTime || new Date(timestamp) > new Date(latestSessionTime)) {
              latestSession = entry;
              latestSessionId = sessionId;
              latestSessionTime = timestamp;
              latestUser = entry.user || 'Unknown';
              latestGame = entry.game || 'Unknown';
              latestActions = entry.userActions ? entry.userActions.length : 0;
              latestJournal = Object.keys(entry.journal.answers).length;
              latestJournalAnswers = Object.entries(entry.journal.answers);
            }
          }
        });
      });
    }
    
    return (
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: '28px 32px', marginBottom: '28px', maxWidth: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0, color: '#333' }}>Recent Journal Entries</h2>
          <button onClick={refreshJournalEntries} disabled={journalLoading} style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: 4, cursor: journalLoading ? 'not-allowed' : 'pointer' }}>{journalLoading ? 'Loading...' : 'Refresh'}</button>
        </div>
        
        {websiteLoading ? (
          <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>Loading journal entries from Firebase...</div>
        ) : latestSession ? (
          <div style={{ marginBottom: 12 }}>
            <div style={{ padding: '8px', background: '#f8f9fa', borderRadius: 4, marginBottom: '8px' }}>
              <div><b>Session:</b> {latestSessionId}</div>
              <div><b>Time:</b> {new Date(latestSessionTime).toLocaleString()}</div>
              <div><b>User:</b> {latestUser}</div>
              <div><b>Game:</b> {latestGame}</div>
              <div><b>Actions:</b> {latestActions}</div>
              <div><b>Journal Entries:</b> {latestJournal}</div>
            </div>
            <div style={{ marginTop: 8, fontWeight: 600 }}>Journal Questions & Answers:</div>
            {latestJournalAnswers.map(([qIndex, a]) => {
              const questionText = JOURNAL_QUESTIONS[parseInt(qIndex)] || `Question ${parseInt(qIndex) + 1}`;
              return (
                <div key={qIndex} style={{ marginLeft: 12, marginBottom: 8, padding: '8px', background: '#f8f9fa', borderRadius: 4 }}>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>Q: {questionText}</div>
                  <div style={{ color: '#333' }}>A: {a || 'No answer provided'}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '1.1rem', marginBottom: '8px' }}>No journal entries found in Firebase</div>
            <div style={{ fontSize: '0.9rem' }}>No users have completed journal entries yet or data hasn't been synced.</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: 20 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <TopBar />
        <HeaderSection />
        <StreamingControls />
        <ESPTestingPanel />
        <ESPDataSection />
        <WebsiteDataSection />
        <JournalEntriesSection />
      </div>
    </div>
  );
};

export default ControlPanel; 