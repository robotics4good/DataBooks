import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, ref, get } from './firebase';
import dataSyncService from './services/dataSyncService';

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

  // Fetch ESP data
  const refreshESPData = async () => {
    setEspLoading(true);
    try {
      const devicePacketsRef = ref(db, 'devicePackets');
      const snapshot = await get(devicePacketsRef);
      setEspData(snapshot.val() || {});
      setLastUpdatedESP(new Date());
    } catch (err) {
      console.error("Error fetching ESP data:", err);
    } finally {
      setEspLoading(false);
    }
  };

  // Fetch website data
  const refreshWebsiteData = async () => {
    setWebsiteLoading(true);
    try {
      const syncDataRef = ref(db, 'syncData');
      const snapshot = await get(syncDataRef);
      setWebsiteData(snapshot.val() || {});
      setLastUpdatedWebsite(new Date());
    } catch (err) {
      console.error("Error fetching website data:", err);
    } finally {
      setWebsiteLoading(false);
    }
  };

  // Initialize
  useEffect(() => {
    refreshESPData();
    refreshWebsiteData();
    setSyncStatus(dataSyncService.getSyncStatus());
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
            <span style={{ fontWeight: 'bold', color: '#007bff' }}>
              {key}:
            </span>
            {typeof value === 'object' ? (
              <DataTree data={value} level={level + 1} />
            ) : (
              <span style={{ color: '#666', marginLeft: '8px' }}>
                {JSON.stringify(value)}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  const ESPDataSection = () => {
    const packetCount = Object.keys(espData).length;
    const recentPackets = Object.values(espData)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);

    return (
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0, color: '#333' }}>ESP Device Data</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={refreshESPData}
              disabled={espLoading}
              style={{
                padding: '8px 16px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: espLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {espLoading ? 'Loading...' : 'Refresh'}
            </button>
            <button
              onClick={() => setShowRawESP(!showRawESP)}
              style={{
                padding: '8px 16px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {showRawESP ? 'Simple View' : 'Raw Data'}
            </button>
          </div>
        </div>

        {lastUpdatedESP && (
          <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '15px' }}>
            Last updated: {lastUpdatedESP.toLocaleString()}
          </div>
        )}

        {showRawESP ? (
          <div style={{
            background: '#f8f9fa',
            padding: '15px',
            borderRadius: '4px',
            maxHeight: '400px',
            overflow: 'auto'
          }}>
            <DataTree data={espData} />
          </div>
        ) : (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px',
              marginBottom: '20px'
            }}>
              <div style={{
                background: '#e3f2fd',
                padding: '15px',
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1976d2' }}>
                  {packetCount}
                </div>
                <div style={{ color: '#666' }}>Total Packets</div>
              </div>
              
              <div style={{
                background: '#f3e5f5',
                padding: '15px',
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#7b1fa2' }}>
                  {new Set(Object.values(espData).map(p => p.id)).size}
                </div>
                <div style={{ color: '#666' }}>Unique Devices</div>
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '10px', color: '#333' }}>Recent Activity</h3>
              <div style={{
                background: '#f8f9fa',
                padding: '15px',
                borderRadius: '4px',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                {recentPackets.length > 0 ? (
                  recentPackets.map((packet, index) => (
                    <div key={index} style={{
                      padding: '8px',
                      borderBottom: index < recentPackets.length - 1 ? '1px solid #dee2e6' : 'none',
                      fontSize: '0.9rem'
                    }}>
                      <div style={{ fontWeight: 'bold', color: '#333' }}>
                        {packet.id}
                      </div>
                      <div style={{ color: '#666' }}>
                        Time: {new Date(packet.timestamp).toLocaleString()}
                      </div>
                      <div style={{ color: '#666' }}>
                        Status: {packet.status?.toFixed(2) || 'N/A'} | 
                        Buttons: A={packet.buttonA || 0}, B={packet.buttonB || 0}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#666', textAlign: 'center' }}>
                    No recent packets
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const WebsiteDataSection = () => {
    const sessionCount = Object.keys(websiteData).length;
    const recentSessions = Object.entries(websiteData)
      .sort(([,a], [,b]) => {
        const aTime = Object.keys(a)[Object.keys(a).length - 1];
        const bTime = Object.keys(b)[Object.keys(b).length - 1];
        return new Date(bTime) - new Date(aTime);
      })
      .slice(0, 3);

    return (
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0, color: '#333' }}>Website Data</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={refreshWebsiteData}
              disabled={websiteLoading}
              style={{
                padding: '8px 16px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: websiteLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {websiteLoading ? 'Loading...' : 'Refresh'}
            </button>
            <button
              onClick={() => setShowRawWebsite(!showRawWebsite)}
              style={{
                padding: '8px 16px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {showRawWebsite ? 'Simple View' : 'Raw Data'}
            </button>
          </div>
        </div>

        {lastUpdatedWebsite && (
          <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '15px' }}>
            Last updated: {lastUpdatedWebsite.toLocaleString()}
          </div>
        )}

        {showRawWebsite ? (
          <div style={{
            background: '#f8f9fa',
            padding: '15px',
            borderRadius: '4px',
            maxHeight: '400px',
            overflow: 'auto'
          }}>
            <DataTree data={websiteData} />
          </div>
        ) : (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px',
              marginBottom: '20px'
            }}>
              <div style={{
                background: '#e8f5e8',
                padding: '15px',
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2e7d32' }}>
                  {sessionCount}
                </div>
                <div style={{ color: '#666' }}>Active Sessions</div>
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '10px', color: '#333' }}>Recent Sessions</h3>
              <div style={{
                background: '#f8f9fa',
                padding: '15px',
                borderRadius: '4px',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                {recentSessions.length > 0 ? (
                  recentSessions.map(([sessionId, sessionData], index) => {
                    const lastSync = Object.keys(sessionData)[Object.keys(sessionData).length - 1];
                    return (
                      <div key={sessionId} style={{
                        padding: '8px',
                        borderBottom: index < recentSessions.length - 1 ? '1px solid #dee2e6' : 'none',
                        fontSize: '0.9rem'
                      }}>
                        <div style={{ fontWeight: 'bold', color: '#333' }}>
                          Session {sessionId}
                        </div>
                        <div style={{ color: '#666' }}>
                          Last sync: {new Date(lastSync).toLocaleString()}
                        </div>
                        <div style={{ color: '#666' }}>
                          Syncs: {Object.keys(sessionData).length}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ color: '#666', textAlign: 'center' }}>
                    No recent sessions
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const SyncControls = () => (
    <div style={{
      background: 'white',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ margin: '0 0 15px 0', color: '#333' }}>Data Sync Controls</h2>
      
      <div style={{
        display: 'flex',
        gap: '15px',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <button
          onClick={handleToggleSync}
          style={{
            padding: '10px 20px',
            background: syncStatus?.isRunning ? '#dc3545' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {syncStatus?.isRunning ? 'Stop Sync' : 'Start Sync'}
        </button>
        
        <span style={{
          padding: '5px 10px',
          background: syncStatus?.isRunning ? '#d4edda' : '#f8d7da',
          color: syncStatus?.isRunning ? '#155724' : '#721c24',
          borderRadius: '4px',
          fontSize: '0.9rem'
        }}>
          {syncStatus?.isRunning ? 'Sync Active' : 'Sync Inactive'}
        </span>
      </div>

      {syncStatus?.lastSyncTime && (
        <div style={{ color: '#666', fontSize: '0.9rem' }}>
          Last sync: {new Date(syncStatus.lastSyncTime).toLocaleString()}
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8f9fa',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{ margin: 0, color: '#333' }}>Control Panel</h1>
          <button
            onClick={handleBackToGames}
            style={{
              padding: '10px 20px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Back to Games
          </button>
        </div>

        {/* Sync Controls */}
        <SyncControls />

        {/* ESP Data Section */}
        <ESPDataSection />

        {/* Website Data Section */}
        <WebsiteDataSection />
      </div>
    </div>
  );
};

export default ControlPanel; 