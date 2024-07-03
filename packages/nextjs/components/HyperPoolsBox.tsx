"use client";

import React, { useEffect, useState } from "react";
import { Contract, ethers } from "ethers";
import { useWalletClient } from "wagmi";
import { notification } from "../utils/scaffold-eth";
import Spinner from "./Spinner";
import { UnitPriceChart, ValuationChart, HyperPoolChart } from "./charts/Charts";
import hyperContracts from "baluni-hypervisor-contracts/deployments/deployedContracts.json";
import uniProxyAbi from "baluni-hypervisor-contracts/artifacts/contracts/UniProxy.sol/UniProxy.json";
import HypervisorFactoryAbi from "baluni-hypervisor-contracts/artifacts/contracts/HypervisorFactory.sol/HypervisorFactory.json";
import HypervisorAbi from "baluni-hypervisor-contracts/artifacts/contracts/Hypervisor.sol/Hypervisor.json";
import { clientToSigner } from "../utils/ethers";

import useTokenList from "../hooks/useTokenList";
import { erc20Abi } from "viem";

interface UnitPriceData {
  timestamp: string;
  address: string;
  unitPrice: string;
}

interface ValuationData {
  timestamp: string;
  totalValuation: string;
  address: string;
}

interface HypervisorData {
  address: string;
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
  unitPriceData: UnitPriceData[];
  valuationData: ValuationData[];
  poolData: any;
}

const HypervisorPage = () => {
  const { data: signer } = useWalletClient();
  const { tokens } = useTokenList();

  const [factory, setFactory] = useState<Contract | null>(null);
  const [hypervisors, setHypervisors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [hypervisorData, setHypervisorData] = useState<HypervisorData[]>([]);
  const [modalData, setModalData] = useState<HypervisorData>(null);
  const [isModalDataModalOpen, setIsModalDataModalOpen] = useState(false);
  const [isAddLiquidityModalOpen, setIsAddLiquidityModalOpen] = useState(false);
  const [isRemoveLiquidityModalOpen, setIsRemoveLiquidityModalOpen] = useState(false);
  const [liquidityData, setLiquidityData] = useState({ amount0: "", amount1: "", hypervisorAddress: "" });
  const [removeLiquidityData, setRemoveLiquidityData] = useState({ hypervisorAddress: "", amount: "" });

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

  const loadHypervisors = async (factory: Contract, etherSigner: any) => {
    try {
      setLoading(true);
      const addresses = await factory.getHypervisors();
      setHypervisors(addresses);

      const urlHyperPool = process.env.NEXT_PUBLIC_SERVER_URL + "/api/hyperpools-data";
      const responseHyperPool = await fetch(urlHyperPool);
      const poolData = await responseHyperPool.json();

      const urlValuation = process.env.NEXT_PUBLIC_SERVER_URL + "/api/valuation-data";
      const responseValuation = await fetch(urlValuation);
      const dataValuation = await responseValuation.json();

      const urlUnitPrice = process.env.NEXT_PUBLIC_SERVER_URL + "/api/unitPrices-data";
      const responseUnitPrice = await fetch(urlUnitPrice);
      const dataUnitPrice = await responseUnitPrice.json();

      const hypervisorDataPromises = addresses.map(async (address: string, index: number) => {
        const hypervisor = new ethers.Contract(address, HypervisorAbi.abi, etherSigner);
        const tokenA = await hypervisor.token0();
        const tokenB = await hypervisor.token1();
        const fee = await hypervisor.fee();
        const name = await hypervisor.name();
        const symbol = await hypervisor.symbol();
        const pool = await hypervisor.pool();
        const balances = await hypervisor.getTotalAmounts();
        const tokenAContract = new ethers.Contract(tokenA, erc20Abi, etherSigner);
        const tokenBContract = new ethers.Contract(tokenB, erc20Abi, etherSigner);
        const tokenADecimals = await tokenAContract.decimals();
        const tokenBDecimals = await tokenBContract.decimals();
        const tokenABalance = ethers.utils.formatUnits(balances[0], tokenADecimals);
        const tokenBBalance = ethers.utils.formatUnits(balances[1], tokenBDecimals);
        const totalSupply = await hypervisor.totalSupply();
        const liquidity = await hypervisor.balanceOf(signer?.account.address);
        const baseLowerPrice = poolData[index].baseLowerPrice;
        const baseUpperPrice = poolData[index].baseUpperPrice;
        const limitLowerPrice = poolData[index].limitLowerPrice;
        const limitUpperPrice = poolData[index].limitUpperPrice;
        const currentPrice = poolData[index].currentPrice;
        const formattedPrice = poolData[index].formattedPrice;
        const apy = poolData[index].apy;
        const unitPrice = poolData[index].unitPrice;
        const totalValuation = poolData[index].totalValuation;
        const timestamp = poolData[index].timestamp;

        console.log(pool);
        console.log(poolData);

        return {
          address: hypervisor.address,
          tokenA,
          tokenB,
          tokenABalance,
          tokenBBalance,
          fee,
          name,
          symbol,
          totalSupply: ethers.utils.formatUnits(totalSupply, 18),
          liquidity: ethers.utils.formatUnits(liquidity, 6),
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
          unitPriceData: dataUnitPrice.filter((item: UnitPriceData) => item.address === hypervisor.address),
          valuationData: dataValuation.filter((item: ValuationData) => item.address === hypervisor.address),
          poolData: poolData.filter((item: any) => item.id === pool),
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

  const handleDeposit = async (hypervisorAddress: string) => {
    const { amount0, amount1 } = liquidityData;
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

      if (allowance0.lt(ethers.utils.parseUnits(amount0, await token0.decimals()))) {
        const tx = await token0.approve(uniProxy.address, ethers.utils.parseUnits(amount0, await token0.decimals()));
        await tx.wait();
      }

      const allowance1 = await token1.allowance(signer?.account.address, uniProxy.address);

      if (allowance1.lt(ethers.utils.parseUnits(amount1, await token1.decimals()))) {
        const tx = await token1.approve(uniProxy.address, ethers.utils.parseUnits(amount1, await token1.decimals()));
        await tx.wait();
      }

      const tx = await uniProxy.deposit(
        ethers.utils.parseUnits(amount0, await token0.decimals()),
        ethers.utils.parseUnits(amount1, await token1.decimals()),
        signer?.account.address,
        hypervisor.address,
        [0, 0, 0, 0],
      );
      await tx.wait();
      notification.success("Deposit successful!");
    } catch (error) {
      console.error("Deposit failed:", error);
      notification.error("Deposit failed!");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (hypervisorAddress: string) => {
    const { amount } = removeLiquidityData;
    if (!signer) return;
    try {
      setLoading(true);
      const etherSigner = clientToSigner(signer);
      const hypervisor = new ethers.Contract(hypervisorAddress, HypervisorAbi.abi, etherSigner as any);
      const allowance0 = await hypervisor.allowance(signer?.account.address, hypervisor.address);

      if (allowance0.lt(ethers.utils.parseUnits(amount, 18))) {
        const tx = await hypervisor.approve(hypervisor.address, ethers.utils.parseUnits(amount, 18));
        await tx.wait();
      }

      const tx = await hypervisor.withdraw(
        ethers.utils.parseUnits(amount, 18),
        signer?.account.address,
        signer?.account.address,
        [0, 0, 0, 0],
      );

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

  const openModal = async (hypervisorAddress: string) => {
    const hypervisor = hypervisorData.find(data => data.address === hypervisorAddress);
    setModalData(hypervisor);
    setIsModalDataModalOpen(true);
  };

  const closeModalDataModal = () => {
    setIsModalDataModalOpen(false);
    setModalData(null);
  };

  const openAddLiquidityModal = (hypervisorAddress: string) => {
    setLiquidityData({ ...liquidityData, hypervisorAddress });
    const hypervisor = hypervisorData.find(data => data.address === hypervisorAddress);
    setModalData(hypervisor);
    setIsAddLiquidityModalOpen(true);
  };

  const closeAddLiquidityModal = () => {
    setIsAddLiquidityModalOpen(false);
  };

  const openRemoveLiquidityModal = (hypervisorAddress: string) => {
    setRemoveLiquidityData({ ...removeLiquidityData, hypervisorAddress });
    setIsRemoveLiquidityModalOpen(true);
  };

  const closeRemoveLiquidityModal = () => {
    setIsRemoveLiquidityModalOpen(false);
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="container mx-auto p-6 mb-8">
      <button className="button btn-base rounded-none" onClick={() => loadHypervisors(factory, clientToSigner(signer))}>
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
            {hypervisorData &&
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
                      <button className="label label-text text-xl font-semibold mr-4" onClick={() => openModal(pool)}>
                        Details
                      </button>
                      <button
                        className="label label-text text-xl font-semibold mr-4"
                        onClick={() => {
                          openAddLiquidityModal(hypervisor);
                        }}
                      >
                        Deposit
                      </button>
                      <button
                        className="label label-text text-xl font-semibold"
                        onClick={() => openRemoveLiquidityModal(hypervisor)}
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

      {isModalDataModalOpen &&
        modalData &&
        modalData.poolData &&
        modalData.valuationData &&
        modalData.unitPriceData && (
          <div className="p-4 shadow rounded">
            <input type="checkbox" id="hypervisor-info-modal" className="modal-toggle" />
            <div className="modal modal-open bg-blend-exclusion">
              <div className="modal-box w-11/12 max-w-5xl md:9/12 relative">
                <label
                  htmlFor="hypervisor-info-modal"
                  className="btn btn-sm btn-circle absolute right-2 top-2 text-red-500"
                  onClick={closeModalDataModal}
                >
                  ✕
                </label>
                <h2 className="text-2xl mb-4 text-blue-700">Hypervisor Info</h2>
                <p className="text-lg mb-2">
                  <strong className="text-base">Address:</strong> {modalData.tokenA} / {modalData.tokenB}
                </p>

                <p className="text-xl mb-2">
                  <strong className="text-base text-xl">Total Liquidity:</strong>{" "}
                  {Number(modalData.tokenABalance).toFixed(4)} {getTokenSymbol(modalData.tokenA)} /{" "}
                  {Number(modalData.tokenBBalance).toFixed(4)} {getTokenSymbol(modalData.tokenB)}
                </p>

                <HyperPoolChart hyperPoolData={modalData.poolData} />
                <UnitPriceChart unitPriceData={modalData.unitPriceData} />
                <ValuationChart valuationData={modalData.valuationData} />

                <p className="text-lg mb-4">
                  <strong className="text-base">APY:</strong> {Number(modalData.apy).toFixed(4)}%
                </p>
                <p className="text-lg mb-4">
                  <strong className="text-base">LP Price:</strong> {Number(modalData.unitPrice).toFixed(2)} USDC
                </p>
                <p className="text-lg mb-4">
                  <strong className="text-base">Base Lower Price:</strong> {modalData.baseLowerPrice}
                </p>
                <p className="text-lg mb-4">
                  <strong className="text-base">Base Upper Price:</strong> {modalData.baseUpperPrice}
                </p>
                <p className="text-lg mb-4">
                  <strong className="text-base">Limit Lower Price:</strong> {modalData.limitLowerPrice}
                </p>
                <p className="text-lg mb-4">
                  <strong className="text-base">Limit Upper Price:</strong> {modalData.limitUpperPrice}
                </p>
                <p className="text-lg mb-4">
                  <strong className="text-base">Current Price:</strong> {modalData.currentPrice}
                </p>

                <div className="modal-action">
                  <button className="btn" onClick={closeModalDataModal}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {isAddLiquidityModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Add Liquidity</h3>
            <div>
              <div className="mt-2">{getTokenSymbol(modalData.tokenA)}</div>
              <input
                type="text"
                name="amount0"
                className="input input-bordered w-full my-2"
                placeholder={`Amount ${getTokenSymbol(modalData.tokenA)}`}
                value={liquidityData.amount0}
                onChange={e => handleInputChange(e, setLiquidityData)}
              />
              <div className="mt-2">{getTokenSymbol(modalData.tokenB)}</div>
              <input
                type="text"
                name="amount1"
                className="input input-bordered w-full my-2"
                placeholder={`Amount ${getTokenSymbol(modalData.tokenB)}`}
                value={liquidityData.amount1}
                onChange={e => handleInputChange(e, setLiquidityData)}
              />
              <button
                className="btn btn-primary w-full my-2"
                onClick={() => handleDeposit(liquidityData.hypervisorAddress)}
              >
                Add Liquidity
              </button>
            </div>
            <div className="modal-action">
              <button className="btn" onClick={closeAddLiquidityModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isRemoveLiquidityModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Remove Liquidity</h3>
            <input
              type="text"
              name="amount"
              className="input input-bordered w-full mb-4"
              placeholder="Amount to Withdraw"
              value={removeLiquidityData.amount}
              onChange={e => handleInputChange(e, setRemoveLiquidityData)}
            />
            <button
              className="btn btn-danger w-full my-2"
              onClick={() => handleWithdraw(removeLiquidityData.hypervisorAddress)}
            >
              Withdraw
            </button>
            <div className="modal-action">
              <button className="btn" onClick={closeRemoveLiquidityModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HypervisorPage;
