import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const tournamentAddress = "0xe1743C0358487B46B87669A6695d662237C52F4E"; // Mumbai
const poolAddress = "0xFe9B07e81c4BDDAA047bfF31D912f8c2e4E9a4Fc"; // Mumbai

async function main() {
  const signers = await ethers.getSigners();
  const tournament = await ethers.getContractAt("Tournament", tournamentAddress, signers[0]);
  const pool = await ethers.getContractAt("Pool", poolAddress, signers[0]);
  const currentTime = Math.floor(Date.now() / 1000);
  const verificationTime = await tournament.verificationTime();

  if (currentTime >= verificationTime) {
    try {
      console.log("Tentativo di risolvere il torneo...");
      const tx = await tournament.resolveTournament();
      await tx.wait();
      console.log("Torneo risolto con successo.");
    } catch (error) {
      console.error("Errore nella risoluzione del torneo:", error);
    }
  } else {
    console.log("Non è ancora il momento di risolvere il torneo.");
  }

  try {
    const hasUnresolvedPredictions = await pool.hasAnyUnresolvedPastEndTime();
    if (hasUnresolvedPredictions) {
      console.log("Tentativo di risolvere la pool...");
      const txPool = await pool.resolve();
      await txPool.wait();
      console.log("Pool risolta con successo.");
    } else {
      console.log("Nessuna previsione da risolvere nella pool al momento.");
    }
  } catch (error) {
    console.error("Errore nella risoluzione della pool:", error);
  }
}

let counter = 0;

async function runEveryMinute() {
  try {
    await main();
    counter++;
    console.log("Counter: ", counter);
  } catch (error) {
    console.error(error);
  }
  setTimeout(runEveryMinute, 1 * 1 * 60 * 1000);
}

runEveryMinute();
