import { Contract, ethers } from "ethers";
import { WalletClient } from "viem";
import { usePublicClient } from "wagmi";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

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
  const gasLimit = BigInt(3000000);

  try {
    const gasEstimate = await contract.estimateGas[method](...inputs);
    const gasLimit = gasEstimate.mul(3).toBigInt();
    console.log("Gas estimate:", gasEstimate.toBigInt());
    console.log("   Gas limit:", gasLimit);
  } catch (error) {
    console.log("Default gas limit:", gasLimit);
  }

  const txResponse = await contract[method](...inputs, { gasPrice, gasLimit });
  console.log("Done! Tx Hash:", txResponse.hash);

  return txResponse;
}

export async function waitForTx(provider: ethers.providers.Provider, hash: string): Promise<boolean> {
  const load = notification.loading("Waiting for transaction to be mined...");

  let txReceipt: ethers.providers.TransactionReceipt | null = null;
  let count = 0;

  while (!txReceipt && count < 10) {
    txReceipt = await provider.getTransactionReceipt(hash);
    await new Promise(resolve => setTimeout(resolve, 1000));
    count++;
  }

  if (txReceipt) {
    console.log(`TX ${hash} broadcasted`);
    console.log(`TX ${hash} mined in block ${txReceipt.blockNumber}`);

    const isReverted = txReceipt?.status == 0;

    if (isReverted) {
      notification.remove(load);
      notification.error("Transaction failed");
    } else {
      notification.remove(load);

      notification.success("Transaction successful");
    }

    return true;
  }

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

  const result = async (ctx: Contract, functionName: string, args: any[]) => {
    if (!provider) {
      console.error("Provider is null");
      notification.error("Provider not available");
      return;
    }

    const load = notification.loading("Awaiting transaction confirmation...");

    try {
      const gasPrice: bigint = (await provider.getGasPrice()) || BigInt(0);
      const tx = await callContractMethod(ctx, functionName, args, gasPrice);
      await waitForTx(provider as any, await tx?.hash);
      notification.remove(load);

      if (!walletClient) {
        notification.remove(load);
        notification.error("Cannot access account");
        console.error("⚡️ ~ file: useTransactor.tsx ~ error");
        return;
      }
    } catch (error) {
      notification.remove(load);
      notification.error(getParsedError(error));
    }
  };

  return result;
};
