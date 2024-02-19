"use client";

import React, { useState } from "react";
import useTokenList from "../hooks/useTokenList";
import { clientToSigner } from "../utils/ethers";
//import { JsonRpcProvider } from "@ethersproject/providers";
import { USDC } from "baluni/dist/config";
import { calculateRebalanceStats, rebalancePortfolio } from "baluni/dist/ui/rebalanceSimple";
import { PrettyConsole } from "baluni/dist/utils/prettyConsole";
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

interface RebalanceStats {
  adjustments: any[];
  totalPortfolioValue: BigNumber;
}

const TokenSelector = () => {
  const { loading, error, tokens } = useTokenList();
  const [tokenSelections, setTokenSelections] = useState<Token[]>([]);
  const { data: signer } = useWalletClient();
  const provider = usePublicClient();
  const [rebalanceStats, setRebalanceStats] = useState<RebalanceStats>();

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
    // Convert the balance to a human-readable format, taking into account the token's decimals
    const formattedBalance = ethers.utils.formatUnits(balance, decimals);

    // Update the state with the fetched balance
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
    setTokenSelections([...tokenSelections, newTokenSelection]); // Add new selection to the array
  };

  const handleTokenChange = (index: number, value: string) => {
    const newSelections = [...tokenSelections];
    newSelections[index].token = value;
    setTokenSelections(newSelections);
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

  const handleRebalance = async () => {
    const totalPercentage = calculateTotalPercentage();
    if (totalPercentage !== 100) {
      notification.error("Total percentage must be exactly 100%");
      return; // Prevent rebalancing if the total percentage is not exactly 100%
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

    // Define a type for the accumulator object in your reduce function
    type TokenPercentages = {
      [key: string]: number;
    };

    const tokenPercentages = tokenSelections.reduce<TokenPercentages>((acc, selection) => {
      if (selection.token && selection.percentage) {
        // Ensure that token is a string and percentage is a number, then assign
        acc[selection.token] = parseFloat((selection.percentage * 100).toFixed(2)); // Use toFixed(2) if you want to keep only two decimal places
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
      console.log("Rebalance Stats:", stats);
      notification.remove(loading_n);
      notification.success("Data Fetch 🎉");
      setRebalanceStats(stats);
      prettyConsole.log("Rebalance stats calculated:", stats);
    } catch (error) {
      prettyConsole.error("Error calculating rebalance stats:", error);
    }
  };

  const executeRebalance = async () => {
    const totalPercentage = calculateTotalPercentage();
    if (totalPercentage !== 100) {
      notification.error("Total percentage must be exactly 100%");
      return; // Prevent rebalancing if the total percentage is not exactly 100%
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
        // Ensure that token is a string and percentage is a number, then assign
        acc[selection.token] = parseFloat((selection.percentage * 100).toFixed(2)); // Use toFixed(2) if you want to keep only two decimal places
      }
      return acc;
    }, {});

    try {
      const stats = (await rebalancePortfolio(
        dexWallet,
        tokens,
        tokenPercentages,
        USDC[provider.chain.id],
        dexWallet.walletProvider,
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
      <div className="mt-4 p-4 rounded-lg shadow-lg ">
        <div className="text-xl font-semibold mb-4">
          <strong>Total Portfolio Value (in USD):</strong>{" "}
          {rebalanceStats?.totalPortfolioValue
            ? Number(ethers.utils.formatEther(rebalanceStats.totalPortfolioValue)).toFixed(3)
            : "0"}{" "}
        </div>
        {rebalanceStats?.adjustments.map((adj, index) => (
          <div key={index} className="p-4 my-4 border-b last:border-b-0 bg-base-300 rounded-md text-base-content">
            <div className="flex items-center space-x-2">
              <img src={getTokenIcon(adj.token)} alt={adj.token} className="w-6 h-6" /> {/* Aggiunto qui */}
              <span className="text-lg font-bold">{getTokenSymbol(adj.token)}</span>
              {adj.action === "Buy" ? (
                <span className="text-green-500">🔼 Buy</span>
              ) : (
                <span className="text-red-500">🔽 Sell</span>
              )}
            </div>
            <div className="mt-2">
              <span className="text-md">
                <strong>Difference:</strong> {adj.differencePercentage / 100}%
              </span>
              <span className="ml-4 text-md">
                <strong>Value to Rebalance (USD):</strong>{" "}
                {Number(ethers.utils.formatEther(adj.valueToRebalance)).toFixed(3)}
              </span>
            </div>
          </div>
        ))}
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
      <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 gap-4">
        <div className="card bg-base-100 shadow-md border border-secondary shadow-neutral">
          <div className="card-body">
            <h2 className="card-title">Select Tokens</h2>
            {tokenSelections.map((selection, index) => (
              <div
                key={index}
                className="card bg-base-300 shadow-sm shadow-neutral mb-2 border-base-focus border-opacity-30"
              >
                <div className="card-body">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
                    <select
                      className="select select-bordered w-full max-w-xs border-2 border-base-focus"
                      value={selection.token}
                      onChange={e => handleTokenChange(index, e.target.value)}
                    >
                      <option value="">Select a token</option>
                      {tokens.map((token: Token) => (
                        <option key={token.address} value={token.address}>
                          {token.name} ({token.symbol})
                        </option>
                      ))}
                    </select>
                    <input
                      className="range range-primary w-full max-w-xs"
                      type="range"
                      min="0"
                      max="100"
                      value={selection.percentage}
                      onChange={e => handlePercentageChange(index, e.target.value)}
                    />
                    <span>{selection.percentage}%</span>
                    <button onClick={() => fetchTokenBalance(index, selection.token)} className="btn btn-primary">
                      Fetch Balance
                    </button>
                  </div>
                  <div className="text-right mt-2 font-semibold">
                    <span>{selection.balance ? selection.balance : "N/A"}</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap justify-center mt-4 gap-2">
              <button className="btn btn-primary" onClick={addTokenSelection}>
                Add Token
              </button>
              <button className="btn btn-secondary" onClick={handleRebalance}>
                Simulate
              </button>
              <button className="btn btn-accent" onClick={executeRebalance}>
                Rebalance
              </button>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md border border-secondary shadow-neutral">
          <div className="card-body">
            <h2 className="card-title">Rebalance Stats</h2>
            {renderRebalanceStats()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenSelector;
