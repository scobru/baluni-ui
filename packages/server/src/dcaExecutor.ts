import baluniDCAVaultRegistryAbi from "baluni-contracts/artifacts/contracts/registry/BaluniV1DCAVaultRegistry.sol/BaluniV1DCAVaultRegistry.json";
import baluniDCAVaultAbi from "baluni-contracts/artifacts/contracts/vaults/BaluniV1DCAVault.sol/BaluniV1DCAVault.json";
import dotenv from "dotenv";
import { Contract, ethers } from "ethers";
import { setupRegistry } from "./setupRegistry";

dotenv.config();

const provider = new ethers.providers.JsonRpcProvider(String(process.env.RPC_URL));
const signer = new ethers.Wallet(String(process.env.PRIVATE_KEY), provider);

let registryCtx: Contract | null | undefined = null;

export async function dcaExecutor() {
  registryCtx = await setupRegistry(provider, signer);

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
        console.log("DCA Trigger:", vault, dcaTrigger);

        if (dcaTrigger) {
          // Simulate the transaction
          const gasEstimate = await vaultContract.estimateGas.systemDeposit();
          console.log(`Estimated gas for systemDeposit in vault ${vault}: ${gasEstimate.toString()}`);

          // Call static method to simulate
          await vaultContract.callStatic.systemDeposit();
          console.log(`Simulation successful for vault: ${vault}`);

          const gasPrice = await provider.getGasPrice();
          console.log(`Gas Price: ${gasPrice.toString()}`);
          const gasLimit = gasEstimate.mul(120).div(100); // Add 20% buffer

          // If simulation is successful, send the transaction
          const tx = await vaultContract.systemDeposit(/* { gasLimit, gasPrice } */);
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
