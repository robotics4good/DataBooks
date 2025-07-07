import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, onValue, set, get, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBxGQoO3qP8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y",
  authDomain: "dataorg-project.firebaseapp.com",
  databaseURL: "https://dataorg-project-default-rtdb.firebaseio.com",
  projectId: "dataorg-project",
  storageBucket: "dataorg-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

export { ref, push, onValue, set, get, remove };
export default app;
