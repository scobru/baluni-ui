"use client";

import React, { useEffect, useState } from "react";
import { checkAgent, createAgent } from "../hooks/baluni/createAgent";
import {
  calculateRebalanceStats,
  rebalancePortfolioOdos,
  rebalancePortfolioOdosParams,
} from "../hooks/baluni/rebalance";
import useTokenList from "../hooks/useTokenList";
import { clientToSigner } from "../utils/ethers";
import { USDC } from "baluni/dist/api/constants";
import { PrettyConsole } from "baluni/dist/api/utils/prettyConsole";
import { BigNumber, ethers } from "ethers";
import { usePublicClient, useWalletClient } from "wagmi";
import { WalletClient } from "wagmi";
import { notification } from "~~/utils/scaffold-eth";

const prettyConsole = new PrettyConsole();

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

interface RebalanceStats {
  adjustments: any[];
  totalPortfolioValue: BigNumber;
}

const RebalanceBox = () => {
  const { loading, error, tokens } = useTokenList();
  const [tokenSelections, setTokenSelections] = useState<Token[]>([]);
  const { data: signer } = useWalletClient();
  const provider = usePublicClient();
  const [rebalanceStats, setRebalanceStats] = useState<RebalanceStats>();
  const [odosPathViz, setOdosPathViz] = useState("");
  const [slippage, setSlippage] = useState("2");
  const [simulate, setSimulate] = useState(true);
  const [data, setData] = useState<Data[]>([]);
  const [haveAgent, setHaveAgent] = useState(true);

  useEffect(() => {
    if (!signer) return;
    const signerEthers = clientToSigner(signer as WalletClient);

    const doCheckAgent = async () => {
      const result = await checkAgent(signerEthers as any);
      setHaveAgent(result);
    };
    doCheckAgent();
  }, [signer]);

  const handleCreateAgent = async () => {
    const signerEthers = clientToSigner(signer as WalletClient);
    const tx = await createAgent(signerEthers as any);
    if (tx) setHaveAgent(true);
  };

  function getTokenInfoFromAddress(address: string) {
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
    });

    // Log del token trovato
    console.log("Token found:", token);

    // Restituisce il simbolo del token o undefined se non trovato
    return token ? token : undefined;
  }

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
    console.log(odosQuoteRes);

    // set image source to pathVizImage response attribute
    setOdosPathViz(odosQuoteRes.pathVizImage);
    setData([odosQuoteRes]);

    return odosQuoteRes;
  };

  const fetchTokenBalance = async (index: number, tokenAddress: string) => {
    if (!tokenAddress) {
      console.log("Token address is required");
      return;
    }

    const signerEthers = clientToSigner(signer as WalletClient);
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ["function balanceOf(address owner) view returns (uint256)", "function decimals() view returns (uint8)"],
      signerEthers,
    );
    const decimals = await tokenContract.decimals();
    const balance = await tokenContract.balanceOf(signer?.account.address);
    const formattedBalance = ethers.utils.formatUnits(balance, decimals);
    const updatedSelections = tokenSelections.map((selection, selIndex) => {
      if (index === selIndex) {
        return { ...selection, balance: formattedBalance };
      }
      return selection;
    }) as Token[];

    setTokenSelections(updatedSelections);
  };

  const addTokenSelection = () => {
    const newTokenSelection = {
      token: "", // Default or empty value for token address
      name: "", // Default or empty value for token name
      percentage: 0, // Default value for percentage
      balance: 0, // Default value for balance
      symbol: "", // Default or empty value for token symbol
      logoURI: "", // Default or empty value for token logo URI
      address: "", // Default or empty value for token address
    };
    setTokenSelections([...tokenSelections, newTokenSelection]);
  };

  const handleTokenChange = async (index: number, value: string) => {
    const newSelections = [...tokenSelections];
    newSelections[index].token = value;
    setTokenSelections(newSelections);
    fetchTokenBalance(index, value); // Chiamata a fetchTokenBalance con l'indice e il nuovo valore del token
  };

  const handlePercentageChange = (index: number, value: string) => {
    const newPercentage = Number(value);
    if (isNaN(newPercentage) || newPercentage < 0 || newPercentage > 100) {
      return; // Invalid input
    }

    const currentTotal = calculateTotalPercentage() - (tokenSelections[index].percentage || 0);
    if (currentTotal + newPercentage > 100) {
      //notification.error("Total percentage cannot exceed 100%");
      return; // Prevent the total from exceeding 100%
    }

    const newSelections = [...tokenSelections];
    newSelections[index].percentage = newPercentage;
    setTokenSelections(newSelections);
  };

  const calculateTotalPercentage = () => {
    return tokenSelections.reduce((total, selection) => total + Number(selection.percentage), 0);
  };

  const simulateRebalance = async () => {
    const totalPercentage = calculateTotalPercentage();
    if (totalPercentage !== 100) {
      notification.error("Total percentage must be exactly 100%");
      return;
    }
    const loading_n = notification.loading("Calculate Rebalance");
    const signerEthers = clientToSigner(signer as WalletClient);

    const dexWallet = {
      wallet: signerEthers as unknown as ethers.Wallet,
      walletAddress: signer?.account.address as string,
      providerGasPrice: provider.getGasPrice() as unknown as BigNumber,
      walletBalance: (await provider.getBalance({
        address: signer?.account.address as string,
      })) as unknown as BigNumber,
      walletProvider: signerEthers.provider,
    };

    const tokens = [];

    for (const selection of tokenSelections) {
      tokens.push(selection.token);
    }

    type TokenPercentages = {
      [key: string]: number;
    };

    const tokenPercentages = tokenSelections.reduce<TokenPercentages>((acc, selection) => {
      if (selection.token && selection.percentage) {
        acc[selection.token] = parseFloat((selection.percentage * 100).toFixed(2));
      }
      return acc;
    }, {});

    try {
      const stats = (await calculateRebalanceStats(
        dexWallet,
        tokens,
        tokenPercentages,
        USDC[provider.chain.id],
        dexWallet.walletProvider,
      )) as any;

      const params = (await rebalancePortfolioOdosParams(
        dexWallet,
        tokens,
        tokenPercentages,
        USDC[provider.chain.id],
        Number(slippage),
      )) as any;

      const result = await getOdosQuote(params);
      notification.remove(loading_n);

      if (result.detail) {
        notification.error(result.detail);
        setRebalanceStats(stats);

        return;
      }

      if (result == undefined) {
        notification.error("Failed");
        setRebalanceStats(stats);
        return;
      }

      notification.success("Success 🎉");
      setRebalanceStats(stats);
    } catch (error) {
      notification.remove(loading_n);

      notification.error("Failed");
      prettyConsole.error("Error calculating rebalance stats:", error);
    }
  };

  const executeRebalance = async () => {
    const totalPercentage = calculateTotalPercentage();
    if (totalPercentage !== 100) {
      notification.error("Total percentage must be exactly 100%");
      return;
    }
    const loading_n = notification.loading("Execute Rebalance");
    const signerEthers = clientToSigner(signer as WalletClient);

    const dexWallet = {
      wallet: signerEthers as unknown as ethers.Wallet,
      walletAddress: signer?.account.address as string,
      providerGasPrice: provider.getGasPrice() as unknown as BigNumber,
      walletBalance: (await provider.getBalance({
        address: signer?.account.address as string,
      })) as unknown as BigNumber,
      walletProvider: signerEthers.provider,
    };

    const tokens = [];

    for (const selection of tokenSelections) {
      tokens.push(selection.token);
    }

    type TokenPercentages = {
      [key: string]: number;
    };

    const tokenPercentages = tokenSelections.reduce<TokenPercentages>((acc, selection) => {
      if (selection.token && selection.percentage) {
        acc[selection.token] = parseFloat((selection.percentage * 100).toFixed(2));
      }
      return acc;
    }, {});

    try {
      const stats = (await rebalancePortfolioOdos(
        dexWallet,
        tokens,
        tokenPercentages,
        USDC[(provider.chain.id, slippage)],
        Number(slippage),
      )) as any;
      console.log("Rebalance Stats:", stats);
      notification.remove(loading_n);
      notification.success("Data Fetch 🎉");
      setRebalanceStats(stats);
      prettyConsole.log("Rebalance stats calculated:", stats);
    } catch (error) {
      prettyConsole.error("Error calculating rebalance stats:", error);
    }
  };

  const renderRebalanceStats = () => {
    if (!Array.isArray(rebalanceStats?.adjustments))
      return <div className="text-lg text-center text-gray-500 my-5">No data to display</div>;
    return (
      <div className="mt-4 p-4">
        <div className="text-xl font-semibold mb-4 text-left">
          Portfolio Value:{" "}
          {rebalanceStats?.totalPortfolioValue
            ? Number(ethers.utils.formatEther(rebalanceStats.totalPortfolioValue)).toFixed(3)
            : "0"}{" "}
          USD
        </div>
        {rebalanceStats?.adjustments.map((adj, index) => (
          <div key={index} className="p-4 my-4 text-base-content">
            <div className="flex items-center space-x-2">
              <img src={getTokenIcon(adj.token)} alt={adj.token} className="mask mask-circle w-10 h-10" />{" "}
              {/* Aggiunto qui */}
              <span className="text-lg font-bold">{getTokenSymbol(adj.token)}</span>
              {adj.action === "Buy" ? (
                <span className="text-green-500">🔼 Buy</span>
              ) : (
                <span className="text-red-500">🔽 Sell</span>
              )}
            </div>
            <div className="mt-2">
              <span className="text-md">{adj.differencePercentage / 100}%</span>
              <span className="ml-4 text-md">
                {Number(ethers.utils.formatEther(adj.valueToRebalance)).toFixed(3)} USD
              </span>
            </div>
          </div>
        ))}
        <h2 className="card-title">Received Token</h2>
        {data && data.length > 0 && data[0] && data[0].outTokens && data[0].outTokens.length > 0 ? (
          <ul className="list-disc list-inside ml-4 my-5">
            {data[0].outTokens.map((tokenAddress, index) => {
              const tokenInfo = getTokenInfoFromAddress(tokenAddress) as unknown as Token;
              return tokenInfo ? (
                <li key={index} className="mb-4 text-xl flex justify-start align-middle">
                  <img
                    src={tokenInfo.logoURI}
                    alt={`${tokenInfo.symbol} logo`}
                    className="mask mask-circle w-10 h-10 mx-2"
                  />
                  <span className="mx-2">
                    {Number(data[0].outValues[index]).toFixed(4)} {tokenInfo.symbol}
                  </span>
                  <span>{Number(ethers.utils.formatEther(data[0].outAmounts[index])).toFixed(4)} USD</span>
                </li>
              ) : (
                <li key={index} className="mb-4 text-xl flex justify-start align-middle">
                  <span className="mx-2">{tokenAddress}</span>
                  <span>{Number(data[0].outValues[index]).toFixed(4)} unknown token</span>
                  <span>{Number(ethers.utils.formatEther(data[0].outAmounts[index])).toFixed(4)} USD</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-gray-500">No output tokens available</p>
        )}
      </div>
    );
  };

  function getTokenSymbol(tokenAddress: string) {
    const token = (tokens as Token[]).find(token => token.address === tokenAddress) as Token | undefined;
    return token ? token.symbol : "Unknown Token";
  }

  function getTokenIcon(tokenAddress: string) {
    const token = (tokens as Token[]).find(token => token.address === tokenAddress) as Token | undefined;
    return token ? token.logoURI : "Unknown Token";
  }

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-center text-red-500">Error loading tokens</div>;

  return (
    <div className="container mx-auto p-4">
      <div>
        {!haveAgent ? (
          <div className="flex items-center justify-center ">
            <button className="btn btn-primary btn-lg" onClick={handleCreateAgent} aria-label="Create an Agent">
              Create an Agent
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 gap-4">
            <div className="card">
              <div className="card-body">
                <h2 className="card-title">Select Tokens</h2>
                {tokenSelections.map((selection, index) => (
                  <div key={index} className="card bg-base-100 mb-2 border border-primary">
                    <div className="card-body">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
                        <div className="flex items-center">
                          <label htmlFor={`token-select-${index}`} className="sr-only">
                            Select a token
                          </label>
                          <select
                            id={`token-select-${index}`}
                            className="select select-bordered w-full max-w-xs border-2 border-base-focus text-lg"
                            value={selection.token}
                            onChange={e => handleTokenChange(index, e.target.value)}
                          >
                            <option value="">Select a token</option>
                            {tokens.map((token: Token) => (
                              <option key={token.address} value={token.address} className="text-lg">
                                {token.name} ({token.symbol})
                              </option>
                            ))}
                          </select>
                        </div>
                        <label htmlFor={`token-range-${index}`} className="sr-only">
                          Percentage
                        </label>
                        <input
                          id={`token-range-${index}`}
                          className="range range-base-100 w-full max-w-xs"
                          type="range"
                          min="0"
                          max="100"
                          value={selection.percentage}
                          onChange={e => handlePercentageChange(index, e.target.value)}
                        />
                        <span>{selection.percentage}%</span>
                        <img
                          src={getTokenIcon(selection.token)}
                          alt={`Icon for ${selection.token}`}
                          className="mask mask-circle w-20 h-20 mx-2"
                        />
                      </div>
                      <div className="text-right mt-2 font-semibold">
                        <span>{selection.balance ? Number(selection.balance).toFixed(5) : "N/A"}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="my-2 mx-4 text-left items-start ">
                  <label htmlFor="slippage-range" className="sr-only">
                    Slippage
                  </label>
                  <input
                    id="slippage-range"
                    className="range range-ghost w-full max-w-xs"
                    type="range"
                    min="0"
                    max="10"
                    value={slippage}
                    onChange={e => setSlippage(e.target.value)}
                  />
                  <div className="font-semibold text-base">Slippage {slippage} %</div>
                </div>
                <div className="flex flex-wrap justify-center mt-4 gap-2">
                  <button
                    className="btn btn-ghost hover:btn-accent text-xl"
                    onClick={addTokenSelection}
                    aria-label="Add Token"
                  >
                    Add Token
                  </button>
                  <button
                    className="btn btn-ghost hover:btn-accent text-xl"
                    onClick={simulate ? simulateRebalance : executeRebalance}
                    aria-label={simulate ? "Simulate Rebalance" : "Execute Rebalance"}
                  >
                    {simulate ? "Simulate" : "Rebalance"}
                  </button>
                  <label className="label cursor-pointer">
                    <span className="label-text mx-2">Simulate</span>
                    <input
                      type="checkbox"
                      checked={simulate}
                      className="checkbox"
                      onChange={e => setSimulate(e.target.checked)}
                      aria-label="Toggle Simulate"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="card ">
              <h2 className="card-title">Rebalance Stats</h2>
              <div className="card-body bg-base-100 mb-2 rounded-2xl">{renderRebalanceStats()}</div>
              <div className="flex justify-center mt-2">
                {odosPathViz && <img src={odosPathViz} alt="Visualization of Rebalance Path" className="w-full" />}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RebalanceBox;
