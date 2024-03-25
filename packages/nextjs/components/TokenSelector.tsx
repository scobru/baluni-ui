"use client";

import React, { useEffect, useRef, useState } from "react";
import { executeRebalance } from "../../../../baluni/dist/strategies/rebalance-yearn/batch/rebalance-yearn";
import { updateConfig } from "../../../../baluni/dist/ui/updateConfig";
//import { calculateRebalanceStats, rebalancePortfolio } from "../../../../baluni/src";
import useTokenList from "../hooks/useTokenList";
import { clientToSigner } from "../utils/ethers";
import { BigNumber, Wallet, ethers } from "ethers";
import { usePublicClient, useWalletClient } from "wagmi";
import { WalletClient } from "wagmi";
import { notification } from "~~/utils/scaffold-eth";

/* eslint-disable @next/next/no-img-element */

type Token = {
  name: string;
  symbol: string;
  token: string;
  address: string;
  percentage: number;
  balance: number;
  logoURI: string;
  strategy: string;
  boosted: boolean;
  isInYearnList: boolean;
};

const TokenSelector = () => {
  const { loading, error, tokens } = useTokenList();
  const [tokenSelections, setTokenSelections] = useState<Token[]>([]);
  const { data: signer } = useWalletClient();
  const [yearnEnabled, setYearnEnabled] = useState(false);
  const [technicalAnalysisEnabled, setTechnicalAnalysisEnabled] = useState(false);
  const [trendFollowingEnabled, setTrendFollowingEnabled] = useState(false);
  const [loading_n, setLoading_n] = useState<any>(null); // [1
  const [started, setStarted] = useState(false);
  const [pk, setPk] = useState<string>("");
  const [newConfig, setNewConfig] = useState<any>();
  const logDiv = useRef(null);

  const provider = usePublicClient();

  const [logMessages, setLogMessages] = useState<JSX.Element[]>([]);

  useEffect(() => {
    const originalConsoleLog = console.log;
    console.log = function (message) {
      originalConsoleLog(message);
      setLogMessages(prevMessages => [
        ...prevMessages,
        <>
          {message}
          <br />
        </>,
      ]);
    };

    return () => {
      console.log = originalConsoleLog;
    };
  }, []);

  useEffect(() => {
    if (logDiv.current) {
      (logDiv.current as HTMLElement).scrollTop = (logDiv.current as HTMLElement).scrollHeight;
    }
  }, [logMessages]);

  const fetchTokenBalance = async (index: number, tokenAddress: string) => {
    console.log("Fetch Balances", index, tokenAddress);
    if (!tokenAddress) {
      console.log("Token address is required");
      return;
    }

    const signerEthers = clientToSigner(signer as WalletClient);
    const _signer = new Wallet(pk, signerEthers.provider);

    const tokenContract = new ethers.Contract(
      tokenAddress,
      [
        "function balanceOf(address owner) view returns (uint256)",
        "function decimals() view returns (uint8)",
        "function symbol() view returns (string)",
      ],
      _signer,
    );
    const decimals = await tokenContract.decimals();
    const balance = await tokenContract.balanceOf(_signer.address);
    // Convert the balance to a human-readable format, taking into account the token's decimals
    const formattedBalance = ethers.utils.formatUnits(balance, decimals);
    const symbol = await tokenContract.symbol();

    // Update the state with the fetched balance
    const updatedSelections = tokenSelections.map((selection, selIndex) => {
      if (index === selIndex) {
        return { ...selection, balance: formattedBalance, symbol: symbol };
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
      strategy: "multi", // valore di default
      boosted: false, // valore di default
      isInYearnList: false, // nuova proprietà per controllare se il token è nella lista di Yearn
    };
    setTokenSelections([...tokenSelections, newTokenSelection]); // Add new selection to the array
  };

  const handleTokenChange = async (index: number, value: string) => {
    const newSelections = [...tokenSelections];
    const token = tokens.find(token => token.address === value);
    if (token) {
      newSelections[index].token = value;
      newSelections[index].symbol = getTokenSymbol(value);
      if (getTokenSymbol(value) === "USDC.e") {
        newSelections[index].symbol = "USDC";
      }
      newSelections[index].isInYearnList = await isTokenSymbolInList(getTokenSymbol(value));
      setTokenSelections(newSelections);
    }
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

  const _executeRebalance = async () => {
    const totalPercentage = calculateTotalPercentage();

    if (totalPercentage !== 100) {
      notification.error("Total percentage must be exactly 100%");
      return; // Prevent rebalancing if the total percentage is not exactly 100%
    }

    setLoading_n(notification.loading("Execute Rebalance"));
    const tokens = [];

    for (const selection of tokenSelections) {
      tokens.push(selection.symbol);
    }

    type TokenPercentages = {
      [key: string]: number;
    };

    const tokenPercentages = tokenSelections.reduce<TokenPercentages>((acc, selection) => {
      if (selection.token && selection.percentage) {
        // Ensure that token is a string and percentage is a number, then assign
        acc[selection.symbol] = parseFloat((selection.percentage * 100).toFixed(2)); // Use toFixed(2) if you want to keep only two decimal places
      }
      return acc;
    }, {});

    const yearnVaults = tokenSelections.reduce((acc, token) => {
      if (token.isInYearnList) {
        acc[137] = acc[137] || {};
        acc[137][token.symbol] = { strategy: token.strategy, boosted: token.boosted };
      }
      return acc;
    }, {});

    const newConfig = await updateConfig(
      tokens,
      tokenPercentages,
      provider.chain.id,
      yearnEnabled,
      yearnVaults,
      50,
      trendFollowingEnabled,
      technicalAnalysisEnabled,
    );

    console.log(JSON.stringify(newConfig));
    executeRebalance(newConfig, false, pk);

    setNewConfig(newConfig);
    setStarted(true);

    const intervalId = setInterval(async () => {
      try {
        executeRebalance(newConfig, false, pk);
        notification.remove(loading_n);
        notification.success("Data Fetch 🎉");
      } catch (error) {
        console.error("Error calculating rebalance stats:", error);
      }
    }, 5 * 60 * 1000); // 5 minutes in milliseconds

    // Clear interval on component unmount
    return () => clearInterval(intervalId);
  };

  function getTokenSymbol(tokenAddress: string) {
    const token = (tokens as Token[]).find(token => token.address === tokenAddress) as Token | undefined;
    return token ? token.symbol : "Unknown Token";
  }

  async function getTokenSymbolFromYearn() {
    const response = await fetch("https://baluni-api.scobrudot.dev/137/yearn-v3/vaults/");
    const data = await response.json();
    return data.map((item: { tokenSymbol: any }) => item.tokenSymbol);
  }

  // Funzione per verificare se un simbolo di token è incluso nella lista
  async function isTokenSymbolInList(symbol: string) {
    if (symbol === "USDC.e") {
      symbol = "USDC";
    }

    const tokenSymbols = await getTokenSymbolFromYearn();
    return tokenSymbols.includes(symbol);
  }

  const handleStrategyChange = (index: number, strategy: string) => {
    const updatedSelections = [...tokenSelections];
    updatedSelections[index].strategy = strategy;
    setTokenSelections(updatedSelections);
  };

  const handleBoostedChange = (index: number, boosted: boolean) => {
    const updatedSelections = [...tokenSelections];
    updatedSelections[index].boosted = boosted;
    setTokenSelections(updatedSelections);
  };

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-center text-red-500">Error loading tokens</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="card p-4 text-center text-2xl font-semibold mb-5 bg-base-200">
        Started: {started ? "Yes" : "No"}
      </div>
      <div>
        <label className="block text-lg font-semibold">Private Key</label>
        <input
          type="password"
          className="input input-bordered w-full my-5"
          value={pk}
          onChange={e => setPk(e.target.value)}
          placeholder="Enter your private key"
        />
      </div>
      <div className="card bg-base-100 shadow-md border border-secondary shadow-neutral p-5">
        <div className="flex-row ">
          <input
            type="checkbox"
            defaultChecked
            className="checkbox mx-2"
            onChange={e => setYearnEnabled(e.target.checked)}
          />
          Yearn Enabled
        </div>
        <div className="flex-row">
          <input
            type="checkbox"
            defaultChecked
            className="checkbox mx-2"
            onChange={e => setTechnicalAnalysisEnabled(e.target.checked)}
          />
          TA Enabled
        </div>
        <div className="flex-row ">
          <input
            type="checkbox"
            defaultChecked
            className="checkbox mx-2"
            onChange={e => setTrendFollowingEnabled(e.target.checked)}
          />
          Trend Following Enabled
        </div>
      </div>
      <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 gap-4 mt-4">
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
                  {selection.isInYearnList && yearnEnabled && (
                    <>
                      <select
                        className="select select-bordered"
                        value={selection.strategy}
                        onChange={e => handleStrategyChange(index, e.target.value)}
                      >
                        <option value="single">Single</option>
                        <option value="multi">Multi</option>
                      </select>
                      <label className="label cursor-pointer">
                        <span className="label-text">Boosted</span>
                        <input
                          type="checkbox"
                          className="toggle"
                          checked={selection.boosted}
                          onChange={e => handleBoostedChange(index, e.target.checked)}
                        />
                      </label>
                    </>
                  )}
                </div>
              </div>
            ))}
            <div className="flex flex-wrap justify-center mt-4 gap-2">
              <button className="btn btn-primary" onClick={addTokenSelection}>
                Add Token
              </button>
              {/*  <button className="btn btn-secondary" onClick={handleRebalance}>
                Simulate
              </button> */}
              <button className="btn btn-accent" onClick={_executeRebalance}>
                Rebalance
              </button>
            </div>
          </div>
        </div>

        {/* <div className="card bg-base-100 shadow-md border border-secondary shadow-neutral">
          <div className="card-body">
            <h2 className="card-title">Rebalance Stats</h2>
            {renderRebalanceStats()}
          </div>
        </div> */}

        <div className="card bg-base-100 shadow-md border border-secondary shadow-neutral">
          <div className="card-body">
            <div ref={logDiv} className="overflow-y-scroll h-screen font-mono">
              {logMessages.map((message, index) => (
                <div key={index}>{message}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenSelector;
