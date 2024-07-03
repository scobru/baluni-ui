"use client";

import React, { useEffect, useState } from "react";
import { Contract, ethers } from "ethers";
import { useWalletClient } from "wagmi";
import { notification } from "../utils/scaffold-eth";
import Spinner from "./Spinner";
import { UnitPriceChart, ValuationChart } from "./charts/Charts";
import hyperContracts from "baluni-hypervisor-contracts/deployments/deployedContracts.json";
import uniProxyAbi from "baluni-hypervisor-contracts/artifacts/contracts/UniProxy.sol/UniProxy.json";
import HypervisorFactoryAbi from "baluni-hypervisor-contracts/artifacts/contracts/HypervisorFactory.sol/HypervisorFactory.json";
import HypervisorAbi from "baluni-hypervisor-contracts/artifacts/contracts/Hypervisor.sol/Hypervisor.json";
import { clientToSigner } from "../utils/ethers";

import useTokenList from "../hooks/useTokenList";
import { erc20Abi } from "viem";

interface HypervisorData {
  tokenA: string;
  tokenB: string;
  tokenABalance: string;
  tokenBBalance: string;
  fee: number;
  name: string;
  symbol: string;
  totalSupply: string;
  liquidity: string;
  apy: string;
  unitPrice: string;
  totalValuation: string;
  timestamp: string;
  baseLowerPrice: number;
  baseUpperPrice: number;
  limitLowerPrice: number;
  limitUpperPrice: number;
  currentPrice: number;
  formattedPrice: number;
}

const HyperPoolsBox = () => {
  const { data: signer } = useWalletClient();
  const { tokens } = useTokenList();

  const [factory, setFactory] = useState(null);
  const [hypervisors, setHypervisors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [hypervisorData, setHypervisorData] = useState<HypervisorData[]>([]);
  const [modalData, setModalData] = useState<any>(null);
  const [isModalDataModalOpen, setIsModalDataModalOpen] = useState(false);

  useEffect(() => {
    if (!signer) return;
    const init = async () => {
      const etherSigner = clientToSigner(signer);
      const factory = new ethers.Contract(
        hyperContracts[137].BaluniV1HyperFactory,
        HypervisorFactoryAbi.abi,
        etherSigner as any,
      );
      setFactory(factory);
      await loadHypervisors(factory, etherSigner);
    };
    init();
  }, [signer]);

  function getTokenSymbol(tokenAddress: string) {
    const token = (tokens as Token[]).find(token => token.address === tokenAddress) as Token | undefined;
    return token ? token.symbol : "Unknown Token";
  }

  function getTokenIcon(tokenAddress: string) {
    const token = (tokens as Token[]).find(token => token.address === tokenAddress) as Token | undefined;
    return token ? token.logoURI : "Unknown Token";
  }

  const fetchHyperPoolsData = async () => {
    try {
      const url = process.env.NEXT_PUBLIC_SERVER_URL + "/api/hyperpools-data";
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching statistics data:", error);
    }
  };

  const loadHypervisors = async (factory: Contract, etherSigner: any) => {
    try {
      setLoading(true);
      const addresses = await factory.getHypervisors();
      setHypervisors(addresses);
      const hypervisorDataPromises = addresses.map(async (address: string) => {
        const hypervisor = new ethers.Contract(address, HypervisorAbi.abi, etherSigner);
        const tokenA = await hypervisor.token0();
        const tokenB = await hypervisor.token1();
        const fee = await hypervisor.fee();
        const name = await hypervisor.name();
        const symbol = await hypervisor.symbol();
        const balances = await hypervisor.getTotalAmounts();
        const tokenAContract = new ethers.Contract(tokenA, erc20Abi, etherSigner);
        const tokenBContract = new ethers.Contract(tokenB, erc20Abi, etherSigner);
        const tokenADecimals = await tokenAContract.decimals();
        const tokenBDecimals = await tokenBContract.decimals();
        const tokenABalance = ethers.utils.formatUnits(balances[0], tokenADecimals);
        const tokenBBalance = ethers.utils.formatUnits(balances[1], tokenBDecimals);
        const totalSupply = await hypervisor.totalSupply();
        const liquidity = await hypervisor.balanceOf(signer?.account.address);
        const poolData = await fetchHyperPoolsData();
        const baseLowerPrice = poolData.baseLowerPrice;
        const baseUpperPrice = poolData.baseUpperPrice;
        const limitLowerPrice = poolData.limitLowerPrice;
        const limitUpperPrice = poolData.limitUpperPrice;
        const currentPrice = poolData.currentPrice;
        const formattedPrice = poolData.formattedPrice;
        const apy = poolData.apy;
        const unitPrice = poolData.unitPrice;
        const totalValuation = poolData.totalValuation;
        const timestamp = poolData.timestamp;

        return {
          tokenA,
          tokenB,
          tokenABalance,
          tokenBBalance,
          fee,
          name,
          symbol,
          totalSupply: ethers.utils.formatUnits(totalSupply, 18),
          liquidity: ethers.utils.formatUnits(liquidity, 18),
          apy,
          unitPrice,
          totalValuation,
          timestamp,
          baseLowerPrice,
          baseUpperPrice,
          limitLowerPrice,
          limitUpperPrice,
          currentPrice,
          formattedPrice,
        };
      });
      const resolvedHypervisorData = await Promise.all(hypervisorDataPromises);
      setHypervisorData(resolvedHypervisorData);
    } catch (error) {
      console.error("Error loading hypervisors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (hypervisorAddress: string, amount0: string | number, amount1: string | number) => {
    try {
      setLoading(true);

      const etherSigner = clientToSigner(signer);
      const uniProxy = new ethers.Contract(hyperContracts[137].BaluniV1HyperUniProxy, uniProxyAbi.abi, etherSigner);
      const hypervisor = new ethers.Contract(hypervisorAddress, HypervisorAbi.abi, etherSigner);

      const tokenAddress0 = await hypervisor.token0();
      const tokenAddress1 = await hypervisor.token1();

      const token0 = new ethers.Contract(tokenAddress0, erc20Abi, etherSigner);
      const token1 = new ethers.Contract(tokenAddress1, erc20Abi, etherSigner);

      // check allowance
      const allowance0 = await token0.allowance(signer?.account.address, uniProxy.address);

      if (allowance0 < amount0) {
        const tx = await token0.approve(uniProxy.address, amount0);
        await tx.wait();
      }

      const allowance1 = await token1.allowance(signer?.account.address, uniProxy.address);

      if (allowance1 < amount1) {
        const tx = await token1.approve(uniProxy.address, amount1);
        await tx.wait();
      }

      const tx = await uniProxy.deposit(amount0, amount1, signer?.account.address, hypervisor.address, [0, 0, 0, 0]);
      await tx.wait();
      notification.success("Deposit successful!");
    } catch (error) {
      console.error("Deposit failed:", error);
      notification.error("Deposit failed!");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (hypervisorAddress: string, shares: string) => {
    if (!signer) return;
    try {
      setLoading(true);
      const etherSigner = clientToSigner(signer);
      const hypervisor = new ethers.Contract(hypervisorAddress, HypervisorAbi.abi, etherSigner as any);
      const allowance0 = await hypervisor.allowance(signer?.account.address, hypervisor.address);

      if (allowance0 < shares) {
        const tx = await hypervisor.approve(hypervisor.address, shares);
        await tx.wait();
      }

      const tx = await hypervisor.withdraw(shares, signer?.account.address, signer?.account.address, [0, 0, 0, 0]);

      await tx.wait();
      notification.success("Withdraw successful!");
    } catch (error) {
      console.error("Withdraw failed:", error);
      notification.error("Withdraw failed!");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    setter: React.Dispatch<React.SetStateAction<any>>,
  ) => {
    const { name, value } = e.target;
    setter(prevState => ({ ...prevState, [name]: value }));
  };

  const openModal = (pool: string) => {
    const poolData = hypervisorData.find(data => data.tokenA === pool || data.tokenB === pool);
    setModalData(poolData);
    setIsModalDataModalOpen(true);
  };

  const closeModalDataModal = () => {
    setIsModalDataModalOpen(false);
    setModalData(null);
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="container mx-auto p-6 mb-8">
      <button className="button btn-base rounded-none" onClick={() => loadHypervisors(factory, clientToSigner(signer))}>
        {" "}
        <img src="https://www.svgrepo.com/download/470882/refresh.svg" alt="" className="mask mask-circle h-10 w-10" />
      </button>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr className="my-4 p-4 rounded-2xl bg-base-100 mx-auto items-center">
              <th>Assets</th>
              <th>Name</th>
              <th>TLV</th>
              <th>Liquidity</th>
              <th>Total Supply</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody className="text-xl">
            {hypervisorData.length > 0 &&
              hypervisors.map((hypervisor, index) => {
                const pool = hypervisor;
                return (
                  <tr
                    key={index}
                    className="my-4 p-4 hover:bg-info hover:text-info-content rounded-2xl bg-base-100 mx-auto items-center"
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-wrap justify-center text-3xl">
                          <img
                            src={getTokenIcon(hypervisorData[index].tokenA)}
                            alt=""
                            className="mask mask-circle h-14 w-14"
                          />
                          <img
                            src={getTokenIcon(hypervisorData[index].tokenB)}
                            alt=""
                            className="mask mask-circle h-14 w-14"
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        {hypervisorData[index]?.name && (
                          <div>
                            {/*                             <div className="font-bold">{hypervisorData[index]?.name}</div>
                             */}{" "}
                            <div className="font-semibold text-lg opacity-80">{hypervisorData[index]?.symbol}</div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div>
                        {hypervisorData[index]?.tokenABalance ? (
                          <>
                            <div>
                              {Number(hypervisorData[index]?.tokenABalance).toFixed(4)}
                              <span> {getTokenSymbol(hypervisorData[index]?.tokenA)}</span>
                            </div>
                            <div>
                              {Number(hypervisorData[index]?.tokenBBalance).toFixed(4)}
                              <span> {getTokenSymbol(hypervisorData[index]?.tokenB)}</span>
                            </div>
                          </>
                        ) : (
                          <div>0</div>
                        )}
                      </div>
                    </td>
                    <td>{Number(hypervisorData[index]?.liquidity) || "0"}</td>
                    <td>
                      <div>
                        {hypervisorData[index]?.totalSupply ? (
                          <div>{Number(hypervisorData[index]?.totalSupply)}</div>
                        ) : (
                          <div>0</div>
                        )}
                      </div>
                    </td>

                    <td className="hover:text-info-content">
                      <button
                        className="label label-text text-xl font-semibold mr-4"
                        onClick={() => {
                          openModal(pool);
                        }}
                      >
                        Details
                      </button>
                      <button
                        className="label label-text text-xl font-semibold mr-4"
                        onClick={() => handleDeposit(hypervisor, "1000000000000000000", "1000000")}
                      >
                        Deposit
                      </button>
                      <button
                        className="label label-text text-xl font-semibold"
                        onClick={() => handleWithdraw(hypervisor, "1000000000000000000")}
                      >
                        Withdraw
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
          <tfoot>
            <tr className="my-4 p-4 rounded-2xl bg-base-100 mx-auto items-center">
              <th>Assets</th>
              <th>Name</th>
              <th>TLV</th>
              <th>Liquidity</th>
              <th>Total Supply</th>
              <th>Actions</th>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default HyperPoolsBox;
