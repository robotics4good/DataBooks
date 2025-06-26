// server.js
const express = require("express");
const admin = require("firebase-admin");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.applicationDefault(), // or serviceAccount
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL
});

const db = admin.database();

app.post("/packet", async (req, res) => {
  const { sessionId, studentId, timestamp, interaction, T_start, T_end } = req.body;

  if (!sessionId || studentId === undefined || !interaction) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const ref = db.ref(`sessions/${sessionId}/devicePackets`);
  await ref.push({
    studentId,
    timestamp: timestamp || Date.now(),
    interaction,
    T_start,
    T_end
  });

  res.status(200).json({ success: true });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Packet server listening on port ${PORT}`);
});
