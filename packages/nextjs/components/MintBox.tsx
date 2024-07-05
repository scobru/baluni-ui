"use client";

import React, { useEffect, useState } from "react";
import registryABI from "baluni-contracts/artifacts/contracts/registry/BaluniV1Registry.sol/BaluniV1Registry.json";
import { RouterABI } from "baluni/dist/api";
import { INFRA } from "baluni/dist/api/constants";
import { ethers } from "ethers";
import { erc20Abi } from "viem";
import { useWalletClient } from "wagmi";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { clientToSigner } from "~~/utils/ethers";
import { notification } from "~~/utils/scaffold-eth";
import { playSound } from "~~/utils/sounds";

const MintBox = () => {
  useScaffoldEventHistory({
    contractName: "Router",
    eventName: "Mint",
    filters: (logs: any) => {
      const amount = logs.args.value;
      const to = logs.args.user;
      if (to == signer?.account.address) {
        notification.success(`YAAAAI! You Earned ${amount} BALUNI`);
        playSound();
      }
    },
    fromBlock: BigInt(58923522),
  });

  const [amount, setAmount] = useState("");
  const [tokenBalance, setTokenBalance] = useState("0");
  const [, /* bpsFee */ setBpsFee] = useState("0");
  const [formattedUnitPrice, setFormattedUnitPrice] = useState("0");
  const [formattedTotalValuation, setFormattedTotalValuation] = useState("0");
  const [formattedShare, setFormattedShare] = useState("0");
  const [formattedYourBalance, setFormattedYourBalance] = useState("0");
  const [usdAmount, setUsdAmount] = useState("0");
  const [baluniAddress, setBaluniAddress] = useState("");
  const { data: signer } = useWalletClient();

  const [formattedTotalSupply, setFormattedTotalSupply] = useState("0");

  const useMaxBalance = async () => {
    const signerEthers = await clientToSigner(signer as any);
    const registry = new ethers.Contract(INFRA[137].REGISTRY, registryABI.abi, signerEthers);
    const routerAddress = await registry.getBaluniRouter();
    const stakingContract = new ethers.Contract(routerAddress, RouterABI.abi, signerEthers);
    setAmount(ethers.utils.formatEther(await stakingContract.balanceOf(signerEthers.getAddress())));
  };

  const handleApproveToken = async () => {
    const signerEthers = await clientToSigner(signer as any);
    const registry = new ethers.Contract(INFRA[137].REGISTRY, registryABI.abi, signerEthers);
    const routerAddress = await registry.getBaluniRouter();
    const usdcAddress = await registry.getUSDC();
    const erc20Contract = new ethers.Contract(usdcAddress, erc20Abi, signerEthers);
    const stakingContract = new ethers.Contract(routerAddress, RouterABI.abi, signerEthers);
    const decimals = await erc20Contract.decimals();
    const amountInWei = ethers.utils.parseUnits(amount, decimals);
    const tx = await erc20Contract.approve(stakingContract.address, amountInWei);
    await tx.wait();
  };

  const fetchBalance = async () => {
    const signerEthers = await clientToSigner(signer as any);
    const registry = new ethers.Contract(INFRA[137].REGISTRY, registryABI.abi, signerEthers);
    const routerAddress = await registry.getBaluniRouter();
    const erc20Contract = new ethers.Contract(routerAddress, erc20Abi, signerEthers);
    const stakingContract = new ethers.Contract(routerAddress, RouterABI.abi, signerEthers);
    const unitPrice = await stakingContract.unitPrice();
    const totalSupply = await stakingContract.totalSupply();
    const formattedTotalSupply = ethers.utils.formatEther(totalSupply);
    const formattedUnitPrice = ethers.utils.formatUnits(unitPrice, 6);
    const balance = await erc20Contract.balanceOf(await signerEthers.getAddress());
    const formattedBalance = ethers.utils.formatEther(balance);
    const share = await stakingContract.getUSDCShareValue(balance);
    const formattedShare = ethers.utils.formatUnits(share, 6);
    const totalValuation = await stakingContract.totalValuation();
    const formattedTotalValuation = ethers.utils.formatUnits(totalValuation, 18);

    setBaluniAddress(routerAddress);
    setFormattedYourBalance(formattedBalance);
    setFormattedUnitPrice(formattedUnitPrice);
    setFormattedTotalValuation(formattedTotalValuation);
    setFormattedShare(formattedShare);
    setFormattedTotalSupply(formattedTotalSupply);
    setTokenBalance(formattedBalance);
    setBpsFee("0.3");
  };

  useEffect(() => {
    if (signer) {
      fetchBalance();
    }

    const intervalId = setInterval(() => {
      if (signer) {
        fetchBalance();
      }
    }, 10000);

    return () => clearInterval(intervalId);
  }, [signer]);

  useEffect(() => {
    const calculateUsdAmount = () => {
      const usdValue = Number.parseFloat(amount) * Number.parseFloat(formattedUnitPrice);
      setUsdAmount(usdValue.toFixed(6)); // USDC has 6 decimals
    };

    if (amount && formattedUnitPrice) {
      calculateUsdAmount();
    }
  }, [amount, formattedUnitPrice]);

  const handleMint = async () => {
    const signerEthers = await clientToSigner(signer as any);
    const registry = new ethers.Contract(INFRA[137].REGISTRY, registryABI.abi, signerEthers);
    const routerAddress = await registry.getBaluniRouter();
    const stakingContract = new ethers.Contract(routerAddress, RouterABI.abi, signerEthers);
    if (!amount) return;
    await stakingContract.mintWithUSDC(ethers.utils.parseEther(amount));
    setAmount("");
  };

  const handleBurnUSDC = async () => {
    if (!signer || !signer.account || !signer.account.address) {
      console.log("Signer or signer account address is missing");
      notification.error("Signer is required for burning tokens.");
      return;
    }

    try {
      const signerEthers = clientToSigner(signer);
      const registry = new ethers.Contract(INFRA[137].REGISTRY, registryABI.abi, signerEthers);
      const routerAddress = await registry.getBaluniRouter();
      const stakingContract = new ethers.Contract(routerAddress, RouterABI.abi, signerEthers);
      const decimals = await stakingContract.decimals();
      const amountInWei = ethers.utils.parseUnits(amount, decimals);
      await stakingContract.burnUSDC(amountInWei);
      notification.success("Token burned successfully.");
    } catch (error) {
      console.error("Failed to burn token", error);
      notification.error("Failed to burn token.");
    }
  };

  const handleLiquidate = async () => {
    if (!signer || !signer.account || !signer.account.address) {
      console.log("Signer or signer account address is missing");
      notification.error("Signer is required for burning tokens.");
      return;
    }

    try {
      const signerEthers = clientToSigner(signer);
      const registry = new ethers.Contract(INFRA[137].REGISTRY, registryABI.abi, signerEthers);
      const routerAddress = await registry.getBaluniRouter();
      const stakingContract = new ethers.Contract(routerAddress, RouterABI.abi, signerEthers);
      await stakingContract.liquidateAll();
      notification.success("Token burned successfully.");
    } catch (error) {
      console.error("Failed to burn token", error);
      notification.error("Failed to burn token.");
    }
  };

  const handleBurn = async () => {
    if (!signer || !signer.account || !signer.account.address) {
      console.log("Signer or signer account address is missing");
      notification.error("Signer is required for burning tokens.");
      return;
    }

    try {
      const signerEthers = clientToSigner(signer);
      const registry = new ethers.Contract(INFRA[137].REGISTRY, registryABI.abi, signerEthers);
      const routerAddress = await registry.getBaluniRouter();
      const stakingContract = new ethers.Contract(routerAddress, RouterABI.abi, signerEthers);
      const decimals = await stakingContract.decimals();
      const amountInWei = ethers.utils.parseUnits(amount, decimals);
      await stakingContract.burnERC20(amountInWei);
      notification.success("Token burned successfully.");
    } catch (error) {
      console.error("Failed to burn token", error);
      notification.error("Failed to burn token.");
    }
  };

  return (
    <div>
      <div className="card p-6 bg-transparent flex justify-center items-center">
        <a
          href={`https://debank.com/profile/${baluniAddress}`}
          className="link link-primary text-2xl font-bold break-all"
        >
          {baluniAddress}
        </a>
      </div>
      <div className="flex flex-col md:flex-row justify-center items-start w-full md:w-2/3 mx-auto">
        <div className="card bg-base-100 border border-base-200 rounded-2xl flex flex-col justify-between p-8  my-10 w-full md:w-1/2 md:mr-2">
          <div className="text-semibold my-2">{tokenBalance} BALUNI</div>
          <div className="flex justify-center items-center w-full my-5">
            <input
              type="text"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Amount to mint"
              className="input input-primary w-full my-5"
            />
            <div onClick={useMaxBalance} className="btn btn-neutral my-2 mx-2">
              Max
            </div>
          </div>
          <div className="mb-4  text-lg">Amount in USD: ${usdAmount}</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="tooltip w-full my-2">
              <button onClick={handleMint} className="btn w-full btn-ghost text-lg my-2">
                Mint
              </button>
              <button
                onClick={handleLiquidate}
                className="btn w-full btn-ghost text-lg my-2"
                data-tip="Liquidate All ERC20 for USDC"
              >
                Liquidate
              </button>
            </div>

            <div className="tooltip w-full my-2">
              <button onClick={handleBurnUSDC} className="btn w-full btn-ghost text-md my-2">
                Burn to USDC
              </button>
              <button onClick={handleBurn} className="btn w-full btn-ghost text-md my-2">
                Burn to ERC20
              </button>
              <button
                onClick={handleApproveToken}
                disabled={amount === ""}
                className="btn w-full btn-ghost text-lg my-2"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
        <div className="card base-200 rounded-2xl flex flex-col justify-between p-4 mx-auto my-10 w-full md:w-1/2 md:ml-2">
          <div className="stat p-4">
            <div className="stat-title ">Total Value</div>
            <div className="stat-value text-lg">{Number(formattedTotalValuation).toFixed(5)} USD</div>
          </div>
          <div className="stat p-4">
            <div className="stat-title ">Total Supply</div>
            <div className="stat-value text-lg">{Number(formattedTotalSupply).toFixed(5)}</div>
          </div>
          <div className="stat p-4 ">
            <div className="stat-title">Unit Price</div>
            <div className="stat-value text-lg">{Number(formattedUnitPrice).toFixed(5)} USD</div>
          </div>
          <div className="stat p-4 ">
            <div className="stat-title ">Your Balance</div>
            <div className="stat-value text-lg">{Number(formattedYourBalance).toFixed(5)}</div>
          </div>
          <div className="stat p-4 ">
            <div className="stat-title ">Your Share</div>
            <div className="stat-value text-lg">{Number(formattedShare).toFixed(5)} USD</div>
          </div>
          <div className="stat p-4 ">
            <div className="stat-title ">Protocol Fee %</div>
            <div className="stat-value text-lg">0.3%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MintBox;
