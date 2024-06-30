import baluniVaultRegistryAbi from "baluni-contracts/artifacts/contracts/registry/BaluniV1YearnVaultRegistry.sol/BaluniV1YearnVaultRegistry.json";
import baluniVaultAbi from "baluni-contracts/artifacts/contracts/vaults/BaluniV1YearnVault.sol/BaluniV1YearnVault.json";
import dotenv from "dotenv";
import { Contract, ethers } from "ethers";
import path from "path";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import baluniRegistryAbi from "baluni-contracts/artifacts/contracts/registry/BaluniV1Registry.sol/BaluniV1Registry.json";
import contracts from "baluni-contracts/deployments/deployedContracts.json";

dotenv.config();

const provider = new ethers.providers.JsonRpcProvider(String(process.env.RPC_URL));

let registryCtx: Contract;

async function setup() {
  const chainId = await provider.getNetwork().then(network => network.chainId);
  if (chainId === 137) {
    const registryAddress = contracts[137].BaluniV1Registry;
    if (!registryAddress) {
      console.error(`Address not found for chainId: ${chainId}`);
      return;
    }
    registryCtx = new ethers.Contract(registryAddress, baluniRegistryAbi.abi, provider);
  }
}

async function fetchInterestEarned() {
  if (!registryCtx) {
    console.error("Registry context not initialized");
    return;
  }

  const db = await open({
    filename: path.join(__dirname, "..", "baluniData.db"),
    driver: sqlite3.Database,
  });

  await db.exec(`
        CREATE TABLE IF NOT EXISTS totalInterestEarned (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp TEXT NOT NULL,
          interestEarned TEXT NOT NULL,
          address TEXT NOT NULL
        )
    `);

  const vaultRegistry = await registryCtx.getBaluniYearnVaultRegistry();
  const registryContract = new ethers.Contract(String(vaultRegistry), baluniVaultRegistryAbi.abi, provider);

  const vaults = await registryContract.getAllVaults();

  for (const vault of vaults) {
    const vaultContract = new ethers.Contract(vault, baluniVaultAbi.abi, provider);

    try {
      const interestEarned = await vaultContract.interestEarned();
      const interestData = {
        timestamp: new Date().toISOString(),
        interestEarned: interestEarned.toString(),
        address: vault,
      };

      await db.run(
        "INSERT INTO totalInterestEarned (timestamp, interestEarned, address) VALUES (?, ?, ?)",
        interestData.timestamp,
        interestData.interestEarned,
        interestData.address,
      );

      console.log("Vaults Interest data updated:", interestData);
    } catch (error) {
      console.error(`Error fetching interest earned for vault ${vault}:`, error);
    }
  }

  await db.close();
}

async function main() {
  await setup();
  if (registryCtx) {
    fetchInterestEarned(); // Initial fetch
    setInterval(fetchInterestEarned, Number(process.env.INTERVAL)); // Fetch every interval
  }
}

main().catch(error => console.error("Error in main execution:", error));
