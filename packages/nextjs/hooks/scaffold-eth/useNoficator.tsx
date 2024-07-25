import { Contract, ethers } from "ethers";
import { WalletClient } from "viem";
import { usePublicClient } from "wagmi";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

let selectedProvider: ethers.providers.Provider | undefined;
let load: string;

/**
 * Calls a method on a contract with the specified inputs and gas price.
 * @param contract The contract instance.
 * @param method The name of the method to call.
 * @param inputs The inputs to pass to the method.
 * @param gasPrice The gas price to use for the transaction.
 * @returns The transaction response.
 */
export async function callContractMethod(contract: Contract, method: string, inputs: any[], gasPrice: bigint) {
  console.log(`${method}(${inputs})`);
  const defaultGasLimit = BigInt(3000000);
  let gasLimit = defaultGasLimit;

  try {
    const gasEstimate = await contract.estimateGas[method](...inputs);
    gasLimit = gasEstimate.mul(3).toBigInt();
    console.log("Gas estimate:", gasEstimate.toBigInt());
    console.log("   Gas limit:", gasLimit);
  } catch (error) {
    console.log("Default gas limit:", defaultGasLimit);
  }

  try {
    const tx = await contract[method](...inputs, {
      gasPrice: gasPrice,
      gasLimit: gasLimit,
    });
    notification.remove(load);
    console.log("Transaction hash:", tx);
    if (!tx.hash) {
      throw new Error("Transaction hash not found");
    }
    await waitForTx(selectedProvider as ethers.providers.Provider, tx);
  } catch (error) {
    console.error("Error in transaction:", error);
    throw error;
  }
}

export async function waitForTx(provider: ethers.providers.Provider, tx: any): Promise<boolean> {
  load = notification.loading("Waiting for transaction to be mined...");
  let txReceipt: ethers.providers.TransactionReceipt | null = null;
  let count = 0;

  console.log(`Waiting for TX ${tx.hash} to be mined...`);

  while (count < 3) {
    count = await tx.wait();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  txReceipt = tx;

  if (txReceipt) {
    console.log(`TX ${tx.hash} broadcasted`);
    console.log(`TX ${tx.hash} mined in block ${txReceipt.blockNumber}`);

    const isReverted = txReceipt?.status === 0;

    if (isReverted) {
      notification.remove(load);
      notification.error("Transaction failed");
    } else {
      notification.remove(load);
      notification.success("Transaction successful");
    }

    return true;
  }

  notification.remove(load);
  notification.error("Transaction receipt not found after 10 attempts");

  return false;
}

/**
 * Runs Transaction passed in to returned function showing UI feedback.
 * @param _walletClient - Optional wallet client to use. If not provided, will use the one from useWalletClient.
 * @returns function that takes in transaction function as callback, shows UI feedback for transaction and returns a promise of the transaction hash
 */
export const useNotificator = (_walletClient?: WalletClient) => {
  const walletClient = _walletClient;
  const provider = usePublicClient();
  selectedProvider = provider as ethers.providers.Provider | undefined;
  let isProcessed = false;

  const result = async (ctx: Contract, functionName: string, args: any[]) => {
    load = notification.loading("Awaiting transaction confirmation...");

    if (!walletClient) {
      notification.remove(load);
      notification.error("Cannot access account");
      console.error("⚡️ ~ file: useTransactor.tsx ~ error");
      throw new Error("Cannot access account");
    }

    if (!provider) {
      notification.remove(load);
      notification.error("Provider not available");
      console.error("⚡️ ~ file: useTransactor.tsx ~ error");
      throw new Error("Provider not available");
    }

    try {
      const gasPrice: bigint = (await provider.getGasPrice()) || BigInt(0);
      await callContractMethod(ctx, functionName, args, gasPrice);
      isProcessed = true;
      return isProcessed;
    } catch (error) {
      notification.remove(load);
      notification.error(getParsedError(error));
    }
  };

  return result;
};
