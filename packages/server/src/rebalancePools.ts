import baluniPoolsRegistryAbi from "baluni-contracts/artifacts/contracts/registry/BaluniV1PoolRegistry.sol/BaluniV1PoolRegistry.json";
import baluniPoolAbi from "baluni-contracts/artifacts/contracts/pools/BaluniV1Pool.sol/BaluniV1Pool.json";
import dotenv from "dotenv";
import { Contract, ethers } from "ethers";
import { setupRegistry } from "./setupRegistry";

dotenv.config();

const provider = new ethers.providers.JsonRpcProvider(String(process.env.RPC_URL));
const signer = new ethers.Wallet(String(process.env.PRIVATE_KEY), provider);

let registryCtx: Contract | null | undefined = null;

export async function rebalancePools() {
  registryCtx = await setupRegistry(provider, signer);

  if (!registryCtx) {
    console.error("Registry context not initialized");
    return;
  }

  try {
    const poolsRegistry = await registryCtx.getBaluniPoolRegistry();
    const poolsRegistryCtx = new ethers.Contract(String(poolsRegistry), baluniPoolsRegistryAbi.abi, provider);
    const pools = await poolsRegistryCtx.getAllPools();

    for (const pool of pools) {
      const poolContract = new ethers.Contract(pool, baluniPoolAbi.abi, signer);

      try {
        const canRebalance = await poolContract.isRebalanceNeeded();
        console.log("IsRebalanceNeeded:", canRebalance, pool);

        if (canRebalance) {
          const gasEstimate = await poolContract.estimateGas.rebalance();
          console.log(`Estimated gas for systemDeposit in vault ${pool}: ${gasEstimate.toString()}`);

          // Call static method to simulate
          await poolContract.callStatic.rebalance();
          console.log(`Simulation successful for pool: ${pool}`);

          const gasPrice = await provider.getGasPrice();
          console.log(`Gas Price: ${gasPrice.toString()}`);
          const gasLimit = gasEstimate.mul(120).div(100); // Add 20% buffer

          // If simulation is successful, send the transaction
          const tx = await poolContract.rebalance({ gasLimit, gasPrice });
          console.log(`Transaction sent for pool: ${pool}, tx hash: ${tx.hash}`);

          const receipt = await tx.wait();
          console.log(`Transaction confirmed for pool: ${pool}, block number: ${receipt.blockNumber}`);
        }
      } catch (error) {
        console.error(`Error executing Rebalancefor pool ${pool}:`, error);
      }
    }
  } catch (error) {
    console.error("Error fetching pool or  pool registry:", error);
  }
}
