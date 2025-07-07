// ControlPanel.js - Comprehensive server data control panel
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ESPDataPlot from './plots/ESPDataPlot';
import { useESPData } from './hooks/useESPData';
// Removed useUserLog import - Control Panel actions should not be logged
import { db, ref, get, set, remove } from './firebase';
import { formatSanDiegoTime, formatSanDiegoTimeOnly, getSanDiegoTimezoneInfo } from './utils/timeUtils';
import dataSyncService from './services/dataSyncService';

const ControlPanel = () => {
  const navigate = useNavigate();
  
  const { 
    espData, 
    loading: espLoading, 
    error: espError, 
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
  const [syncStatus, setSyncStatus] = useState(null);
  const [serverStatus, setServerStatus] = useState('connected');
  const [latestPackets, setLatestPackets] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [lastUpdatedESP, setLastUpdatedESP] = useState(null);
  const [lastUpdatedWebsite, setLastUpdatedWebsite] = useState(null);
  const [espDataState, setESPDataState] = useState({});
  const [websiteDataState, setWebsiteDataState] = useState({});
  const [websiteLoading, setWebsiteLoading] = useState(false);
  const [websiteError, setWebsiteError] = useState(null);
  const [showRawWebsiteData, setShowRawWebsiteData] = useState(false);
  const [showRawESPData, setShowRawESPData] = useState(false);

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
        setLatestPackets(packets);
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

  const refreshESPData = async () => {
    try {
      const devicePacketsRef = ref(db, 'devicePackets');
      const snapshot = await get(devicePacketsRef);
      setESPDataState({ devicePackets: snapshot.val() || {} });
      // Fetch NIST time
      try {
        const resp = await fetch('http://worldtimeapi.org/api/timezone/America/Los_Angeles');
        const nistData = await resp.json();
        if (nistData && nistData.datetime) {
          setLastUpdatedESP(new Date(nistData.datetime));
        } else {
          setLastUpdatedESP(new Date());
        }
      } catch {
        setLastUpdatedESP(new Date());
      }
    } catch (err) {
      console.error("Error fetching ESP data:", err);
    }
  };

  const refreshWebsiteData = async () => {
    setWebsiteLoading(true);
    setWebsiteError(null);
    try {
      const syncDataRef = ref(db, 'syncData');
      const snapshot = await get(syncDataRef);
      setWebsiteDataState({ sessions: snapshot.val() || {} });
      // Fetch NIST time
      try {
        const resp = await fetch('http://worldtimeapi.org/api/timezone/America/Los_Angeles');
        const nistData = await resp.json();
        if (nistData && nistData.datetime) {
          setLastUpdatedWebsite(new Date(nistData.datetime));
        } else {
          setLastUpdatedWebsite(new Date());
        }
      } catch {
        setLastUpdatedWebsite(new Date());
      }
    } catch (err) {
      setWebsiteError(err.message);
    } finally {
      setWebsiteLoading(false);
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

  // Get sync status
  useEffect(() => {
    const updateSyncStatus = () => {
      setSyncStatus(dataSyncService.getSyncStatus());
    };
    
    updateSyncStatus();
    
    // Update sync status every 2 seconds for real-time countdown
    const interval = setInterval(updateSyncStatus, 2000);
    
    return () => clearInterval(interval);
  }, []);

  // On initial load, fetch both
  useEffect(() => {
    refreshESPData();
    refreshWebsiteData();
  }, []);

  const handleBackToGames = () => {
    navigate('/');
  };

  const handleManualSync = async () => {
    try {
      const result = await dataSyncService.performManualSync();
      if (result.success) {
        console.log('Manual sync completed successfully');
      } else {
        console.error('Manual sync failed:', result.error);
      }
    } catch (error) {
      console.error('Manual sync error:', error);
    }
  };

  const handleToggleSync = () => {
    const isNowOn = dataSyncService.toggleSync();
    setSyncStatus(dataSyncService.getSyncStatus());
  };

  const renderESPDataTree = (data, level = 0) => {
    if (!data || typeof data !== 'object') {
      return <span style={{ color: '#666' }}>{JSON.stringify(data)}</span>;
    }

    const getColorForKey = (key) => {
      if (key.includes('ESP_')) return '#dc3545';
      if (key.includes('TEST_')) return '#fd7e14';
      return '#007bff';
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
            {typeof value === 'object' && value !== null ? (
              <div style={{ marginTop: '5px' }}>
                {renderESPDataTree(value, level + 1)}
              </div>
            ) : (
              <span style={{ 
                color: '#333', 
                marginLeft: '10px',
                background: '#f0f0f0',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '12px'
              }}>
                {typeof value === 'string' ? `"${value}"` : JSON.stringify(value)}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderWebsiteDataTree = (data, level = 0) => {
    if (!data || typeof data !== 'object') {
      return <span style={{ color: '#666' }}>{JSON.stringify(data)}</span>;
    }

    const getColorForKey = (key) => {
      if (key === 'test-session') return '#ffc107';
      if (key === 'userActivity') return '#28a745';
      if (key === 'devicePackets') return '#6c757d';
      return '#333';
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
            {typeof value === 'object' && value !== null ? (
              <div style={{ marginTop: '5px' }}>
                {renderWebsiteDataTree(value, level + 1)}
              </div>
            ) : (
              <span style={{ 
                color: '#333', 
                marginLeft: '10px',
                background: '#f0f0f0',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '12px'
              }}>
                {typeof value === 'string' ? `"${value}"` : JSON.stringify(value)}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#f5f5f5",
      color: "#000000",
      padding: "20px"
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
        borderRadius: "10px",
        marginBottom: "20px",
        color: "white",
        position: "relative"
      }}>
        <button
          onClick={handleBackToGames}
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            background: "rgba(255,255,255,0.2)",
            border: "none",
            color: "white",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: "bold",
            backdropFilter: "blur(10px)"
          }}
        >
          ← Back to Games
        </button>
        <h1 style={{ margin: "0", textShadow: "2px 2px 4px rgba(0,0,0,0.3)" }}>Control Panel</h1>
        <div style={{ 
          marginTop: "10px", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          fontSize: "0.9rem", 
          opacity: 0.9,
          fontWeight: "500"
        }}>
          {timezoneInfo && (
            <span>San Diego Time ({timezoneInfo.abbreviation})</span>
          )}
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {/* Firebase Status */}
            <span style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "8px",
              background: "rgba(255,255,255,0.1)",
              padding: "4px 8px",
              borderRadius: "4px"
            }}>
              <span style={{ 
                width: "8px", 
                height: "8px", 
                borderRadius: "50%", 
                background: "#4CAF50"
              }}></span>
              Firebase Connected
            </span>
            
            {/* Sync Status */}
            {syncStatus && (
                          <span style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "8px",
              background: "rgba(255,255,255,0.1)",
              padding: "4px 8px",
              borderRadius: "4px"
            }}>
              <span style={{ 
                width: "8px", 
                height: "8px", 
                borderRadius: "50%", 
                background: syncStatus.isRunning ? "#4CAF50" : "#f44336" 
              }}></span>
              {syncStatus.isRunning ? "Logging ON" : "Logging OFF"}
              {syncStatus.isRunning && syncStatus.nextSyncIn && (
                <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                  Next: {syncStatus.nextSyncIn}
                </span>
              )}
              {!syncStatus.isRunning && (
                <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                  Click START for one-minute logging
                </span>
              )}
            </span>
            )}
          </div>
        </div>
      </div>

      {/* Data Sync Controls */}
      <div style={{
        background: "#ffffff",
        padding: "20px",
        borderRadius: "10px",
        marginBottom: "20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
      }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "15px" 
        }}>
          <div>
            <h3 style={{ margin: "0", color: "#333333", fontWeight: "600" }}>Real-Time Streaming</h3>
            <p style={{ margin: "5px 0 0 0", fontSize: "0.8rem", color: "#666", fontStyle: "italic" }}>
              {syncStatus?.isRunning ? "Sending data to server every minute + Firebase immediately" : "No data being sent to server or Firebase"}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleToggleSync}
              style={{
                background: syncStatus?.isRunning ? "#dc3545" : "#28a745",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: "bold",
                minWidth: "120px"
              }}
            >
              {syncStatus?.isRunning ? "STOP" : "START"}
            </button>
            <button
              onClick={handleManualSync}
              style={{
                background: "#667eea",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: "bold"
              }}
            >
              Manual Sync
            </button>
          </div>
        </div>
        
        {syncStatus && (
          <div>
            {!syncStatus.isRunning && (
              <div style={{
                background: "#fff3cd",
                border: "1px solid #ffeaa7",
                borderRadius: "6px",
                padding: "12px",
                marginBottom: "15px",
                color: "#856404"
              }}>
                <strong>Streaming Disabled:</strong> No data is being sent to the server or Firebase. 
                User actions and journal entries are only stored locally in your browser. 
                Click the <strong>START</strong> button to enable one-minute logging to server and immediate Firebase logging.
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
                          <div style={{ color: "#333333", fontWeight: "500" }}>
              <strong style={{ color: "#667eea" }}>Status:</strong> {syncStatus.isRunning ? "One-Minute Logging Active" : "All Logging Disabled"}
            </div>
              <div style={{ color: "#333333", fontWeight: "500" }}>
                <strong style={{ color: "#667eea" }}>Server:</strong> {syncStatus.syncEndpoint}
              </div>
              {syncStatus.lastSyncTime && (
                <div style={{ color: "#333333", fontWeight: "500" }}>
                  <strong style={{ color: "#667eea" }}>Last Sync:</strong><br />
                  {formatSanDiegoTime(syncStatus.lastSyncTime)}
                </div>
              )}
              {syncStatus.isRunning && syncStatus.nextSyncIn && (
                <div style={{ color: "#333333", fontWeight: "500" }}>
                  <strong style={{ color: "#667eea" }}>Next Sync:</strong><br />
                  {syncStatus.nextSyncIn}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ESP Device Testing Panel */}
      <div style={{
        background: "#ffffff",
        padding: "20px",
        borderRadius: "10px",
        marginBottom: "20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3 style={{ margin: "0", color: "#333333", fontWeight: "600" }}>ESP Device Testing Panel</h3>
                                            <div style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "8px",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        background: "#d4edda",
                        color: "#155724",
                        fontSize: "0.8rem"
                      }}>
                        <span style={{ 
                          width: "6px", 
                          height: "6px", 
                          borderRadius: "50%", 
                          background: "#28a745" 
                        }}></span>
                        Firebase Connected
                      </div>
        </div>
        
        {/* Real-time ESP Stats */}
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>ESP Statistics</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px" }}>
            <div style={{ 
              background: "#f8f9fa", 
              padding: "10px", 
              borderRadius: "4px", 
              textAlign: "center",
              border: "1px solid #e9ecef"
            }}>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#007bff" }}>
                {espData.length}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#666" }}>Total Packets</div>
            </div>
            <div style={{ 
              background: "#f8f9fa", 
              padding: "10px", 
              borderRadius: "4px", 
              textAlign: "center",
              border: "1px solid #e9ecef"
            }}>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#28a745" }}>
                {uniqueStudents}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#666" }}>Active Devices</div>
            </div>
            <div style={{ 
              background: "#f8f9fa", 
              padding: "10px", 
              borderRadius: "4px", 
              textAlign: "center",
              border: "1px solid #e9ecef"
            }}>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#ffc107" }}>
                {espData.filter(d => d.beaconArray === 1).length}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#666" }}>Interactions</div>
            </div>
            <div style={{ 
              background: "#f8f9fa", 
              padding: "10px", 
              borderRadius: "4px", 
              textAlign: "center",
              border: "1px solid #e9ecef"
            }}>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#dc3545" }}>
                {espData.filter(d => d.buttonA === 1 || d.buttonB === 1).length}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#666" }}>Button Presses</div>
            </div>
          </div>
        </div>

        {/* Device Activity Monitor */}
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>Device Activity</h4>
          <div style={{ 
            maxHeight: "200px", 
            overflow: "auto",
            background: "#f9f9f9",
            padding: "10px",
            borderRadius: "4px",
            border: "1px solid #e0e0e0"
          }}>
            {espData.length > 0 ? (
              <div style={{ fontSize: "12px" }}>
                {espData.slice(-10).map((packet, index) => (
                  <div key={index} style={{ 
                    padding: "5px", 
                    margin: "2px 0", 
                    background: "white", 
                    borderRadius: "3px",
                    border: "1px solid #eee"
                  }}>
                    <strong>Device {packet.id}</strong> - {formatSanDiegoTimeOnly(packet.timestamp)}
                    <br />
                    <span style={{ color: packet.buttonA === 1 ? "#dc3545" : "#666" }}>
                      Button A: {packet.buttonA}
                    </span> | 
                    <span style={{ color: packet.buttonB === 1 ? "#dc3545" : "#666" }}>
                      Button B: {packet.buttonB}
                    </span> | 
                    <span style={{ color: "#007bff" }}>
                      Status: {packet.status?.toFixed(2) || "0.00"}
                    </span> | 
                    <span style={{ color: packet.beaconArray === 1 ? "#28a745" : "#666" }}>
                      Interaction: {packet.beaconArray ? "YES" : "NO"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "#666", textAlign: "center", padding: "20px" }}>
                No ESP data received yet. Waiting for devices...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real-Time Data Monitoring */}
      <div style={{
        background: "#ffffff",
        padding: "20px",
        borderRadius: "8px",
        marginBottom: "20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3 style={{ margin: "0", color: "#333333", fontWeight: "600" }}>Real-Time Data</h3>
          <span style={{ fontSize: "0.8rem", color: "#666" }}>
            Latest {latestPackets.length} packets
          </span>
        </div>
        
        <div style={{ 
          maxHeight: "300px", 
          overflow: "auto",
          background: "#f9f9f9",
          padding: "15px",
          borderRadius: "4px",
          border: "1px solid #e0e0e0"
        }}>
          {latestPackets.length > 0 ? (
            <div style={{ fontSize: "12px" }}>
              {latestPackets.reverse().map((packet, index) => (
                <div key={index} style={{ 
                  padding: "8px", 
                  margin: "4px 0", 
                  background: "white", 
                  borderRadius: "4px",
                  border: "1px solid #eee",
                  borderLeft: "4px solid #007bff"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <strong style={{ color: "#007bff" }}>{packet.id}</strong>
                    <span style={{ color: "#666", fontSize: "11px" }}>
                      {formatSanDiegoTimeOnly(packet.timestamp)}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
                    <span style={{ color: packet.buttonA === 1 ? "#dc3545" : "#666" }}>
                      A: {packet.buttonA}
                    </span>
                    <span style={{ color: packet.buttonB === 1 ? "#dc3545" : "#666" }}>
                      B: {packet.buttonB}
                    </span>
                    <span style={{ color: "#007bff" }}>
                      Status: {packet.status?.toFixed(2) || "0.00"}
                    </span>
                    <span style={{ color: packet.beaconArray === 1 ? "#28a745" : "#666" }}>
                      Interaction: {packet.beaconArray ? "YES" : "NO"}
                    </span>
                    <span style={{ color: "#ff9800" }}>
                      Total: {packet.totalButtons || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "#666", textAlign: "center", padding: "20px" }}>
              No packets received yet. Send a test packet to see data here!
            </div>
          )}
        </div>
      </div>

      {/* ESP Device Data */}
      <div style={{
        background: "#ffffff",
        padding: "20px",
        borderRadius: "8px",
        marginBottom: "20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3 style={{ margin: "0", color: "#333333", fontWeight: "600" }}>ESP Device Data</h3>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "#666" }}>
              Last updated: {lastUpdatedESP ? lastUpdatedESP.toLocaleTimeString() : 'Never'}
            </span>
            <button
              onClick={() => setShowRawESPData(!showRawESPData)}
              style={{
                background: showRawESPData ? "#6c757d" : "#28a745",
                color: "white",
                border: "none",
                padding: "4px 8px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.8rem"
              }}
            >
              {showRawESPData ? "Simple View" : "Raw Data"}
            </button>
            <button
              onClick={refreshESPData}
              style={{
                background: "#007bff",
                color: "white",
                border: "none",
                padding: "4px 8px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.8rem"
              }}
            >
              Refresh
            </button>
          </div>
        </div>
        
        {espError && (
          <div style={{ color: "#ff4444" }}>Error: {espError}</div>
        )}
        
        {!espError && Object.keys(espDataState.devicePackets || {}).length > 0 && (
          <div>
            {!showRawESPData ? (
              // Simple View - Clean ESP Data Display
              <div>
                {/* ESP Data Summary */}
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
                  gap: "10px", 
                  marginBottom: "15px" 
                }}>
                  <div style={{ 
                    background: "#e3f2fd", 
                    padding: "12px", 
                    borderRadius: "6px", 
                    border: "1px solid #2196f3",
                    textAlign: "center"
                  }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1976d2" }}>
                      {espDataState.devicePackets ? Object.keys(espDataState.devicePackets).length : 0}
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#333" }}>Device Packets</div>
                  </div>
                  <div style={{ 
                    background: "#e8f5e8", 
                    padding: "12px", 
                    borderRadius: "6px", 
                    border: "1px solid #4caf50",
                    textAlign: "center"
                  }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#2e7d32" }}>
                      {espDataState.devicePackets ? new Set(Object.values(espDataState.devicePackets).map(p => p.id)).size : 0}
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#333" }}>Unique Devices</div>
                  </div>
                  <div style={{ 
                    background: "#fff3e0", 
                    padding: "12px", 
                    borderRadius: "6px", 
                    border: "1px solid #ff9800",
                    textAlign: "center"
                  }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#f57c00" }}>
                      {espDataState.devicePackets ? Object.values(espDataState.devicePackets).filter(p => p.beaconArray === 1).length : 0}
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#333" }}>Proximity Events</div>
                  </div>
                  <div style={{ 
                    background: "#fce4ec", 
                    padding: "12px", 
                    borderRadius: "6px", 
                    border: "1px solid #e91e63",
                    textAlign: "center"
                  }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#c2185b" }}>
                      {espDataState.devicePackets ? Object.values(espDataState.devicePackets).filter(p => p.buttonA === 1 || p.buttonB === 1).length : 0}
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#333" }}>Button Events</div>
                  </div>
                </div>

                {/* Recent ESP Packets */}
                <div style={{ marginBottom: "15px" }}>
                  <h4 style={{ margin: "0 0 10px 0", color: "#333", fontSize: "1rem" }}>Recent Device Packets</h4>
                  <div style={{ 
                    maxHeight: "300px", 
                    overflow: "auto",
                    background: "#ffffff",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #e0e0e0"
                  }}>
                    {Object.entries(espDataState.devicePackets || {})
                      .sort(([,a], [,b]) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
                      .slice(0, 10)
                      .map(([key, packet]) => (
                        <div key={key} style={{ 
                          padding: "12px", 
                          margin: "6px 0", 
                          background: "#f8f9fa", 
                          borderRadius: "6px",
                          border: "1px solid #dee2e6",
                          fontSize: "12px"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <strong style={{ color: "#007bff" }}>Device {packet.id || 'Unknown'}</strong>
                            <span style={{ color: "#666", fontSize: "11px" }}>
                              {packet.timestamp ? new Date(packet.timestamp).toLocaleString() : 'No timestamp'}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", marginBottom: "8px" }}>
                            <span style={{ color: packet.buttonA === 1 ? "#dc3545" : "#666" }}>
                              A: {packet.buttonA || 0}
                            </span>
                            <span style={{ color: packet.buttonB === 1 ? "#dc3545" : "#666" }}>
                              B: {packet.buttonB || 0}
                            </span>
                            <span style={{ color: "#007bff" }}>
                              Status: {packet.status?.toFixed(2) || "0.00"}
                            </span>
                            <span style={{ color: packet.beaconArray === 1 ? "#28a745" : "#666" }}>
                              Proximity: {packet.beaconArray ? "DETECTED" : "NONE"}
                            </span>
                            <span style={{ color: "#ff9800" }}>
                              Total: {packet.totalButtons || 0}
                            </span>
                          </div>
                          {packet.sessionId && (
                            <div style={{ 
                              background: "#e9ecef", 
                              padding: "6px", 
                              borderRadius: "4px", 
                              fontSize: "11px",
                              color: "#495057"
                            }}>
                              <strong>Session:</strong> {packet.sessionId}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              // Raw Data View - Complete Firebase Structure
              <div>
                <h4 style={{ margin: "0 0 10px 0", color: "#333", fontSize: "1rem" }}>Raw Firebase Data Structure</h4>
                <div style={{ 
                  maxHeight: "400px", 
                  overflow: "auto",
                  background: "#f8f9fa",
                  padding: "15px",
                  borderRadius: "6px",
                  border: "1px solid #e0e0e0"
                }}>
                  <div style={{ 
                    fontSize: "12px",
                    color: "#333333",
                    fontWeight: "500",
                    lineHeight: "1.6",
                    fontFamily: "monospace"
                  }}>
                    {renderESPDataTree(espDataState.devicePackets || {})}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!espError && Object.keys(espDataState.devicePackets || {}).length === 0 && (
          <div style={{ color: "#666", textAlign: "center", padding: "20px" }}>
            No ESP data loaded. Click "Refresh" to load data from Firebase.
          </div>
        )}
      </div>

      {/* Website Data */}
      <div style={{
        background: "#ffffff",
        padding: "20px",
        borderRadius: "8px",
        marginBottom: "20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3 style={{ margin: "0", color: "#333333", fontWeight: "600" }}>Website Data</h3>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "#666" }}>
              Last updated: {lastUpdatedWebsite ? lastUpdatedWebsite.toLocaleTimeString() : 'Never'}
            </span>
            <button
              onClick={() => setShowRawWebsiteData(!showRawWebsiteData)}
              style={{
                background: showRawWebsiteData ? "#6c757d" : "#28a745",
                color: "white",
                border: "none",
                padding: "4px 8px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.8rem"
              }}
            >
              {showRawWebsiteData ? "Simple View" : "Raw Data"}
            </button>
            <button
              onClick={refreshWebsiteData}
              style={{
                background: "#007bff",
                color: "white",
                border: "none",
                padding: "4px 8px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.8rem"
              }}
            >
              Refresh
            </button>
          </div>
        </div>
        
        {websiteLoading && (
          <div style={{ color: "#667eea" }}>Loading website data...</div>
        )}
        {websiteError && (
          <div style={{ color: "#ff4444" }}>Error: {websiteError}</div>
        )}
        
        {!websiteError && Object.keys(websiteDataState.sessions || {}).length > 0 && (
          <div>
            {!showRawWebsiteData ? (
              // Simple View - Only Journal Data
              <div>
                {/* Website Data Summary */}
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
                  gap: "10px", 
                  marginBottom: "15px" 
                }}>
                  <div style={{ 
                    background: "#e8f5e8", 
                    padding: "12px", 
                    borderRadius: "6px", 
                    border: "1px solid #4caf50",
                    textAlign: "center"
                  }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#2e7d32" }}>
                      {websiteDataState.sessions ? Object.keys(websiteDataState.sessions).length : 0}
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#333" }}>Sync Sessions</div>
                  </div>
                  <div style={{ 
                    background: "#e3f2fd", 
                    padding: "12px", 
                    borderRadius: "6px", 
                    border: "1px solid #2196f3",
                    textAlign: "center"
                  }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1976d2" }}>
                      {websiteDataState.sessions ? Object.values(websiteDataState.sessions).reduce((total, session) => {
                        return total + (session.userActions ? session.userActions.length : 0);
                      }, 0) : 0}
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#333" }}>User Actions</div>
                  </div>
                  <div style={{ 
                    background: "#fff3e0", 
                    padding: "12px", 
                    borderRadius: "6px", 
                    border: "1px solid #ff9800",
                    textAlign: "center"
                  }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#f57c00" }}>
                      {websiteDataState.sessions ? Object.values(websiteDataState.sessions).reduce((total, session) => {
                        return total + (session.journalData ? Object.keys(session.journalData.answers || {}).length : 0);
                      }, 0) : 0}
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#333" }}>Journal Entries</div>
                  </div>
                </div>

                {/* Recent Journal Entries */}
                <div style={{ marginBottom: "15px" }}>
                  <h4 style={{ margin: "0 0 10px 0", color: "#333", fontSize: "1rem" }}>Recent Journal Entries</h4>
                  <div style={{ 
                    maxHeight: "300px", 
                    overflow: "auto",
                    background: "#ffffff",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #e0e0e0"
                  }}>
                    {Object.entries(websiteDataState.sessions || {})
                      .sort(([,a], [,b]) => new Date(b.syncTimestamp || b.uploadedAt || 0) - new Date(a.syncTimestamp || a.uploadedAt || 0))
                      .slice(0, 5)
                      .map(([key, session]) => (
                        <div key={key} style={{ 
                          padding: "12px", 
                          margin: "6px 0", 
                          background: "#f8f9fa", 
                          borderRadius: "6px",
                          border: "1px solid #dee2e6",
                          fontSize: "12px"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <strong style={{ color: "#007bff" }}>Session {key.slice(-8)}</strong>
                            <span style={{ color: "#666", fontSize: "11px" }}>
                              {session.syncTimestamp ? new Date(session.syncTimestamp).toLocaleString() : 
                               session.uploadedAt ? new Date(session.uploadedAt).toLocaleString() : 'No timestamp'}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", marginBottom: "8px" }}>
                                                    <span style={{ color: "#28a745" }}>
                          User: {session.sessionInfo?.userId || 'Unknown'}
                        </span>
                        <span style={{ color: "#007bff" }}>
                          Game: {session.sessionInfo?.currentGame || 'Unknown'}
                        </span>
                        <span style={{ color: "#ff9800" }}>
                          Actions: {session.userActions ? session.userActions.length : 0}
                        </span>
                        <span style={{ color: "#e91e63" }}>
                          Journal: {session.journalData ? Object.keys(session.journalData.answers || {}).length : 0} entries
                        </span>
                          </div>
                          {session.journalData && session.journalData.answers && Object.keys(session.journalData.answers).length > 0 && (
                            <div style={{ 
                              background: "#fff3cd", 
                              padding: "8px", 
                              borderRadius: "4px", 
                              fontSize: "11px",
                              color: "#856404"
                            }}>
                              <strong>Journal Questions:</strong>
                              {Object.entries(session.journalData.answers).map(([question, answer]) => (
                                <div key={question} style={{ marginTop: "4px" }}>
                                  <strong>Q:</strong> {question}<br />
                                  <strong>A:</strong> {answer}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              // Raw Data View - Complete Firebase Structure
              <div>
                <h4 style={{ margin: "0 0 10px 0", color: "#333", fontSize: "1rem" }}>Raw Firebase Data Structure</h4>
                <div style={{ 
                  maxHeight: "400px", 
                  overflow: "auto",
                  background: "#f8f9fa",
                  padding: "15px",
                  borderRadius: "6px",
                  border: "1px solid #e0e0e0"
                }}>
                  <div style={{ 
                    fontSize: "12px",
                    color: "#333333",
                    fontWeight: "500",
                    lineHeight: "1.6",
                    fontFamily: "monospace"
                  }}>
                    {renderWebsiteDataTree(websiteDataState.sessions || {})}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!websiteError && Object.keys(websiteDataState.sessions || {}).length === 0 && (
          <div style={{ color: "#666", textAlign: "center", padding: "20px" }}>
            No website data loaded. Click "Refresh" to load data from Firebase.
          </div>
        )}
      </div>

      {/* ESP Data Visualization */}
      <div style={{
        background: "#ffffff",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
      }}>
        <h3 style={{ margin: "0 0 15px 0", color: "#333333", fontWeight: "600" }}>ESP Data Visualization</h3>
        <div style={{ height: "500px" }}>
          <ESPDataPlot 
            plotLabel="ESP Data" 
          />
        </div>
      </div>
    </div>
  );
};

export default ControlPanel; 