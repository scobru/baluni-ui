import factoryAbi from "baluni-contracts/artifacts/contracts/orchestators/BaluniV1AgentFactory.sol/BaluniV1AgentFactory.json";
import registryAbi from "baluni-contracts/artifacts/contracts/registry/BaluniV1Registry.sol/BaluniV1Registry.json";
import { INFRA } from "baluni/dist/api/";
import { waitForTx } from "baluni/dist/core/utils/web3/networkUtils";
import { Contract, Wallet, ethers } from "ethers";

export async function createAgent(signer: Wallet) {
  const chainId = await signer.getChainId();
  const registry = new Contract(INFRA[String(chainId)].REGISTRY, registryAbi.abi, signer);
  const factoryAddress = await registry.getBaluniAgentFactory();
  const factory = new Contract(factoryAddress, factoryAbi.abi, signer);
  const agentAddress = await factory.getAgentAddress(await signer.getAddress());
  if (agentAddress != ethers.constants.AddressZero) {
    return agentAddress;
  } else {
    const tx = await factory.getOrCreateAgent(await signer.getAddress());
    waitForTx(await signer.provider, tx.hash, await signer.getAddress());
    return tx;
  }
}

export async function checkAgent(signer: Wallet) {
  const chainId = await signer.getChainId();
  const registry = new Contract(INFRA[String(chainId)].REGISTRY, registryAbi.abi, signer);
  const factoryAddress = await registry.getBaluniAgentFactory();
  const factory = new Contract(factoryAddress, factoryAbi.abi, signer);
  const agentAddress = await factory.getAgentAddress(await signer.getAddress());
  if (agentAddress != ethers.constants.AddressZero) {
    return true;
  } else {
    return false;
  }
}
