import baluniYearnVaultRegistryAbi from "baluni-contracts/artifacts/contracts/registry/BaluniV1YearnVaultRegistry.sol/BaluniV1YearnVaultRegistry.json";
import baluniYearnVaultAbi from "baluni-contracts/artifacts/contracts/vaults/BaluniV1YearnVault.sol/BaluniV1YearnVault.json";
import dotenv from "dotenv";
import { Contract, ethers } from "ethers";
import erc20Abi from "baluni-contracts/abis/common/ERC20.json";
import { setupRegistry } from "./setupRegistry";

dotenv.config();

const provider = new ethers.providers.JsonRpcProvider(String(process.env.RPC_URL));
const signer = new ethers.Wallet(String(process.env.PRIVATE_KEY), provider);

let registryCtx: Contract | null | undefined = null;

export async function reinvestEarnings() {
  registryCtx = await setupRegistry(provider, signer);
  
  if (!registryCtx) {
    console.error("Registry context not initialized");
    return;
  }

  try {
    const yearnVaultRegistry = await registryCtx.getBaluniYearnVaultRegistry();
    const yearnVaultRegistryCtx = new ethers.Contract(
      String(yearnVaultRegistry),
      baluniYearnVaultRegistryAbi.abi,
      provider,
    );
    const vaults = await yearnVaultRegistryCtx.getAllVaults();

    for (const vault of vaults) {
      const vaultContract = new ethers.Contract(vault, baluniYearnVaultAbi.abi, signer);
      const baseAsset = await vaultContract.baseAsset();
      const baseAssetCtx = new ethers.Contract(baseAsset, erc20Abi, provider);
      const baseDecimals = await baseAssetCtx.decimals();

      try {
        const interestEarned = await vaultContract.interestEarned();
        console.log("Interest Earned:", ethers.utils.formatUnits(interestEarned, baseDecimals));

        if (Number(ethers.utils.formatUnits(interestEarned, baseDecimals)) > 0.01) {
          const gasEstimate = await vaultContract.estimateGas.buy();
          console.log(`Estimated gas for systemDeposit in vault ${vault}: ${gasEstimate.toString()}`);

          // Call static method to simulate
          await vaultContract.callStatic.buy();
          console.log(`Simulation successful for vault: ${vault}`);

          const gasPrice = await provider.getGasPrice();
          console.log(`Gas Price: ${gasPrice.toString()}`);
          const gasLimit = gasEstimate.mul(120).div(100); // Add 20% buffer

          // If simulation is successful, send the transaction
          const tx = await vaultContract.buy({ gasLimit: gasLimit, gasPrice });
          console.log(`Transaction sent for vault: ${vault}, tx hash: ${tx.hash}`);

          const receipt = await tx.wait();
          console.log(`Transaction confirmed for vault: ${vault}, block number: ${receipt.blockNumber}`);
        }
      } catch (error) {
        console.error(`Error executing Reinvest for vault ${vault}:`, error);
      }
    }
  } catch (error) {
    console.error("Error fetching vaults or vault registry:", error);
  }
}
