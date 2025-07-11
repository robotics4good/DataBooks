import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, ref, push, set, onValue, update } from "./firebase";
import { timeService, getSanDiegoISOString } from './utils/timeUtils';
import { useRef } from 'react';

const UserLogContext = createContext();

const BATCH_INTERVAL_MS = 20000; // 20 seconds
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

  // Get the selected player from localStorage, fallback to 'Luma' if not set
  const userId = sanitizeForFirebase(localStorage.getItem('selectedPlayer') || 'Luma');
  // Always use sessionId from localStorage
  const sessionId = sanitizeForFirebase(localStorage.getItem('sessionId') || 'unknown');

  // Batch flush function (now writes the whole batch as an array under the flush timestamp)
  const flushBatch = async () => {
    if (!loggingEnabled || actionBatch.current.length === 0) return;
    const flushTimestampRaw = getSanDiegoISOString(timeService.getCurrentTime());
    const flushTimestamp = sanitizeForFirebase(flushTimestampRaw);
    const batchToWrite = actionBatch.current.slice();
    await set(ref(db, `sessions/${sessionId}/UserLogs/${userId}/${flushTimestamp}`), batchToWrite);
    actionBatch.current = [];
    console.log('🔥 Batch sent to Firebase at', flushTimestampRaw, batchToWrite);
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

  // Log action: add to buffer, flush if buffer reaches BATCH_SIZE
  const logAction = async (type, action, details = {}) => {
    if (!loggingEnabled) return;
    const allowedTypes = ['journal_entry', 'plot_interaction', 'navigation'];
    if (!allowedTypes.includes(type)) return;
    const timestampRaw = getSanDiegoISOString(timeService.getCurrentTime());
    const logPacket = {
      type,
      action,
      timestamp: timestampRaw,
      details: details || {}
    };
    setUserActions(prev => {
      const newActions = [...prev, logPacket];
      return newActions;
    });
    actionBatch.current.push(logPacket);
    if (actionBatch.current.length >= BATCH_SIZE) {
      await flushBatch();
    }
  };

  const startLogging = () => setLoggingEnabled(true);

  return (
    <UserLogContext.Provider value={{ 
      userActions, 
      logAction, 
      startLogging
    }}>
      {children}
    </UserLogContext.Provider>
  );
}; 