"use client";

import React, { useEffect, useState } from "react";
import useTokenList from "../hooks/useTokenList";
import { clientToSigner } from "../utils/ethers";
import { BigNumber, ethers } from "ethers";
import { createWalletClient, custom } from "viem";
import { polygon } from "viem/chains";
import { usePublicClient, useWalletClient } from "wagmi";
import { USDC } from "~~/baluni/config";
import { rebalancePortfolio } from "~~/baluni/uniswap/rebalance";
import { DexWallet } from "~~/baluni/utils/dexWallet";
import { PrettyConsole } from "~~/baluni/utils/prettyConsole";

const prettyConsole = new PrettyConsole();

const TokenSelector = () => {
  const { loading, error, tokens } = useTokenList();
  const [tokenSelections, setTokenSelections] = useState([]);
  const { data: signer } = useWalletClient();
  const provider = usePublicClient();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const handleNewLog = log => {
      setLogs(prevLogs => [...prevLogs, log]);
    };

    prettyConsole.subscribe(handleNewLog);

    return () => {
      prettyConsole.unsubscribe(handleNewLog);
      prettyConsole.clearHistory();
    };
  }, [logs]);

  const addTokenSelection = () => {
    setTokenSelections([...tokenSelections, { token: "", percentage: "" }]);
  };

  const handleTokenChange = (index, value) => {
    const newSelections = [...tokenSelections];
    newSelections[index].token = value;
    setTokenSelections(newSelections);
  };

  const handlePercentageChange = (index, value) => {
    const newSelections = [...tokenSelections];
    newSelections[index].percentage = value;
    setTokenSelections(newSelections);
  };

  const handleRebalance = async () => {
    const signerEthers = clientToSigner(signer);
    console.log(signerEthers);
    const dexWallet: DexWallet = {
      wallet: signerEthers as unknown as ethers.Wallet,
      walletAddress: (await signer?.account.address) as string,
      providerGasPrice: (await provider.getGasPrice()) as BigNumber,
      walletBalance: (await provider.getBalance({
        address: signer?.account.address as string,
      })) as unknown as BigNumber,
      walletProvier: signer as any,
    };
    console.log("DexWallet", dexWallet);

    const tokens = [];

    for (const selection of tokenSelections) {
      tokens.push(selection.token);
    }

    const tokenPercentages = tokenSelections.reduce((acc, selection) => {
      if (selection.token && selection.percentage) {
        acc[selection.token] = parseFloat(selection.percentage);
      }
      return acc;
    }, {});

    await rebalancePortfolio(dexWallet, tokens, tokenPercentages, USDC);

    // Logica per il rebalance
    console.log("Rebalancing with selections:", tokenSelections);
    // Qui dovresti interagire con il tuo smart contract
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading tokens</div>;

  return (
    <div>
      {tokenSelections.map((selection, index) => (
        <div key={index}>
          <select value={selection.token} onChange={e => handleTokenChange(index, e.target.value)}>
            {tokens.map(token => (
              <option key={token.address} value={token.address}>
                {token.name} ({token.symbol})
              </option>
            ))}
          </select>
          <input
            type="number"
            value={selection.percentage}
            onChange={e => handlePercentageChange(index, e.target.value)}
            placeholder="Percentage"
          />
        </div>
      ))}
      <button onClick={addTokenSelection}>Add Token</button>
      <button onClick={handleRebalance}>Rebalance</button>
      <div>
        {logs.map((log, index) => (
          <div key={index}>
            <strong>{log.type}:</strong> {JSON.stringify(log.message)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TokenSelector;
