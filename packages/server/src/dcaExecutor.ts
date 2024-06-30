import baluniDCAVaultRegistryAbi from "baluni-contracts/artifacts/contracts/registry/BaluniV1DCAVaultRegistry.sol/BaluniV1DCAVaultRegistry.json";
import baluniDCAVaultAbi from "baluni-contracts/artifacts/contracts/vaults/BaluniV1DCAVault.sol/BaluniV1DCAVault.json";
import dotenv from "dotenv";
import { Contract, ethers } from "ethers";
import baluniRegistryAbi from "baluni-contracts/artifacts/contracts/registry/BaluniV1Registry.sol/BaluniV1Registry.json";
import contracts from "baluni-contracts/deployments/deployedContracts.json";

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

async function executeDca() {
  if (!registryCtx) {
    console.error("Registry context not initialized");
    return;
  }

  try {
    const dcaVaultRegistry = await registryCtx.getBaluniDCAVaultRegistry();
    const dcaVaultRegistryCtx = new ethers.Contract(String(dcaVaultRegistry), baluniDCAVaultRegistryAbi.abi, provider);
    const vaults = await dcaVaultRegistryCtx.getAllVaults();

    for (const vault of vaults) {
      const vaultContract = new ethers.Contract(vault, baluniDCAVaultAbi.abi, signer);

      try {
        const dcaTrigger = await vaultContract.canSystemDeposit();
        console.log("DCA Trigger:", dcaTrigger);

        if (dcaTrigger) {
          // Simulate the transaction
          const gasEstimate = await vaultContract.estimateGas.systemDeposit();
          console.log(`Estimated gas for systemDeposit in vault ${vault}: ${gasEstimate.toString()}`);

          // Call static method to simulate
          await vaultContract.callStatic.systemDeposit();
          console.log(`Simulation successful for vault: ${vault}`);

          // If simulation is successful, send the transaction
          const tx = await vaultContract.systemDeposit();
          console.log(`Transaction sent for vault: ${vault}, tx hash: ${tx.hash}`);

          const receipt = await tx.wait();
          console.log(`Transaction confirmed for vault: ${vault}, block number: ${receipt.blockNumber}`);
        }
      } catch (error) {
        console.error(`Error executing DCA for vault ${vault}:`, error);
      }
    }
  } catch (error) {
    console.error("Error fetching vaults or DCA vault registry:", error);
  }
}

// Initial setup and execution
(async () => {
  await setup();
  if (registryCtx) {
    setInterval(executeDca, Number(process.env.INTERVAL)); // Fetch every interval
    executeDca(); // Initial fetch
  }
})();
