import { open } from "sqlite";
import sqlite3 from "sqlite3";
import path from "path";
import { formatISO, subDays } from "date-fns";

const dbPath = path.join(__dirname, "..", "baluniData.db");

async function calculatePercentageChange(oldValue: number, newValue: number): Promise<number> {
  return ((newValue - oldValue) / oldValue) * 100;
}

async function getChangeForPeriod(
  tableName: string,
  dateField: string,
  valueField: string,
  address: string,
  days: number,
) {
  const db = await open({ filename: dbPath, driver: sqlite3.Database });

  const now = new Date();
  const pastDate = subDays(now, days);

  const latestData = await db.get(
    `SELECT ${valueField} FROM ${tableName} WHERE address = ? ORDER BY ${dateField} DESC LIMIT 1`,
    address,
  );
  const pastData = await db.get(
    `SELECT ${valueField} FROM ${tableName} WHERE address = ? AND ${dateField} <= ? ORDER BY ${dateField} DESC LIMIT 1`,
    address,
    formatISO(pastDate),
  );

  await db.close();

  if (!latestData || !pastData) {
    throw new Error("Insufficient data to calculate percentage change");
  }

  return calculatePercentageChange(parseFloat(pastData[valueField]), parseFloat(latestData[valueField]));
}

export async function calculateStatistics() {
  const db = await open({ filename: dbPath, driver: sqlite3.Database });

  try {
    const addresses = await db.all("SELECT DISTINCT address FROM unitPrices");
    const results = [];

    for (const { address } of addresses) {
      const dailyUnitPriceChange = await getChangeForPeriod("unitPrices", "timestamp", "unitPrice", address, 1);
      const dailyValuationChange = await getChangeForPeriod(
        "totalValuations",
        "timestamp",
        "totalValuation",
        address,
        1,
      );

      results.push({
        address,
        unitPrice: { daily: dailyUnitPriceChange },
        valuation: { daily: dailyValuationChange },
      });
    }

    return results;
  } catch (error) {
    console.error("Error calculating statistics:", error);
    throw error;
  } finally {
    await db.close();
  }
}
