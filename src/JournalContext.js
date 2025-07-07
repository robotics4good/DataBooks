import React, { createContext, useContext, useState, useEffect } from 'react';
import dataSyncService from './services/dataSyncService';

const JournalContext = createContext();

export function JournalProvider({ children }) {
  // Store answers as an object: { [questionIndex]: answer }
  const [journalAnswers, setJournalAnswers] = useState({});

  // Load journal answers from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('journalAnswers');
      if (stored) {
        const answers = JSON.parse(stored);
        setJournalAnswers(answers);
      }
    } catch (error) {
      console.warn('Failed to load journal answers from localStorage:', error);
    }
  }, []);

  // Update a single answer
  const setJournalAnswer = (index, answer) => {
    setJournalAnswers(prev => {
      const newAnswers = { ...prev, [index]: answer };
      // Store in localStorage
      dataSyncService.updateJournalData(newAnswers);
      return newAnswers;
    });
  };

  // Optionally, clear all answers
  const clearJournalAnswers = () => {
    setJournalAnswers({});
    dataSyncService.updateJournalData({});
  };

  return (
    <JournalContext.Provider value={{ journalAnswers, setJournalAnswer, clearJournalAnswers }}>
      {children}
    </JournalContext.Provider>
  );
}

export function useJournal() {
  return useContext(JournalContext);
} 