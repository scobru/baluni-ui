import contracts from "baluni-contracts/deployments/deployedContracts.json";
import baluniRegistryAbi from "baluni-contracts/artifacts/contracts/registry/BaluniV1Registry.sol/BaluniV1Registry.json";

import { ethers } from "ethers";

export async function setupRegistry(provider: ethers.providers.JsonRpcProvider, signer: ethers.Signer) {
  const chainId = await provider.getNetwork().then((network: { chainId: any }) => network.chainId);

  let registryCtx;

  if (chainId === 137) {
    const registryAddress = contracts[137].BaluniV1Registry;
    if (!registryAddress) {
      console.error(`Address not found for chainId: ${chainId}`);
      return;
    }
    registryCtx = new ethers.Contract(registryAddress, baluniRegistryAbi.abi, signer);
  }

  return registryCtx;
}
