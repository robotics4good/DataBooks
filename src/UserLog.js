import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, ref, push } from "./firebase";
import { getNistTime } from "./utils/timeUtils";
import dataSyncService from "./services/dataSyncService";

const UserLogContext = createContext();

export function UserLogProvider({ children }) {
  const [userActions, setUserActions] = useState([]);

  // Get the selected player from localStorage, fallback to 'S1' if not set
  const userId = localStorage.getItem('selectedPlayer') || 'S1';

  // Load user actions from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('userActions');
      if (stored) {
        const actions = JSON.parse(stored);
        setUserActions(actions);
      }
    } catch (error) {
      console.warn('Failed to load user actions from localStorage:', error);
    }
  }, []);

  // Data sync service is OFF by default - user must manually enable
  useEffect(() => {
    // Don't start sync automatically - let user control it
    console.log('Data sync service ready - streaming is OFF by default');
    
    // Cleanup on unmount
    return () => {
      dataSyncService.stopSync();
    };
  }, []);

  // Fetch UTC time from NIST servers
  async function getNistUtcTime() {
    return await getNistTime();
  }

  // Make logAction async to await the NIST time
  const logAction = async (type, details) => {
    const timestamp = await getNistUtcTime();
    const cleanDetails = details ?? "";
    
    const action = {
      id: userId,
      timestamp,
      type,
      details: cleanDetails
    };

    // Update local state
    setUserActions(prev => {
      const newActions = [...prev, action];
      // Store in localStorage
      dataSyncService.updateUserActions(newActions);
      return newActions;
    });

    // Only send to Firebase if streaming is enabled
    if (dataSyncService.getSyncStatus().isRunning) {
      const userActivityRef = ref(db, `userActivity`);
      push(userActivityRef, action);
      console.log("🔥 Logged locally & sent to Firebase:", action);
    } else {
      console.log("📝 Logged locally only (streaming disabled):", action);
    }
  };


  const exportLog = () => {
    const csv = [
      'id,timestamp,type,details',
      ...userActions.map(a => `"${a.id}","${a.timestamp}","${a.type}","${a.details}"`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'user_actions.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export user actions as JSON file
  const exportLogAsJson = () => {
    const json = JSON.stringify(userActions, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'user_actions.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearLog = () => {
    setUserActions([]);
    // Clear from localStorage
    dataSyncService.updateUserActions([]);
  };

  // Add manual sync function
  const performManualSync = () => {
    return dataSyncService.performManualSync();
  };

  // Get sync status
  const getSyncStatus = () => {
    return dataSyncService.getSyncStatus();
  };

  return (
    <UserLogContext.Provider value={{ 
      userActions, 
      logAction, 
      exportLog, 
      exportLogAsJson, 
      clearLog,
      performManualSync,
      getSyncStatus
    }}>
      {children}
    </UserLogContext.Provider>
  );
}

export function useUserLog() {
  return useContext(UserLogContext);
} 