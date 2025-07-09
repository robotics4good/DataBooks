import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, ref, push, set, onValue, update } from "./firebase";
import dataSyncService from "./services/dataSyncService";
import { timeService } from './utils/timeUtils';
import { useRef } from 'react';

const UserLogContext = createContext();

const BATCH_INTERVAL_MS = 10000; // 10 seconds
const BATCH_SIZE = 10;

export const useUserLog = () => {
  const context = useContext(UserLogContext);
  if (!context) {
    throw new Error('useUserLog must be used within a UserLogProvider');
  }
  return context;
};

export const UserLogProvider = ({ children }) => {
  const [userActions, setUserActions] = useState([]);
  const [loggingEnabled, setLoggingEnabled] = useState(false);
  const actionBatch = useRef([]);
  const batchTimer = useRef(null);

  // Helper to sanitize keys for Firebase paths
  const sanitizeForFirebase = (str) => (str || '').replace(/[.#$\[\]:/]/g, '_');

  // Get the selected player from localStorage, fallback to 'S1' if not set
  const userId = sanitizeForFirebase(localStorage.getItem('selectedPlayer') || 'S1');
  // Always use sessionId from localStorage
  const sessionId = sanitizeForFirebase(localStorage.getItem('sessionId') || 'unknown');

  // Batch flush function
  const flushBatch = async () => {
    if (!loggingEnabled || actionBatch.current.length === 0) return;
    if (dataSyncService.getSyncStatus().isRunning) {
      const updates = {};
      for (const action of actionBatch.current) {
        const timestamp = sanitizeForFirebase(action.timestamp);
        updates[`sessions/${sessionId}/UserLogs/${userId}/${timestamp}`] = action;
      }
      await update(ref(db), updates);
      actionBatch.current = [];
      console.log('🔥 Batch sent to Firebase');
    }
  };

  // Set up batch timer
  useEffect(() => {
    if (!loggingEnabled) return;
    batchTimer.current = setInterval(flushBatch, BATCH_INTERVAL_MS);
    return () => {
      clearInterval(batchTimer.current);
      flushBatch(); // Flush on unmount
    };
  }, [loggingEnabled, sessionId, userId]);

  // Flush on page unload
  useEffect(() => {
    const handleUnload = () => { flushBatch(); };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [sessionId, userId, loggingEnabled]);

  // Make logAction async to await the NIST time
  // type: 'journal_entry', 'plot_interaction', 'navigation'
  // details: JSON object with structured fields
  const logAction = async (type, details) => {
    if (!loggingEnabled) return;
    // Only allow structured types
    const allowedTypes = ['journal_entry', 'plot_interaction', 'navigation'];
    if (!allowedTypes.includes(type)) return;
    const timestampRaw = timeService.getCurrentTime().toISOString();
    const timestamp = sanitizeForFirebase(timestampRaw);
    const action = {
      userId,
      timestamp: timestampRaw,
      type,
      details: details || {}
    };
    setUserActions(prev => {
      const newActions = [...prev, action];
      dataSyncService.updateUserActions(newActions);
      return newActions;
    });
    actionBatch.current.push(action);
    if (actionBatch.current.length >= BATCH_SIZE) {
      await flushBatch();
    }
  };

  const startLogging = () => setLoggingEnabled(true);

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
      performManualSync,
      getSyncStatus,
      startLogging
    }}>
      {children}
    </UserLogContext.Provider>
  );
}; 