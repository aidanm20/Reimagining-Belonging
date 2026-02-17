const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("../connectMongo");

const app = express();

app.use(cors());
app.use(express.json());

let dbConnected = false;
 
app.use(async (_req, res, next) => {
  try {
    if (!dbConnected) {
      await connectDB();
      dbConnected = true;
    }
    next();
  } catch (error) {
    console.error("DB connection failed:", error.message);
    res.status(500).json({ ok: false, error: "Database connection failed" });
  }
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.post("/api/submitIcon", async (req, res) => {
  const { svg, answers, params } = req.body;
  if (!svg) return res.status(400).json({ ok: false, error: "svg required" });

 
  return res.status(201).json({ ok: true });
});

module.exports = app;
