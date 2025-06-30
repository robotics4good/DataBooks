import React, { createContext, useContext, useState } from 'react';
import { db, ref, push } from "./firebase";

const UserLogContext = createContext();

export function UserLogProvider({ children }) {
  const [userActions, setUserActions] = useState([]);

  // For now, use a static ID (option 1: S1)
  const userId = 'S1';

  // Fetch UTC time from worldtimeapi.org (NIST/UTC)
  async function getNistUtcTime() {
    try {
      const res = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC');
      if (!res.ok) throw new Error('Failed to fetch time');
      const data = await res.json();
      return data.utc_datetime;
    } catch (e) {
      // Fallback to local time if API fails
      return new Date().toISOString();
    }
  }

  // Make logAction async to await the NIST time
  const logAction = async (type, details) => {
    const timestamp = await getNistUtcTime();
    const cleanDetails = details ?? "";
    setUserActions(prev => [
      ...prev,
      {
        id: userId,
        timestamp,
        type,
        details: cleanDetails // now always a string
      }
    ]);

    const action = {
      id: userId,
      timestamp,
      type,
      details: cleanDetails
    };
    const userActivityRef = ref(db, `userActivity`);
    push(userActivityRef, action);
  
    console.log("🔥 Logged locally & sent to Firebase:", action);
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
  };

  return (
    <UserLogContext.Provider value={{ userActions, logAction, exportLog, exportLogAsJson, clearLog }}>
      {children}
    </UserLogContext.Provider>
  );
}

export function useUserLog() {
  return useContext(UserLogContext);
} 