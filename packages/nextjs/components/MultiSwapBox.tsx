"use client";

import React, { useEffect, useState } from "react";
import { checkAgent, createAgent } from "../hooks/baluni/createAgent";
import useTokenList from "../hooks/useTokenList";
import { clientToSigner } from "../utils/ethers";
import { INFRA, RouterABI, buildSwapOdos } from "baluni/dist/api";
import { waitForTx } from "baluni/dist/core/utils/web3/networkUtils";
import { type BigNumber, Contract, ethers } from "ethers";
import { v4 as uuidv4 } from "uuid";
import { erc20Abi } from "viem";
import { type UseClientReturnType, usePublicClient, useWalletClient } from "wagmi";
import Spinner from "~~/components/Spinner";
import { notification } from "~~/utils/scaffold-eth";

type Token = {
  name: string;
  symbol: string;
  token: string;
  address: string;
  percentage: number;
  balance: number;
  logoURI: string;
};

interface Data {
  outTokens: string[];
  outValues: string[];
  outAmounts: string[];
}

if (typeof window !== "undefined") {
  // @ts-ignore
  window.Browser = {};
}

const MultiSwapBox = () => {
  const { tokens, loading, error } = useTokenList();
  const [simulate, setSimulate] = useState(true);
  const { data: signer } = useWalletClient(); // Aggiornato per usare useWallet
  const [swaps, setSwaps] = useState([
    {
      id: uuidv4(),
      token0: "",
      token0Address: "",
      token1: "",
      token1Address: "",
      token0IconUrl: "", // Add icon URL fields
      token1IconUrl: "", // Add icon URL fields
      amount: "",
      slippage: 3,
      balance0: "N/A",
      balance1: "N/A",
      estimate: "",
      detailedPath: [],
    },
  ]);
  const [odosPathViz, setOdosPathViz] = useState("");
  const [data, setData] = useState();
  const [haveAgent, setHaveAgent] = useState(true);

  useEffect(() => {
    if (!signer) return;
    const signerEthers = clientToSigner(signer as UseClientReturnType);

    const doCheckAgent = async () => {
      const result = await checkAgent(signerEthers as any);
      setHaveAgent(result);
    };
    doCheckAgent();
  }, [signer]);

  const handleCreateAgent = async () => {
    const signerEthers = clientToSigner(signer as UseClientReturnType);
    const tx = await createAgent(signerEthers as any);
    if (tx) setHaveAgent(true);
  };

  const getOdosQuote = async (quoteRequestBody: {
    chainId?: number;
    inputTokens: any;
    outputTokens: any;
    userAddr?: string;
    slippageLimitPercent?: number;
    referralCode?: number;
    disableRFQs?: boolean;
    compact?: boolean;
  }) => {
    // make odos quote request
    const odosQuoteReq = await fetch("https://api.odos.xyz/sor/quote/v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chainId: quoteRequestBody.chainId,
        inputTokens: quoteRequestBody.inputTokens,
        outputTokens: quoteRequestBody.outputTokens,
        slippageLimitPercent: quoteRequestBody.slippageLimitPercent,
        sourceBlacklist: [],
        pathVizImage: true, // include the path viz flag set to true here
      }),
    });

    const odosQuoteRes = await odosQuoteReq.json();
    setOdosPathViz(odosQuoteRes.pathVizImage);
    setData(odosQuoteRes);
    return odosQuoteRes;
  };

  const provider = usePublicClient();

  const [outputTokens, setOutputTokens] = useState([{ tokenAddress: "", proportion: 0 }]);
  const [totalAllocation, setTotalAllocation] = useState(0);

  const publicProvider = usePublicClient();
  const providerEther = clientToSigner(publicProvider as any);
  const baluniContract = new ethers.Contract(INFRA[137].ROUTER, RouterABI.abi, providerEther);

  useEffect(() => {
    if (signer) {
      const signerEther = clientToSigner(signer as any);

      const onMint = (to: any, amount: any) => {
        if (to === signerEther.getAddress()) {
          notification.success(`Minted ${amount} tokens to your address.`);
        }
      };

      baluniContract.on("Mint", onMint);

      return () => {
        baluniContract.off("Mint", onMint);
      };
    }
  }, [signer]);

  useEffect(() => {
    setTotalAllocation(outputTokens.reduce((acc, curr) => acc + curr.proportion, 0));
  }, [outputTokens]);

  const handleOutputChange = (index: number, value: string | number, type: string) => {
    if (type === "proportion") {
      const newValue = Number(value) / 100;
      const newTotalAllocation = outputTokens.reduce((acc, curr, currIndex) => {
        if (index === currIndex) {
          return acc + newValue;
        } else {
          return acc + curr.proportion;
        }
      }, 0);

      if (newTotalAllocation > 1) {
        return;
      }
    }

    setOutputTokens(
      outputTokens.map((output, i) => {
        if (i === index) {
          return {
            ...output,
            [type]: type === "proportion" ? Number(value) / 100 : value,
          };
        }
        return output;
      }),
    );
  };

  const addOutputToken = () => {
    if (totalAllocation < 1) {
      setOutputTokens([...outputTokens, { tokenAddress: "", proportion: 0 }]);
    } else {
      notification.error("Total allocation cannot exceed 100%");
    }
  };

  const handleAmountChange = (index: number, value: string) => {
    setSwaps(
      swaps.map((swap, i) => {
        if (i === index) {
          return { ...swap, amount: value };
        }
        return swap;
      }),
    );
  };

  const fetchTokenBalance = async (index: number, tokenAddress: string, tokenField: string) => {
    if (!tokenAddress) {
      console.log("Token address is required");
      return;
    }
    if (!signer || !signer.account || !signer.account.address) {
      console.log("Signer or signer account address is missing");
      return;
    }
    try {
      const signerEthers = clientToSigner(signer);
      const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, signerEthers);
      const decimals = await tokenContract.decimals();
      const balance = await tokenContract.balanceOf(signer.account.address);
      const formattedBalance = ethers.utils.formatUnits(balance, decimals);

      setSwaps(
        swaps.map((swap, selIndex) => {
          if (index === selIndex) {
            return {
              ...swap,
              [tokenField === "token0" ? "balance0" : "balance1"]: formattedBalance,
            };
          }
          return swap;
        }),
      );
    } catch (error) {
      console.error("Failed to fetch token balance", error);
      notification.error("Failed to fetch token balance");
    }
  };

  const handleTokenChange = async (index: number, field: string, value: string) => {
    const token = tokens.find((t: { symbol: string }) => t.symbol === value) as unknown as Token;
    if (token) {
      await fetchTokenBalance(index, String(token?.address), field);

      setSwaps(currentSwaps =>
        currentSwaps.map((swap, i) => {
          if (i === index) {
            return {
              ...swap,
              [field]: value,
              [`${field}Address`]: token.address,
              [`${field}IconUrl`]: token.logoURI,
            };
          }
          return swap;
        }),
      );
    }
  };

  function getTokenIconUrl(address: string) {
    // Assicurati che l'array tokens sia definito
    if (!Array.isArray(tokens)) {
      console.error("Tokens array is not defined or is not an array");
      return undefined;
    }

    // Log dell'indirizzo passato
    console.log("Searching for address:", address);

    // Cerca il token corrispondente
    const token = tokens.find((t: any) => {
      console.log("Checking token address:", t.address);
      return t.address.toLowerCase() === address.toLowerCase();
    }) as unknown as Token;

    // Log del token trovato
    console.log("Token found:", token);

    // Restituisce il simbolo del token o undefined se non trovato
    return token ? String(token?.logoURI) : undefined;
  }

  function getAddressFromSymbol(symbol: any) {
    // Assuming `tokens` is an array of token objects with `symbol` and `address` properties
    const token = tokens.find((t: any) => t.symbol === symbol) as any;
    return token ? token.address : undefined;
  }

  // function getTokenInfoFromAddress(address: string) {
  //   // Assicurati che l'array tokens sia definito
  //   if (!Array.isArray(tokens)) {
  //     console.error("Tokens array is not defined or is not an array");
  //     return undefined;
  //   }

  //   // Log dell'indirizzo passato
  //   console.log("Searching for address:", address);

  //   // Cerca il token corrispondente
  //   const token = tokens.find((t: any) => {
  //     console.log("Checking token address:", t.address);
  //     return t.address.toLowerCase() === address.toLowerCase();
  //   });

  //   // Log del token trovato
  //   console.log("Token found:", token);

  //   // Restituisce il simbolo del token o undefined se non trovato
  //   return token ? token : undefined;
  // }

  async function prepareInputTokens(inputTokens: any[]) {
    return Promise.all(
      inputTokens.map(async input => {
        let tokenAddress = input.tokenAddress;

        // Check if the tokenAddress is actually a symbol and convert it
        if (!ethers.utils.isAddress(tokenAddress)) {
          tokenAddress = getAddressFromSymbol(tokenAddress);
          if (!tokenAddress) {
            throw new Error("Invalid token symbol or address");
          }
        }

        return {
          tokenAddress,
          amount: input.amount.toString(),
        };
      }),
    );
  }

  const executeSwap = async () => {
    if (!provider) return;
    if (totalAllocation !== 1) {
      notification.error("Total allocation must exactly be 100% to execute the swap.");
      return;
    }
    const signerEthers = clientToSigner(signer as UseClientReturnType);
    const dexWallet = {
      wallet: signerEthers as unknown as ethers.Wallet,
      walletAddress: signer?.account.address as string,
      providerGasPrice: (await provider?.getGasPrice()) as unknown as BigNumber,
      walletBalance: (await provider?.getBalance({
        address: signer?.account.address as any,
      })) as unknown as BigNumber,
      walletProvider: signerEthers.provider,
    };

    const infraRouter = INFRA[137].ROUTER;

    const router = new ethers.Contract(infraRouter, RouterABI.abi, dexWallet.wallet);

    const quoteRequestBody = {
      chainId: Number(137), // Replace with desired chainId
      inputTokens: [] as { tokenAddress: string; amount: string }[],
      outputTokens: [] as { tokenAddress: string; proportion: number }[],
      userAddr: "0x00",
      slippageLimitPercent: 1, // set your slippage limit percentage (1 = 1%),
      referralCode: 3844415834, // referral code (recommended)
      disableRFQs: true,
      compact: true,
    };

    for (let i = 0; i < swaps.length; i++) {
      const swap = swaps[i];
      const tokenContract = new Contract(swap.token0Address, erc20Abi, signerEthers.provider);
      const decimalTokenA = await tokenContract.decimals();
      const amountInWei = ethers.utils.parseUnits(String(swap.amount), decimalTokenA); // Converti l'importo in wei

      quoteRequestBody.inputTokens.push({
        tokenAddress: swap.token0, // Assumendo che 'token0Address' sia l'indirizzo del token
        amount: String(amountInWei), // Usa l'importo convertito
      });
    }

    quoteRequestBody.inputTokens = []; // Assicurati che l'array sia vuoto prima di aggiungere elementi

    for (let i = 0; i < swaps.length; i++) {
      const swap = swaps[i];
      const tokenContract = new Contract(swap.token0Address, erc20Abi, signerEthers.provider);
      const decimalTokenA = await tokenContract.decimals();
      const amountInWei = ethers.utils.parseUnits(String(swap.amount), decimalTokenA); // Converti l'importo in wei

      // Aggiungi l'input token all'array quoteRequestBody.inputTokens
      quoteRequestBody.inputTokens.push({
        tokenAddress: swap.token0Address, // Assicurati che 'token0Address' sia l'indirizzo del token
        amount: String(amountInWei), // Usa l'importo convertito
      });

      // Interrompi il ciclo dopo aver aggiunto il primo elemento, se necessario
      // break; // Decommenta questa linea se vuoi aggiungere solo il primo elemento dello swap
    }

    if (!quoteRequestBody.outputTokens) {
      quoteRequestBody.outputTokens = [];
    }

    for (let i = 0; i < outputTokens.length; i++) {
      const swap = outputTokens[i];
      quoteRequestBody.outputTokens.push({
        tokenAddress: swap.tokenAddress, // Assumendo che 'token1Address' sia l'indirizzo del token
        proportion: swap.proportion, // Assumendo che 'proportion' sia la proporzione del token
      });
    }

    const not1 = notification.loading("Swap in progress...");
    //playSound();
    try {
      const params = {
        wallet: dexWallet.wallet,
        sender: dexWallet.walletAddress,
        chainId: 137,
        inputTokens: await prepareInputTokens(quoteRequestBody.inputTokens),
        outputTokens: quoteRequestBody.outputTokens,
        slippageLimitPercent: Number(quoteRequestBody.slippageLimitPercent),
        referralCode: Number(quoteRequestBody.referralCode),
        disableRFQs: Boolean(quoteRequestBody.disableRFQs),
        compact: Boolean(quoteRequestBody.compact),
      };

      const result = await getOdosQuote(params);

      const data = await buildSwapOdos(
        params.wallet,
        params.sender,
        String(params.chainId),
        params.inputTokens,
        params.outputTokens,
        params.slippageLimitPercent,
        params.referralCode,
        params.disableRFQs,
        params.compact,
      );

      if (!simulate) {
        if (data?.Approvals.length > 0) {
          console.log("📡 Approvals");

          const approvals = data.Approvals;

          for (const approval of approvals) {
            await signerEthers.sendTransaction(approval);
          }
        }

        if (data?.ApprovalsAgent.length > 0) {
          console.log("📡 Approvalss Agent");

          /* const simulate = await router.callStatic.execute(data?.ApprovalsAgent, []);

          if (!simulate) return console.log("📡 Simulation failed");
          console.log(`📡  Simulation successful:: ${simulate}`); */

          const calldata = router.interface.encodeFunctionData("execute", [data?.ApprovalsAgent, []]);

          const tx = {
            to: router.address,
            value: 0,
            data: calldata,
          };

          const executeTx = await dexWallet.wallet.sendTransaction(tx);

          const broadcaster = await waitForTx(dexWallet.walletProvider, executeTx?.hash, dexWallet.walletAddress);
          console.log(`📡 Tx broadcasted:: ${broadcaster}`);
        }

        if (data?.Calldatas.length > 0) {
          console.log("📡 Calldatas");

          const simulate = await router.callStatic.execute(data?.Calldatas, data?.TokensReturn);

          if ((await simulate) === false) return console.log("📡 Simulation failed");

          console.log(`📡  Simulation successful:: ${simulate}`);
          if (!simulate) return console.log("📡 Simulation failed");

          const calldata = router.interface.encodeFunctionData("execute", [data.Calldatas, data.TokensReturn]);

          const tx = {
            to: router.address,
            value: 0,
            data: calldata,
          };

          await signerEthers.sendTransaction(tx);
          notification.remove(not1);
          notification.error("Swap execution Success");
        }
      }

      notification.remove(not1);

      if (result.detail) {
        notification.error(result.detail);
        return;
      }

      if (result == undefined) {
        notification.error("Failed");
        return;
      }

      notification.success("Success 🎉");
      const tokensReceivedElement = document?.getElementById("tokens_received");
      if (tokensReceivedElement) {
        tokensReceivedElement.scrollIntoView({ behavior: "smooth" });
      }
    } catch (error) {
      notification.remove(not1);
      console.error("Failed", error);
      notification.error("Failed");
    }
  };

  // const getDetailedPath = (pathAddresses: string[]) => {
  //   return pathAddresses.map((address: string) => {
  //     const checksumAddress = ethers.utils.getAddress(address);
  //     const token = tokens.find(
  //       (t: any) => t?.address && ethers.utils.getAddress(t.address) === checksumAddress,
  //     ) as unknown as Token;
  //     return {
  //       symbol: token?.symbol || "Unknown",
  //       iconUrl: token?.logoURI || "Path_to_default_icon",
  //     };
  //   });
  // };

  if (loading)
    return (
      <p>
        <Spinner />
      </p>
    );
  if (error) return <p>Error loading tokens</p>;

  return (
    <div>
      {!haveAgent ? (
        <div className="flex items-center justify-center ">
          <button className="btn btn-primary btn-lg" onClick={handleCreateAgent}>
            Create an Agent
          </button>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 md:sm:grid-cols-2 lg:sm:grid-cols-4 xl:grid-cols-4 gap-4 p-10">
            {swaps.map((swap, index) => (
              <div key={swap.id} className="p-10 mb-2 bg-base-100 rounded-box border border-primary">
                <div className="form-control">
                  <label className="label ">
                    <span className="text-base-100-content">From</span>
                  </label>
                  <div className="flex items-center">
                    {swap.token0IconUrl && (
                      <img src={swap.token0IconUrl} alt="Token 0" className="mask mask-circle w-10 h-10 mx-4" />
                    )}
                    <select
                      className="select select-bordered w-full text-lg"
                      value={swap.token0}
                      onChange={e => handleTokenChange(index, "token0", e.target.value)}
                    >
                      <option value="">Select Token</option>
                      {(tokens as { address: string; symbol: string }[]).map(token => (
                        <option key={token.address} value={token.symbol} className="text-lg">
                          {token.symbol}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-right my-2 font-semibold text-xs">
                    <span> {swap.balance0 ? Number(swap.balance0).toFixed(5) : "N/A"}</span>
                  </div>
                </div>
                <div className="form-control my-1">
                  <label className="label text-content-base-100">
                    <span className="text-base-100-content">Amount</span>
                  </label>
                  <input
                    type="number"
                    className="input input-base-100"
                    value={swap.amount}
                    onChange={e => handleAmountChange(index, e.target.value)}
                    placeholder="0.0"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex mx-auto justify-center gap-4 mt-4 ">
            <button
              className="label label-text w-fit my-4 text-xl hover:text-accent"
              onClick={() => {
                setSwaps([
                  ...swaps,
                  {
                    id: uuidv4(),
                    token0: "",
                    token0Address: "",
                    token1: "", // Add missing property
                    token1Address: "", // Add missing property
                    token0IconUrl: "",
                    token1IconUrl: "", // Add missing property
                    amount: "",
                    slippage: 0, // Add missing property
                    balance0: "N/A",
                    balance1: "", // Add missing property
                    estimate: "", // Add missing property
                    detailedPath: [], // Add missing property
                  },
                ]);
              }}
            >
              Add Input Token
            </button>
          </div>
          <div className="p-10 mb-5 bg-base-100 rounded-box my-4 ">
            <h2 className="text-xl font-bold mb-8">Output Tokens</h2>
            <div className="grid grid-cols-1 md:sm:grid-cols-2 lg:sm:grid-cols-4 xl:grid-cols-4 gap-4">
              {outputTokens.map((output, index) => (
                <div key={index} className="p-10 bg-base-200 rounded-box border border-secondary">
                  <select
                    value={output.tokenAddress}
                    onChange={e => handleOutputChange(index, e.target.value, "tokenAddress")}
                    className="select select-bordered w-full my-4  text-lg"
                  >
                    <option value="">Select Token</option>
                    {(tokens as { address: string; symbol: string }[]).map(token => (
                      <option key={token.address} value={token.address} className=" text-lg">
                        {token.symbol}
                      </option>
                    ))}
                  </select>
                  <input
                    type="range"
                    className="range range-xs my-2"
                    min="0"
                    max="100"
                    value={output.proportion * 100}
                    onChange={e => handleOutputChange(index, Number(e.target.value), "proportion")}
                    disabled={totalAllocation >= 1 && output.proportion === 0}
                  />
                  <p className="text-lg text-center">{(output.proportion * 100).toFixed(2)}%</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col justify-center items-center gap-4 my-20 p-8">
              <button
                onClick={addOutputToken}
                disabled={totalAllocation >= 1}
                className="label label-text text-xl hover:text-accent w-48 mb-10"
              >
                Add Output Token
              </button>
              <div className="flex flex-row gap-4 mt-4 text-left p-4  rounded-xl">
                <button onClick={executeSwap} className="btn  btn-primary text-xl hover:text-accent w-48">
                  {simulate ? "Simulate" : "Swap"}
                </button>
                <label className="flex items-center cursor-pointer gap-2">
                  <input
                    type="checkbox"
                    checked={simulate}
                    className="checkbox"
                    onChange={e => setSimulate(e.target.checked)}
                  />
                  <span className="label-text">Simulate</span>
                </label>
              </div>
              <div className="text-base text-gray-500 text-center mt-4">
                Total Allocation: {(totalAllocation * 100).toFixed(2)}%
              </div>
            </div>
            <h2 id="tokens_received" className="text-xl font-bold mb-8">
              Tokens Received
            </h2>
            {data && (
              <div className="p-6  bg-base-100 rounded-xl my-4  ">
                <div className="mb-4">
                  {data && (data as unknown as Data).outTokens && (data as unknown as Data).outTokens.length > 0 ? (
                    <ul className="list-disc list-inside ml-4">
                      {data &&
                        (data as unknown as Data).outTokens.map((tokenAddress, index) => (
                          <li key={index} className="mb-4 text-xl flex justify-start align-middle gap-2 ">
                            {/* <span className="font-bold">{getTokenInfoFromAddress(tokenAddress).symbol || tokenAddress}:</span> */}

                            <img
                              src={getTokenIconUrl(tokenAddress)}
                              alt="Token 0"
                              className="mask mask-circle w-10 h-10 mx-4"
                            />

                            <span className="">
                              {Number(
                                ethers.utils.formatEther((data as Data).outAmounts && (data as Data).outAmounts[index]),
                              ).toFixed(4)}
                            </span>
                            <span>
                              {Number((data as Data).outValues && (data as Data).outValues[index]).toFixed(4)} USD
                            </span>
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No output tokens available</p>
                  )}
                </div>
              </div>
            )}
            <h2 className="text-xl font-bold mb-8">Routes</h2>
            <div className="flex justify-center ">
              <img src={odosPathViz} className="w-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSwapBox;
