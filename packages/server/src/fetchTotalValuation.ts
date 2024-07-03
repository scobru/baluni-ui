import baluniVaultRegistryAbi from "baluni-contracts/artifacts/contracts/registry/BaluniV1YearnVaultRegistry.sol/BaluniV1YearnVaultRegistry.json";
import baluniVaultAbi from "baluni-contracts/artifacts/contracts/vaults/BaluniV1YearnVault.sol/BaluniV1YearnVault.json";
import baluniDCAVaultAbi from "baluni-contracts/artifacts/contracts/vaults/BaluniV1DCAVault.sol/BaluniV1DCAVault.json";
import dotenv from "dotenv";
import { Contract, ethers } from "ethers";
import path from "path";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import baluniPoolAbi from "baluni-contracts/artifacts/contracts/pools/BaluniV1Pool.sol/BaluniV1Pool.json";
import baluniPoolRegistryAbi from "baluni-contracts/artifacts/contracts/registry/BaluniV1PoolRegistry.sol/BaluniV1PoolRegistry.json";
import baluniDCAVaultRegistryAbi from "baluni-contracts/artifacts/contracts/registry/BaluniV1DCAVaultRegistry.sol/BaluniV1DCAVaultRegistry.json";
import { setupRegistry } from "./setupRegistry";
import { formatUnits } from "ethers/lib/utils";

dotenv.config();

const provider = new ethers.providers.JsonRpcProvider(String(process.env.RPC_URL));
const signer = new ethers.Wallet(String(process.env.PRIVATE_KEY), provider);

let registryCtx: Contract | null | undefined = null;

async function fetchAndStoreValuation(vaultContract: Contract, address: string, db: any) {
  try {
    const totalValuation = await vaultContract.totalValuation();
    const valuationData = {
      timestamp: new Date().toISOString(),
      totalValuation: Array.isArray(totalValuation) ? totalValuation[0].toString() : totalValuation.toString(),
      address: address,
    };
    const decimal = await vaultContract.decimals();

    await db.run(
      "INSERT INTO totalValuations (timestamp, totalValuation, address) VALUES (?, ?, ?)",
      valuationData.timestamp,
      formatUnits(valuationData.totalValuation, decimal),
      valuationData.address,
    );

    console.log("Valuation data updated:", valuationData);
  } catch (error) {
    console.error(`Error fetching totalValuation for address ${address}:`, error);
  }
}

export async function fetchTotalValuation() {
  registryCtx = await setupRegistry(provider, signer);

  if (!registryCtx) {
    return;
  }

  const db = await open({
    filename: path.join(__dirname, "..", "baluniData.db"),
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS totalValuations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      totalValuation TEXT NOT NULL,
      address TEXT NOT NULL
    )
  `);

  try {
    const vaultRegistry = await registryCtx.getBaluniYearnVaultRegistry();
    const vaultRegistryContract = new ethers.Contract(String(vaultRegistry), baluniVaultRegistryAbi.abi, provider);
    const vaults = await vaultRegistryContract.getAllVaults();

    for (const vault of vaults) {
      const vaultContract = new ethers.Contract(vault, baluniVaultAbi.abi, provider);
      await fetchAndStoreValuation(vaultContract, vault, db);
    }
  } catch (error) {
    console.error("Error processing vault registry:", error);
  }

  try {
    const dcaVaultRegistry = await registryCtx.getBaluniDCAVaultRegistry();
    const dcaVaultRegistryContract = new ethers.Contract(
      String(dcaVaultRegistry),
      baluniDCAVaultRegistryAbi.abi,
      provider,
    );
    const dcaVaults = await dcaVaultRegistryContract.getAllVaults();

    for (const vault of dcaVaults) {
      const vaultContract = new ethers.Contract(vault, baluniDCAVaultAbi.abi, provider);
      await fetchAndStoreValuation(vaultContract, vault, db);
    }
  } catch (error) {
    console.error("Error processing DCA vault registry:", error);
  }

  try {
    const poolRegistry = await registryCtx.getBaluniPoolRegistry();
    const poolRegistryContract = new ethers.Contract(String(poolRegistry), baluniPoolRegistryAbi.abi, provider);
    const pools = await poolRegistryContract.getAllPools();

    for (const pool of pools) {
      const poolContract = new ethers.Contract(pool, baluniPoolAbi.abi, provider);
      await fetchAndStoreValuation(poolContract, pool, db);
    }
  } catch (error) {
    console.error("Error processing pool registry:", error);
  }

  await db.close();
}
