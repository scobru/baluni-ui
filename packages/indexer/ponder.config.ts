import { BaluniV1VaultRegistryAbi } from "./abis/BaluniV1VaultRegistryAbi";
import { BaluniV1yVaultAbi } from "./abis/BaluniV1yVaultAbi";
import { createConfig, mergeAbis } from "@ponder/core";
import contracts from "baluni-contracts/deployments/deployedContracts.json";
import { Abi, http } from "viem";

export default createConfig({
  networks: {
    mainnet: {
      chainId: 137,
      transport: http(process.env.PONDER_RPC_URL_1),
    },
  },
  contracts: {
    byUSDCx: {
      network: "mainnet",
      abi: mergeAbis([BaluniV1yVaultAbi as Abi]),
      address: String(contracts[137].BaluniV1yVault) as any,
      startBlock: 58307762,
      includeCallTraces: true,
    },
    BaluniV1VaultRegistry: {
      network: "mainnet",
      abi: mergeAbis([BaluniV1VaultRegistryAbi as Abi]),
      address: String(contracts[137].BaluniV1VaultRegistry) as any,
      startBlock: 58307756,
      includeCallTraces: true,
    },
  },
  blocks: {
    byUSDCx: {
      network: "mainnet",
      startBlock: 58307762,
      interval: 60 / 12, // Every 60 seconds
    },
    BaluniV1VaultRegistry: {
      network: "mainnet",
      startBlock: 58307756,
      interval: 60 / 12, // Every 60 seconds
    },
  },
});
