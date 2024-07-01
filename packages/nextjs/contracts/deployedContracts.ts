/**
 * This file is autogenerated by Scaffold-ETH.
 * You should not edit it manually or your changes might be overwritten.
 */
import rebalancerABI from "baluni-contracts/artifacts/contracts/managers/BaluniV1Rebalancer.sol/BaluniV1Rebalancer.json";
import swapperABI from "baluni-contracts/artifacts/contracts/managers/BaluniV1Swapper.sol/BaluniV1Swapper.json";
import oracleABI from "baluni-contracts/artifacts/contracts/oracles/BaluniV1Oracle.sol/BaluniV1Oracle.json";
import agentABI from "baluni-contracts/artifacts/contracts/orchestators/BaluniV1Agent.sol/BaluniV1Agent.json";
import factoryABI from "baluni-contracts/artifacts/contracts/orchestators/BaluniV1AgentFactory.sol/BaluniV1AgentFactory.json";
import routerABI from "baluni-contracts/artifacts/contracts/orchestators/BaluniV1Router.sol/BaluniV1Router.json";
import poolABI from "baluni-contracts/artifacts/contracts/pools/BaluniV1Pool.sol/BaluniV1Pool.json";
import dcaVaultRegistryABI from "baluni-contracts/artifacts/contracts/registry/BaluniV1DCAVaultRegistry.sol/BaluniV1DCAVaultRegistry.json";
import poolRegistryABI from "baluni-contracts/artifacts/contracts/registry/BaluniV1PoolRegistry.sol/BaluniV1PoolRegistry.json";
import registryABI from "baluni-contracts/artifacts/contracts/registry/BaluniV1Registry.sol/BaluniV1Registry.json";
import yearnVaultRegistryABI from "baluni-contracts/artifacts/contracts/registry/BaluniV1YearnVaultRegistry.sol/BaluniV1YearnVaultRegistry.json";
import dcaVaultABI from "baluni-contracts/artifacts/contracts/vaults/BaluniV1DCAVault.sol/BaluniV1DCAVault.json";
import yearnVaultABI from "baluni-contracts/artifacts/contracts/vaults/BaluniV1YearnVault.sol/BaluniV1YearnVault.json";
import contracts from "baluni-contracts/deployments/deployedContracts.json";
import { GenericContractsDeclaration } from "~~/utils/scaffold-eth/contract";
import poolZapABI from "baluni-contracts/artifacts/contracts/managers/BaluniV1PoolZap.sol/BaluniV1PoolZap.json";

const deployedContracts = {
  137: {
    Registry: {
      address: contracts[137].BaluniV1Registry,
      abi: registryABI.abi,
    },
    YearnVaultRegistry: {
      address: contracts[137].BaluniYearnVaultRegistry,
      abi: yearnVaultRegistryABI.abi,
    },
    DCAVaultRegistry: {
      address: contracts[137].BaluniDCAVaultRegistry,
      abi: dcaVaultRegistryABI.abi,
    },
    PoolRegistry: {
      address: contracts[137].BaluniV1PoolRegistry,
      abi: poolRegistryABI.abi,
    },
    Rebalancer: {
      address: contracts[137].BaluniV1Rebalancer,
      abi: rebalancerABI.abi,
    },
    Swapper: {
      address: contracts[137].BaluniV1Swapper,
      abi: swapperABI.abi,
    },
    Router: {
      address: contracts[137].BaluniV1Router,
      abi: routerABI.abi,
    },
    Factory: {
      address: contracts[137].BaluniV1AgentFactory,
      abi: factoryABI.abi,
    },
    Agent: {
      address: "",
      abi: agentABI.abi,
    },
    Oracle: {
      address: contracts[137].BaluniV1Oracle,
      abi: oracleABI.abi,
    },
    PoolZap: {
      address: contracts[137].BaluniV1PoolZap,
      abi: poolZapABI.abi,
    },
    PoolStable: {
      address: contracts[137].BaluniPoolStable,
      abi: poolABI.abi,
    },
    BaluniPoolBalanced: {
      address: contracts[137].BaluniPoolBalanced,
      abi: poolABI.abi,
    },
    BaluniPoolConservative: {
      address: contracts[137].BaluniPoolConservative,
      abi: poolABI.abi,
    },
    BaluniPoolModerate: {
      address: contracts[137].BaluniPoolModerate,
      abi: poolABI.abi,
    },
    BaluniYearnVault_USDCxWBTC: {
      address: contracts[137].BaluniYearnVault_USDCxWBTC,
      abi: yearnVaultABI.abi,
    },
    BaluniDCAVault_USDCxWBTC: {
      address: contracts[137].BaluniDCAVault_USDCxWBTC,
      abi: dcaVaultABI.abi,
    },
  },
} as GenericContractsDeclaration;

export default deployedContracts satisfies GenericContractsDeclaration;
