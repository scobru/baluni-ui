"use client";

import type React from "react";
import { useEffect, useState } from "react";
import useTokenList from "../hooks/useTokenList";
import baluniPoolAbi from "baluni-contracts/artifacts/contracts/pools/BaluniV1Pool.sol/BaluniV1Pool.json";
import poolPeripheryAbi from "baluni-contracts/artifacts/contracts/pools/BaluniV1PoolPeriphery.sol/BaluniV1PoolPeriphery.json";
import poolRegistryAbi from "baluni-contracts/artifacts/contracts/registry/BaluniV1PoolRegistry.sol/BaluniV1PoolRegistry.json";
import registryAbi from "baluni-contracts/artifacts/contracts/registry/BaluniV1Registry.sol/BaluniV1Registry.json";
import { INFRA, NATIVETOKENS } from "baluni/dist/api/";
import { Contract, ethers } from "ethers";
import { erc20Abi } from "viem";
import { useWalletClient } from "wagmi";
import Spinner from "~~/components/Spinner";
import { clientToSigner } from "~~/utils/ethers";
import { notification } from "~~/utils/scaffold-eth";

interface TokenBalance {
  fromTokenBalance: string;
  toTokenBalance: string;
}

interface SwapData {
  fromToken: string;
  toToken: string;
  fromAmount: string;
}

interface Token {
  address: string;
  symbol: string;
  logoURI: string;
  name: string;
}

const WETHAbi = [
  "function deposit() public payable",
  "function withdraw(uint wad) public",
  "function balanceOf(address owner) public view returns (uint256)",
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function transfer(address to, uint256 value) public returns (bool)",
  "function transferFrom(address from, address to, uint256 value) public returns (bool)",
];

const SwapBox = () => {
  const { data: signer } = useWalletClient();
  const { tokens } = useTokenList();
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([]);

  const [poolFactory, setPoolFactory] = useState<string | undefined>();
  const [poolPeriphery, setPoolPeriphery] = useState<string | undefined>();

  const [tokenBalances, setTokenBalances] = useState<TokenBalance>({
    fromTokenBalance: "0",
    toTokenBalance: "0",
  });

  const [swapData, setSwapData] = useState<SwapData>({
    fromToken: "",
    toToken: "",
    fromAmount: "",
  });
  const [swapPreview, setSwapPreview] = useState<string>("");
  const [poolExists, setPoolExists] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [toReserve, setToReserve] = useState<string>("");

  useEffect(() => {
    if (!signer) return;
    setContract();
  }, [signer]);

  useEffect(() => {
    const fetchData = async () => {
      if (!signer) return;
      setLoading(true);
      try {
        await getPools();
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setLoading(false);
    };

    fetchData();
  }, [signer, poolFactory]);

  const setContract = async () => {
    if (!signer) return;
    const registry = new Contract(INFRA[137].REGISTRY, registryAbi.abi, clientToSigner(signer as any));
    const poolFactory = await registry.getBaluniPoolRegistry();
    const poolPeriphery = await registry.getBaluniPoolPeriphery();
    setPoolFactory(poolFactory);
    setPoolPeriphery(poolPeriphery);
  };

  if (loading) {
    return <Spinner />;
  }

  const getPools = async () => {
    if (!signer || !poolFactory || !poolPeriphery) return;

    const factory = new ethers.Contract(poolFactory, poolRegistryAbi.abi, clientToSigner(signer));
    const poolAddresses = await factory.getAllPools();
    const symbols: string[] = ["USDC.e"];

    for (const poolAddress of poolAddresses) {
      const pool = new ethers.Contract(poolAddress, baluniPoolAbi.abi, clientToSigner(signer));
      const assets = await pool.getAssets();

      for (let i = 0; i < assets.length; i++) {
        const token = new ethers.Contract(assets[i], erc20Abi, clientToSigner(signer));
        const symbol = await token.symbol();
        symbols.push(symbol);
      }
    }

    const filteredTokens = tokens.filter((token: Token) => symbols.includes(token.symbol));
    console.log("Filtered Tokens:", filteredTokens);
    setFilteredTokens(filteredTokens);
  };

  const fetchTokenBalance = async (tokenAddress: string, account: string) => {
    const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, clientToSigner(signer as any));
    const balance = await tokenContract.balanceOf(account);
    const decimals = await tokenContract.decimals();
    return ethers.utils.formatUnits(balance, decimals);
  };

  const handleInputChange = async (
    e: React.ChangeEvent<HTMLSelectElement> | React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<any>>,
  ) => {
    if (!signer) return;

    const { name, value } = e.target;
    setter((prevState: any) => ({ ...prevState, [name]: value }));

    if (name === "fromToken" || name === "toToken" || name === "token") {
      const account = signer.account.address;
      if ((name === "fromToken" || name === "token") && value) {
        const balance = await fetchTokenBalance(value, account);
        setTokenBalances(prevState => ({
          ...prevState,
          fromTokenBalance: balance,
        }));
      } else if (name === "toToken" && value) {
        const balance = await fetchTokenBalance(value, account);
        setTokenBalances(prevState => ({
          ...prevState,
          toTokenBalance: balance,
        }));
      }
      checkPoolExists(value, name);
    }
  };

  const checkPoolExists = async (value: string, name: string) => {
    const fromToken = name === "fromToken" ? value : swapData.fromToken;
    const toToken = name === "toToken" ? value : swapData.toToken;
    if (!signer) return;

    if (
      (fromToken == NATIVETOKENS[137].WRAPPED && toToken == NATIVETOKENS[137].NATIVE) ||
      (fromToken == NATIVETOKENS[137].NATIVE && toToken == NATIVETOKENS[137].WRAPPED)
    ) {
      setPoolExists(true);
      return;
    }

    if (fromToken && toToken && poolFactory) {
      const factory = new ethers.Contract(poolFactory!, poolRegistryAbi.abi, clientToSigner(signer));
      const poolAddress = await factory.getPool(fromToken, toToken);
      setPoolExists(poolAddress !== ethers.constants.AddressZero);

      if (poolAddress === ethers.constants.AddressZero) return;
      const pool = new ethers.Contract(poolAddress, baluniPoolAbi.abi, clientToSigner(signer));
      const liquidity = await pool.getAssetReserve(toToken);

      if (liquidity.eq(0)) {
        notification.error("Pool has no liquidity");
      }

      setToReserve(liquidity);
    }
  };

  const previewSwap = async (fromToken: string, toToken: string, amount: string) => {
    if (!signer || !fromToken || !toToken || !amount || !poolPeriphery) return;

    if (
      (fromToken == NATIVETOKENS[137].WRAPPED && toToken == NATIVETOKENS[137].NATIVE) ||
      (fromToken == NATIVETOKENS[137].NATIVE && toToken == NATIVETOKENS[137].WRAPPED)
    ) {
      setSwapPreview(amount);
      return;
    }

    const periphery = new ethers.Contract(poolPeriphery!, poolPeripheryAbi.abi, clientToSigner(signer));
    const fromTokenContract = new ethers.Contract(fromToken, erc20Abi, clientToSigner(signer));
    const toTokenContract = new ethers.Contract(toToken, erc20Abi, clientToSigner(signer));

    const decimalsFrom = await fromTokenContract.decimals();
    const decimalsTo = await toTokenContract.decimals();

    const amountOut = await periphery.getAmountOut(fromToken, toToken, ethers.utils.parseUnits(amount, decimalsFrom));

    if (amountOut.gt(toReserve)) {
      notification.error("Insufficient liquidity in pool");
      setSwapPreview(ethers.utils.formatUnits(0, decimalsTo));
      return;
    }

    setSwapPreview(ethers.utils.formatUnits(amountOut, decimalsTo));
  };

  const handleSwap = async () => {
    const { fromToken, toToken, fromAmount } = swapData;
    if (!signer || !fromToken || !toToken || !fromAmount) return;

    if (fromToken === NATIVETOKENS[137].NATIVE && toToken === NATIVETOKENS[137].WRAPPED) {
      try {
        const token = new ethers.Contract(NATIVETOKENS[137].WRAPPED, WETHAbi, clientToSigner(signer));
        const tx = await token.deposit({ value: ethers.utils.parseUnits(fromAmount, 18) });
        await tx.wait();
        notification.success("Swap completed successfully!");
        return;
      } catch (error: any) {
        notification.error(error && error.reason ? String(error.reason) : "An error occurred while swapping tokens.");
        return;
      }
    }

    if (fromToken === NATIVETOKENS[137].WRAPPED && toToken === NATIVETOKENS[137].NATIVE) {
      try {
        const token = new ethers.Contract(NATIVETOKENS[137].WRAPPED, WETHAbi, clientToSigner(signer));
        const tx = await token.withdraw(ethers.utils.parseUnits(fromAmount, 18));
        await tx.wait();
        notification.success("Swap completed successfully!");
        return;
      } catch (error: any) {
        notification.error(error && error.reason ? String(error.reason) : "An error occurred while swapping tokens.");
        return;
      }
    }

    if (!poolPeriphery || !toReserve) return;

    const fromTokenContract = new ethers.Contract(fromToken, erc20Abi, clientToSigner(signer));
    const decimals = await fromTokenContract.decimals();
    const allowance = await fromTokenContract.allowance(signer.account.address, poolPeriphery);

    if (allowance.lt(ethers.utils.parseUnits(fromAmount, decimals))) {
      const approveTx = await fromTokenContract.approve(poolPeriphery, ethers.utils.parseUnits(fromAmount, decimals));
      await approveTx.wait();
    }

    const deadline = Math.floor(Date.now() / 1000) + 30; // 10 minutes from now
    const periphery = new ethers.Contract(poolPeriphery, poolPeripheryAbi.abi, clientToSigner(signer));

    try {
      const tx = await periphery.swapTokenForToken(
        fromToken,
        toToken,
        ethers.utils.parseUnits(fromAmount, decimals),
        0,
        signer.account.address,
        signer.account.address,
        deadline,
      );
      await tx.wait();
      notification.success("Swap completed successfully!");
    } catch (error: any) {
      notification.error(error && error.reason ? String(error.reason) : "An error occurred while swapping tokens.");
    }
  };

  const getTokenIcon = (tokenAddress: string): string => {
    const token = tokens.find((token: Token) => token.address === tokenAddress) as unknown as Token;
    return token ? token.logoURI : "Unknown Token";
  };

  return (
    <div className="card bg-base-100 shadow-xl p-6 w-full sm:w-1/2 md:w-1/3 lg:w-1/4 mx-auto">
      <h2 className="card-title text-3xl mb-8">Swap</h2>
      <div className="mb-4 mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">From Token</label>
        {NATIVETOKENS && (
          <div className="relative">
            <select
              name="fromToken"
              className="select select-bordered w-full mb-2"
              value={swapData.fromToken}
              onChange={e => handleInputChange(e, setSwapData)}
            >
              <option disabled value="">
                Select From Token
              </option>
              <option value={NATIVETOKENS[137].NATIVE}>NATIVE</option>
              <option value={NATIVETOKENS[137].WRAPPED}>WNATIVE</option>
              {filteredTokens.map((token: Token) => (
                <option key={token.address} value={token.address}>
                  {token.symbol}
                </option>
              ))}
            </select>
            {swapData.fromToken && (
              <img
                src={getTokenIcon(swapData.fromToken)}
                alt="From Token"
                className="absolute top-1/2 right-3 transform -translate-y-1/2 w-5 h-5"
              />
            )}
          </div>
        )}
        <p className="text-sm">Balance: {tokenBalances.fromTokenBalance}</p>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">To Token</label>
        <div className="relative">
          <select
            name="toToken"
            className="select select-bordered w-full mb-2"
            value={swapData.toToken}
            onChange={e => handleInputChange(e, setSwapData)}
          >
            <option disabled value="">
              Select To Token
            </option>
            <option value={NATIVETOKENS[137].NATIVE}>NATIVE</option>
            <option value={NATIVETOKENS[137].WRAPPED}>WNATIVE</option>
            {filteredTokens.map((token: Token) => (
              <option key={token.address} value={token.address}>
                {token.symbol}
              </option>
            ))}
          </select>
          {swapData.toToken && (
            <img
              src={getTokenIcon(swapData.toToken)}
              alt="To Token"
              className="absolute top-1/2 right-3 transform -translate-y-1/2 w-5 h-5"
            />
          )}
        </div>
        <p className="text-sm">Balance: {tokenBalances.toTokenBalance}</p>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
        <input
          type="text"
          name="fromAmount"
          className="input input-bordered w-full"
          placeholder="Amount"
          value={swapData.fromAmount}
          onChange={e => {
            handleInputChange(e, setSwapData);
            previewSwap(swapData.fromToken, swapData.toToken, e.target.value);
          }}
        />
      </div>
      <div className="mb-4">
        <strong>Estimated Amount Out:</strong> {swapPreview}
      </div>
      {!poolExists && (
        <div
          className="flex items-center p-4 mb-4 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800"
          role="alert"
        >
          <svg
            className="flex-shrink-0 inline w-4 h-4 me-3"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
          </svg>
          <span className="sr-only">Info</span>
          <div>
            <span className="font-medium"></span> Pool does not exist for the selected tokens.
          </div>
        </div>
      )}
      <button className="btn btn-primary w-full" onClick={handleSwap} disabled={!poolExists}>
        Swap
      </button>
    </div>
  );
};

export default SwapBox;
