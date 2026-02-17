const express = require("express");
const cors = require("cors");
const mongoose = require('mongoose')
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

 
const iconSchema = new mongoose.Schema({
  svg: { type: String, required: true},
  answers: { type: Object },
  params: { type: Object}
}, {timestamps:true})

const Icon = mongoose.models.Icon || mongoose.model("Icon", iconSchema);

app.post("/api/submitIcon", async (req, res) => {
  const { svg, answers, params } = req.body;
  if (!svg) return res.status(400).json({ ok: false, error: "svg required" });
  await Icon.create({svg,answers,params})
 
  return res.status(201).json({ ok: true });
});

module.exports = app;
