import express from "express";
import path from "path";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { calculateStatistics } from "./calculateStatistics";

const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "http://localhost:3000", // Replace with your frontend's domain
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type,Authorization",
  }),
);

app.use(express.json());

const dbPromise = open({
  filename: path.join(__dirname, "..", "baluniData.db"),
  driver: sqlite3.Database,
});

app.get("/api/valuation-data", async (req, res) => {
  try {
    const db = await dbPromise;
    const valuations = await db.all("SELECT * FROM totalValuations");
    res.json(valuations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch valuation data" });
  }
});

app.get("/api/totalInterestEarned-data", async (req, res) => {
  try {
    const db = await dbPromise;
    const results = await db.all("SELECT * FROM totalInterestEarned");
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch total interest data" });
  }
});

app.get("/api/unitPrices-data", async (req, res) => {
  try {
    const db = await dbPromise;
    const results = await db.all("SELECT * FROM unitPrices");
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch unit prices data" });
  }
});

app.get("/api/statistics", async (req, res) => {
  try {
    const statistics = await calculateStatistics();
    res.json(statistics);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch statistics data" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
