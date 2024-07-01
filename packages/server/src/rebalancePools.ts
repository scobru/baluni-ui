import baluniPoolsRegistryAbi from "baluni-contracts/artifacts/contracts/registry/BaluniV1PoolRegistry.sol/BaluniV1PoolRegistry.json";
import baluniPoolAbi from "baluni-contracts/artifacts/contracts/pools/BaluniV1Pool.sol/BaluniV1Pool.json";
import dotenv from "dotenv";
import { Contract, ethers } from "ethers";
import baluniRegistryAbi from "baluni-contracts/artifacts/contracts/registry/BaluniV1Registry.sol/BaluniV1Registry.json";
import contracts from "baluni-contracts/deployments/deployedContracts.json";
import erc20Abi from "baluni-contracts/abis/common/ERC20.json";

dotenv.config();

const provider = new ethers.providers.JsonRpcProvider(String(process.env.RPC_URL));
const signer = new ethers.Wallet(String(process.env.PRIVATE_KEY), provider);

let registryCtx: Contract | null = null;

async function setup() {
  const chainId = await provider.getNetwork().then(network => network.chainId);
  if (chainId === 137) {
    const registryAddress = contracts[137].BaluniV1Registry;
    if (!registryAddress) {
      console.error(`Address not found for chainId: ${chainId}`);
      return;
    }
    registryCtx = new ethers.Contract(registryAddress, baluniRegistryAbi.abi, signer);
  }
}

async function rebalance() {
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
        console.log("IsRebalanceNeeded:", canRebalance);

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
        console.error(`Error executing Rebalance for pool ${pool}:`, error);
      }
    }
  } catch (error) {
    console.error("Error fetching pool or  pool registry:", error);
  }
}

// Initial setup and execution
(async () => {
  await setup();
  if (registryCtx) {
    setInterval(rebalance, Number(process.env.INTERVAL)); // Fetch every interval
    rebalance(); // Initial fetch
  }
})();
