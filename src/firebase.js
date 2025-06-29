// src/firebase.js (for frontend React app using Realtime Database)
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, onValue } from "firebase/database";

// Firebase config from your .env file
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Utility: get a ref for a specific game session
const getSessionRef = (sessionId) => ref(db, `sessions/${sessionId}/devicePackets`);

// Placeholder for getSessionCollection (implement as needed)
const getSessionCollection = (sessionId) => {
  // TODO: Implement Firestore or Realtime DB collection logic
  return null;
};

// Placeholder for addDoc (implement as needed)
const addDoc = (...args) => {
  // TODO: Implement Firestore addDoc or similar logic
  return Promise.resolve();
};

export { db, push, onValue, getSessionRef, getSessionCollection, addDoc };
