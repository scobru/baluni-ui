import baluniYearnVaultRegistryAbi from "baluni-contracts/artifacts/contracts/registry/BaluniV1YearnVaultRegistry.sol/BaluniV1YearnVaultRegistry.json";
import baluniYearnVaultAbi from "baluni-contracts/artifacts/contracts/vaults/BaluniV1YearnVault.sol/BaluniV1YearnVault.json";
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

async function reinvestEarnings() {
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
        const interestEarned = await vaultContract.interestEarned()();
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
          const tx = await vaultContract.buy({ gasLimit, gasPrice });
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
    setInterval(reinvestEarnings, Number(process.env.INTERVAL)); // Fetch every interval
    reinvestEarnings(); // Initial fetch
  }
})();
