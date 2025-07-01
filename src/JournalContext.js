import React, { createContext, useContext, useState } from 'react';

const JournalContext = createContext();

export function JournalProvider({ children }) {
  // Store answers as an object: { [questionIndex]: answer }
  const [journalAnswers, setJournalAnswers] = useState({});

  // Update a single answer
  const setJournalAnswer = (index, answer) => {
    setJournalAnswers(prev => ({ ...prev, [index]: answer }));
  };

  // Optionally, clear all answers
  const clearJournalAnswers = () => setJournalAnswers({});

  return (
    <JournalContext.Provider value={{ journalAnswers, setJournalAnswer, clearJournalAnswers }}>
      {children}
    </JournalContext.Provider>
  );
}

export function useJournal() {
  return useContext(JournalContext);
} 