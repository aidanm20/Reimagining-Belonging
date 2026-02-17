const express = require("express");
const cors = require("cors");

const app = express();

require("dotenv").config();

app.use(cors());
app.use(express.json());

const connectDB = require("./connectMongo");

app.get("/", (_req, res) => {
  res.status(200).json({ ok: true, message: "Backend is running" });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

const PORT = Number(process.env.PORT) || 3000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});


app.post("/api/submitIcon", async (req, res) => {
  const {svg, answers, params } = req.body;
  if (!svg) return res.status(400).json({ ok: false, error: "svg required" });

  // await SvgSubmission.create({ svg, answers });
  return res.status(201).json({ ok: true });
})