import React, { createContext, useContext, useState } from 'react';

const UserLogContext = createContext();

export function UserLogProvider({ children }) {
  const [userActions, setUserActions] = useState([]);

  const logAction = (type, details) => {
    setUserActions(prev => [
      ...prev,
      {
        timestamp: new Date().toISOString(),
        type,
        details // now always a string
      }
    ]);
  };

  const exportLog = () => {
    const csv = [
      'timestamp,type,details',
      ...userActions.map(a => `"${a.timestamp}","${a.type}","${a.details}"`)
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