import React, { createContext, useContext, useState } from 'react';

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
    setUserActions(prev => [
      ...prev,
      {
        id: userId,
        timestamp,
        type,
        details // now always a string
      }
    ]);
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

  const clearLog = () => {
    setUserActions([]);
  };

  return (
    <UserLogContext.Provider value={{ userActions, logAction, exportLog, clearLog }}>
      {children}
    </UserLogContext.Provider>
  );
}

export function useUserLog() {
  return useContext(UserLogContext);
} 