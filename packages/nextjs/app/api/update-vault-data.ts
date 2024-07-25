import { promises as fs } from "fs";
import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { vaultAddress, timestamp, interest } = req.body;

  if (!vaultAddress || !timestamp || !interest) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const jsonDirectory = path.join(process.cwd());
  const filePath = path.join(jsonDirectory, "vaultData.json");

  try {
    const fileContents = await fs.readFile(filePath, "utf8");
    const vaultData = JSON.parse(fileContents);

    if (!vaultData.vaults[vaultAddress]) {
      vaultData.vaults[vaultAddress] = {
        symbol: `VAULT${Object.keys(vaultData.vaults).length + 1}`,
        historicalData: [],
      };
    }

    vaultData.vaults[vaultAddress].historicalData.push({ timestamp, interest });

    await fs.writeFile(filePath, JSON.stringify(vaultData, null, 2), "utf8");

    res.status(200).json({ message: "Data updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update data" });
  }
}
