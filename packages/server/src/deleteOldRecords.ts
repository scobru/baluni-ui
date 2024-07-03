import { open } from "sqlite";
import sqlite3 from "sqlite3";
import path from "path";

const dbPath = path.join(__dirname, "..", "baluniData.db");

export async function deleteOldRecords() {
  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const timestampLimit = threeDaysAgo.toISOString();

    await db.run("DELETE FROM totalValuations WHERE timestamp < ?", timestampLimit);
    await db.run("DELETE FROM totalInterestEarned WHERE timestamp < ?", timestampLimit);
    await db.run("DELETE FROM unitPrices WHERE timestamp < ?", timestampLimit);
    await db.run("DELETE FROM hyperPoolsData WHERE timestamp < ?", timestampLimit);

    console.log("Old records deleted successfully");
  } catch (error) {
    console.error("Failed to delete old records:", error);
  }
}
