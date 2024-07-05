"use client";

import type React from "react";
import { useEffect, useState } from "react";
import useTokenList from "../hooks/useTokenList";
import { UnitPriceChart, ValuationChart } from "./charts/Charts";
import poolZapAbi from "baluni-contracts/artifacts/contracts/managers/BaluniV1PoolZap.sol/BaluniV1PoolZap.json";
import baluniPoolAbi from "baluni-contracts/artifacts/contracts/pools/BaluniV1Pool.sol/BaluniV1Pool.json";
import poolRegistryAbi from "baluni-contracts/artifacts/contracts/registry/BaluniV1PoolRegistry.sol/BaluniV1PoolRegistry.json";
import registryAbi from "baluni-contracts/artifacts/contracts/registry/BaluniV1Registry.sol/BaluniV1Registry.json";
import { INFRA } from "baluni/dist/api/";
import { Contract, ethers } from "ethers";
import { erc20Abi } from "viem";
import { useWalletClient } from "wagmi";
import Spinner from "~~/components/Spinner";
import { clientToSigner } from "~~/utils/ethers";
import { notification } from "~~/utils/scaffold-eth";

interface DeviationData {
  symbol: string;
  direction: boolean;
  deviation: string;
  targetWeight: string;
  currentWeight: string;
  slippage: string;
}

interface LiquidityData {
  amounts: string[];
  tokens: string[];
  poolAddress: string;
}

interface RemoveLiquidityData {
  poolAddress: string;
  amount: string;
}

interface Token {
  address: string;
  symbol: string;
  logoURI: string;
}

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

interface StatisticsData {
  address: string;
  unitPrice: { daily: number };
  valuation: { daily: number };
}

const PoolsBox = () => {
  const { data: signer } = useWalletClient();
  const { tokens } = useTokenList();
  const [balances, setBalances] = useState<any[]>([]);
  const [unitPriceData, setUnitPriceData] = useState<UnitPriceData[]>([]);
  const [valuationData, setValuationData] = useState<ValuationData[]>([]);
  const [statisticsData, setStatisticsData] = useState<StatisticsData[]>([]);
  const [isAddLiquidityModalOpen, setIsAddLiquidityModalOpen] = useState(false);
  const [isRemoveLiquidityModalOpen, setIsRemoveLiquidityModalOpen] = useState(false);
  const [isModalDataModalOpen, setIsModalDataModalOpen] = useState(false);
  const [customToken, setCustomToken] = useState<string | undefined>();
  const [customAmount, setCustomAmount] = useState<string | undefined>();
  const [tokenBalance, setTokenBalance] = useState<string>("");

  const openModalDataModal = () => setIsModalDataModalOpen(true);
  const closeModalDataModal = () => setIsModalDataModalOpen(false);

  const openAddLiquidityModal = () => setIsAddLiquidityModalOpen(true);
  const closeAddLiquidityModal = () => setIsAddLiquidityModalOpen(false);

  const openRemoveLiquidityModal = () => setIsRemoveLiquidityModalOpen(true);
  const closeRemoveLiquidityModal = () => setIsRemoveLiquidityModalOpen(false);

  const fetchStatisticsData = async () => {
    try {
      const url = process.env.NEXT_PUBLIC_SERVER_URL + "/api/statistics";
      const response = await fetch(url);
      const data = await response.json();
      setStatisticsData(data);
    } catch (error) {
      console.error("Error fetching statistics data:", error);
    }
  };

  const fetchValuationData = async (poolAddress: string) => {
    try {
      const url = process.env.NEXT_PUBLIC_SERVER_URL + "/api/unitPrices-data";
      const response = await fetch(url);
      const data = await response.json();
      // filter data when address == poolAddress
      const filteredData = data.filter((item: UnitPriceData) => item.address === poolAddress);
      setUnitPriceData(filteredData);
    } catch (error) {
      console.error("Error fetching valuation data:", error);
    }

    try {
      const url = process.env.NEXT_PUBLIC_SERVER_URL + "/api/valuation-data";

      const response = await fetch(url);
      const data = await response.json();
      // filter data when address == poolAddress
      const filteredData = data.filter((item: ValuationData) => item.address === poolAddress);
      setValuationData(filteredData);
    } catch (error) {
      console.error("Error fetching valuation data:", error);
    }
  };

  const [poolFactory, setPoolFactory] = useState<string | undefined>();
  const [poolPeriphery, setPoolPeriphery] = useState<string | undefined>();
  const [poolZap, setPoolZap] = useState<string | undefined>();
  const [pools, setPools] = useState<string[]>([]);
  const [poolSymbols, setPoolSymbols] = useState<{ [key: string]: string }>({});
  const [poolData, setPoolData] = useState<any>({});
  const [liquidityBalances, setLiquidityBalances] = useState<{
    [key: string]: string;
  }>({});
  const [tlvs, setTlvs] = useState<{ [key: string]: string }>({});
  const [deviations, setDeviations] = useState<{
    [key: string]: DeviationData[];
  }>({});
  const [liquidityData, setLiquidityData] = useState<LiquidityData>({
    amounts: [],
    tokens: [],
    poolAddress: "",
  });
  const [removeLiquidityData, setRemoveLiquidityData] = useState<RemoveLiquidityData>({
    poolAddress: "",
    amount: "",
  });
  const [modalData, setModalData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

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
        await fetchStatisticsData();
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setLoading(false);
    };

    fetchData();
  }, [signer, poolFactory]);

  const zapIn = async (poolAddress: string, tokenAddress: string, amount: string) => {
    if (!signer || !poolZap) return;
    const zapCtx = new Contract(poolZap, poolZapAbi.abi, clientToSigner(signer as any));

    let token: any;
    let decimals: any;

    console.log(poolAddress, tokenAddress, amount);

    if (tokenAddress == ethers.constants.AddressZero || tokenAddress == "0x0000000000000000000000000000000000001010") {
      decimals = 18;

      const tx = await zapCtx.zapIn(
        poolAddress,
        ethers.constants.AddressZero,
        ethers.utils.parseUnits(amount, decimals),
        0,
        signer.account.address,
        {
          value: ethers.utils.parseUnits(amount, decimals),
        },
      );

      await tx.wait();
    } else {
      token = new Contract(tokenAddress, erc20Abi, clientToSigner(signer as any));
      decimals = await token.decimals();

      const allowance = await token.allowance(signer.account.address, poolZap);

      if (allowance.lt(ethers.utils.parseUnits(amount, decimals))) {
        const approveTx = await token.approve(poolZap, ethers.utils.parseUnits(amount, decimals));
        await approveTx.wait();

        const tx = await zapCtx.zapIn(
          poolAddress,
          tokenAddress,
          ethers.utils.parseUnits(amount, decimals),
          0,
          signer.account.address,
        );
        await tx.wait();
      } else {
        const tx = await zapCtx.zapIn(
          poolAddress,
          tokenAddress,
          ethers.utils.parseUnits(amount, decimals),
          0,
          signer.account.address,
        );
        await tx.wait();
      }
    }

    notification.success("Zap in successful!");
  };

  const zapOut = async (poolAddress: string, tokenAddress: string, amount: string) => {
    if (!signer || !poolZap) return;
    const zapCtx = new Contract(poolZap, poolZapAbi.abi, clientToSigner(signer as any));
    const token = new Contract(poolAddress, erc20Abi, clientToSigner(signer as any));
    const decimals = await token.decimals();
    console.log(decimals);
    console.log(amount);

    const allowance = await token.allowance(signer.account.address, poolZap);
    const parsedAmount = ethers.utils.parseUnits(amount, decimals);
    console.log(parsedAmount, poolZap, decimals);
    if (allowance.lt(parsedAmount)) {
      const approveTx = await token.approve(poolZap, parsedAmount);

      await approveTx.wait();

      const tx = await zapCtx.zapOut(poolAddress, parsedAmount, tokenAddress, 0, signer.account.address);
      await tx.wait();
    } else {
      const tx = await zapCtx.zapOut(poolAddress, parsedAmount, tokenAddress, 0, signer.account.address);
      await tx.wait();
    }

    notification.success("Zap out successful!");
  };

  const fetchData = async () => {
    if (!signer) return;
    setLoading(true);
    try {
      await getPools();
      await fetchStatisticsData();
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const setContract = async () => {
    const registry = new Contract(INFRA[137].REGISTRY, registryAbi.abi, clientToSigner(signer as any));
    const poolFactory = await registry.getBaluniPoolRegistry();
    const poolZap = await registry.getBaluniPoolZap();
    const poolPeriphery = await registry.getBaluniPoolPeriphery();
    setPoolFactory(poolFactory);
    setPoolPeriphery(poolPeriphery);
    setPoolZap(poolZap);
  };

  if (loading) {
    return <Spinner />;
  }

  const getPools = async () => {
    if (!signer || !poolFactory || !poolPeriphery) return;
    const factory = new ethers.Contract(poolFactory, poolRegistryAbi.abi, clientToSigner(signer));
    const poolAddresses = await factory.getAllPools();
    setPools(poolAddresses);

    const balances: { [key: string]: string } = {};
    const symbols: { [key: string]: string } = {};
    const deviationsData: { [key: string]: DeviationData[] } = {};
    const tlvs: { [key: string]: string } = {};

    for (const poolAddress of poolAddresses) {
      const pool = new ethers.Contract(poolAddress, baluniPoolAbi.abi, clientToSigner(signer));
      const balance = await pool.balanceOf(signer.account.address);
      balances[poolAddress] = ethers.utils.formatUnits(balance, 18);
      tlvs[poolAddress] = ethers.utils.formatUnits(await pool.liquidity(), 6);
      const poolAssets = await pool.getAssets();
      const poolSymbol = await pool.symbol();
      const poolName = await pool.name();
      const poolUnitPrice = (await pool.unitPrice()) / 1e18;

      setPoolData((prevState: any) => ({
        ...prevState,
        [poolAddress]: {
          name: poolName,
          symbol: poolSymbol,
          assets: poolAssets,
          unitPrice: Number(poolUnitPrice),
        },
      }));

      const assetContracts = poolAssets.map(
        (asset: string) => new ethers.Contract(asset, erc20Abi, clientToSigner(signer)),
      );

      const assetSymbols = await Promise.all(
        assetContracts.map((contract: { symbol: () => any }) => contract.symbol()),
      );

      symbols[poolAddress] = assetSymbols.join(" / ");

      const poolERC20 = new ethers.Contract(poolAddress, erc20Abi, clientToSigner(signer));
      const totalSupply = await poolERC20.totalSupply();

      let deviationsArray: string[] = [];
      let directionsArray: boolean[] = [];
      let slippagesArray: number[] = [];

      if (totalSupply.toString() !== "0") {
        [directionsArray, deviationsArray] = await pool.getDeviations();
        slippagesArray = await pool.getSlippageParams();
      }
      const weights = await pool.getWeights();
      deviationsData[poolAddress] = assetSymbols.map((symbol, index) => ({
        symbol,
        direction: directionsArray[index],
        deviation: deviationsArray[index],
        targetWeight: weights[index],
        currentWeight: directionsArray[index]
          ? (Number(weights[index]) + Number(deviationsArray[index])).toString()
          : (Number(weights[index]) - Number(deviationsArray[index])).toString(),
        slippage: String(slippagesArray[index]),
      }));
    }

    setLiquidityBalances(balances);
    setTlvs(tlvs);
    setPoolSymbols(symbols);
    setDeviations(deviationsData);
  };

  const fetchTokenBalance = async (tokenAddress: string, account: string) => {
    const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, clientToSigner(signer as any));
    const balance = await tokenContract.balanceOf(account);
    const decimals = await tokenContract.decimals();
    setTokenBalance(ethers.utils.formatUnits(balance, decimals));
  };

  const handlePoolClick = async (poolAddress: string) => {
    if (!signer) return;
    await fetchValuationData(poolAddress);
    const pool = new ethers.Contract(poolAddress, baluniPoolAbi.abi, clientToSigner(signer));
    const tokens = await pool.getAssets();
    setLiquidityData({
      amounts: new Array(tokens.length).fill(""),
      tokens,
      poolAddress,
    });
    setRemoveLiquidityData({
      ...removeLiquidityData,
      poolAddress,
    });
  };

  const fetchBalances = async (poolAddress: string) => {
    if (!signer) return;
    const pool = new ethers.Contract(poolAddress, baluniPoolAbi.abi, clientToSigner(signer as any));
    const tokens = await pool.getAssets();
    const balances: any[] = [];
    for (const token of tokens) {
      const tokenContract = new ethers.Contract(token, erc20Abi, clientToSigner(signer as any));
      const balance = await tokenContract.balanceOf(signer.account.address);
      const decimals = await tokenContract.decimals();
      balances.push({
        token: token,
        balance: ethers.utils.formatUnits(balance, decimals),
      });
    }
    setBalances(balances);
  };

  const handleAddLiquidity = async () => {
    const { amounts, tokens, poolAddress } = liquidityData;
    if (!poolAddress) return notification.error("Select pool first!");

    if (!signer || !amounts.every(amount => amount) || !tokens.every(token => token)) return;
    const decimals: number[] = [];

    for (const token of tokens) {
      const tokenContract = new ethers.Contract(token, erc20Abi, clientToSigner(signer));

      decimals.push(await tokenContract.decimals());

      const allowance = await tokenContract.allowance(signer.account.address, poolAddress);

      if (allowance.lt(ethers.utils.parseUnits(amounts[tokens.indexOf(token)], await tokenContract.decimals()))) {
        const approveTx = await tokenContract.approve(
          poolAddress,
          ethers.utils.parseUnits(amounts[tokens.indexOf(token)], await tokenContract.decimals()),
        );
        await approveTx.wait();
      }
    }

    const pool = new ethers.Contract(poolAddress, baluniPoolAbi.abi, clientToSigner(signer));

    try {
      const parsedAmounts = amounts.map((amount, index) => ethers.utils.parseUnits(amount, decimals[index]));
      const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
      const deadline = currentTime + 600; // 10 minutes from now
      const tx = await pool.deposit(signer.account.address, parsedAmounts, deadline);
      await tx.wait();
      notification.success("Liquidity added successfully!");
    } catch (error) {
      console.error("Add liquidity failed:", error);
    }
  };

  const handleRebalanceWeight = async () => {
    try {
      if (!signer) return;
      const { tokens, poolAddress } = liquidityData;

      for (const token of tokens) {
        const tokenContract = new ethers.Contract(token, erc20Abi, clientToSigner(signer));
        const allowance = await tokenContract.allowance(signer.account.address, poolAddress);

        if (allowance.lt(ethers.constants.MaxUint256)) {
          const approveTx = await tokenContract.approve(poolAddress, ethers.constants.MaxUint256);
          await approveTx.wait();
        }
      }
      const pool = new ethers.Contract(poolAddress!, baluniPoolAbi.abi, clientToSigner(signer));
      const tx = await pool.rebalanceAndDeposit(signer.account.address);
      await tx.wait();
      notification.success("Rebalanced weights successfully!");
    } catch (error: any) {
      notification.error(String(error?.reason));
    }
  };

  const handleRemoveLiquidity = async () => {
    const { poolAddress, amount } = removeLiquidityData;

    if (!signer || !poolAddress || !amount) return;

    const tokenContract = new ethers.Contract(poolAddress, baluniPoolAbi.abi, clientToSigner(signer));
    const allowance = await tokenContract.allowance(signer.account.address, poolAddress);
    const pool = new ethers.Contract(poolAddress!, baluniPoolAbi.abi, clientToSigner(signer));

    if (allowance.lt(ethers.utils.parseUnits(amount, 18))) {
      const approveTx = await tokenContract.approve(poolAddress, ethers.utils.parseUnits(amount, 18));
      await approveTx.wait();
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const deadline = currentTime + 600;
    const shares = ethers.utils.parseUnits(amount, 18);

    try {
      const tx = await pool.withdraw(shares, signer.account.address, deadline);
      await tx.wait();
      notification.success("Liquidity removed successfully!");
    } catch (error) {
      console.error("Remove liquidity failed:", error);
    }
  };

  const handleRebalance = async (poolAddress: string) => {
    if (!signer || !poolAddress) return;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const pool = new ethers.Contract(poolAddress, baluniPoolAbi.abi, clientToSigner(signer));

    try {
      const tx = await pool.rebalance();
      await tx.wait();
      notification.success("Rebalance performed successfully!");
    } catch (error) {
      console.error("Rebalance failed:", error);
    }
  };

  const openModal = async (poolAddress: string) => {
    if (!signer && !poolAddress) return;

    const pool = new ethers.Contract(poolAddress, baluniPoolAbi.abi, clientToSigner(signer as any));
    const assets = await pool.getAssets();
    const reserves = await pool.getReserves();
    const symbols = await Promise.all(
      assets.map(async (asset: string) => {
        const assetContract = new ethers.Contract(asset, erc20Abi, clientToSigner(signer as any));
        return assetContract.symbol();
      }),
    );
    const decimals = await Promise.all(
      assets.map(async (asset: string) => {
        const assetContract = new ethers.Contract(asset, erc20Abi, clientToSigner(signer as any));
        return assetContract.decimals();
      }),
    );
    const totalLiquidity = await pool.liquidity();
    const deviationsData = deviations[poolAddress];

    const assetWeights = await Promise.all(
      assets.map(async (asset: any, index: any) => {
        const assetWeight = await pool.assetLiquidity(index);
        return (assetWeight / totalLiquidity) * 100;
      }),
    );

    const unitPrice = Number(await pool.unitPrice()) / 1e18;

    setModalData({
      address: poolAddress,
      assets: symbols.map((symbol, index) => ({
        symbol,
        reserve: ethers.utils.formatUnits(reserves[index], decimals[index]),
        decimals: decimals[index],
        deviation: deviationsData[index].deviation,
        direction: deviationsData[index].direction,
        weight: assetWeights[index],
        targetWeight: deviationsData[index].targetWeight,
        currentWeight: deviationsData[index].currentWeight,
        slippage: deviationsData[index].slippage,
      })),
      totalLiquidity: Number(totalLiquidity),
      unitPrice: unitPrice,
    });

    const poolInfoModal = document.querySelector<HTMLInputElement>("#pool-info-modal");
    if (poolInfoModal) {
      poolInfoModal.checked = true;
    }

    openModalDataModal();
  };

  function getTokenSymbol(tokenAddress: string) {
    const token = (tokens as Token[]).find(token => token.address === tokenAddress) as Token | undefined;
    return token ? token.symbol : "Unknown Token";
  }

  // function getTokenIcon(tokenAddress: string) {
  //   const token = (tokens as Token[]).find(token => token.address === tokenAddress) as Token | undefined;
  //   return token ? token.logoURI : "Unknown Token";
  // }

  async function handleCustomToken(token: any) {
    setCustomToken(token);
  }

  const handleInputChange = async (
    e: React.ChangeEvent<HTMLSelectElement> | React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<any>>,
  ) => {
    if (!signer) return;
    const { name, value } = e.target;
    setter((prevState: any) => ({ ...prevState, [name]: value }));

    if (name === "fromToken" || name === "toToken" || name === "token") {
      // const account = signer.account.address;
      // if ((name === "fromToken" || name === "token") && value) {
      //   const balance = await fetchTokenBalance(value, account);
      //   setTokenBalances(prevState => ({ ...prevState, fromTokenBalance: balance }));
      // } else if (name === "toToken" && value) {
      //   const balance = await fetchTokenBalance(value, account);
      //   setTokenBalances(prevState => ({ ...prevState, toTokenBalance: balance }));
      // }
    }
  };

  return (
    <div className="container mx-auto p-6 mb-8">
      <button className="button btn-base rounded-none" onClick={fetchData}>
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
              <th>Unit Price</th>

              <th>Deviations</th>
              <th>Weights</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody className="text-xl">
            {poolData &&
              pools.map((pool, index) => {
                let stats;

                if (statisticsData.length > 0) {
                  stats = statisticsData.find(stat => stat.address === pool);
                } else {
                  stats = null;
                }

                return (
                  <tr
                    key={index}
                    className="my-4 p-4 hover:bg-info hover:text-info-content rounded-2xl bg-base-100 mx-auto items-center"
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-wrap justify-center text-3xl">
                          {poolSymbols[pool]?.split(" / ").map(symbol => {
                            const token = tokens.find((token: Token) => token.symbol === symbol) as unknown as Token;
                            return token ? (
                              <img
                                key={symbol}
                                src={token.logoURI}
                                alt={symbol}
                                className="mask mask-circle w-10 h-10"
                              />
                            ) : null;
                          })}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        {poolData[pool]?.name && (
                          <div>
                            <div className="font-bold">{poolData[pool]?.name}</div>
                            <div className="font-semibold text-lg  opacity-30">{poolData[pool]?.symbol}</div>
                            <div className="text-sm opacity-50">{poolSymbols[pool]}</div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div>
                        ${Number(tlvs[pool]).toFixed(4)}
                        {stats ? (
                          <div>
                            {stats.valuation.daily ? (
                              <span className={stats.valuation.daily > 0 ? "text-green-500" : "text-red-500"}>
                                {/* Aggiunta di una freccia su o giù basata sul valore */}
                                {stats.valuation.daily > 0 ? " ↑" : " ↓"} {stats.valuation.daily.toFixed(4)}
                              </span>
                            ) : (
                              " : 0"
                            )}
                          </div>
                        ) : (
                          <div>0</div>
                        )}
                      </div>
                    </td>{" "}
                    <td>{Number(liquidityBalances[pool]).toFixed(6) || "0"}</td>
                    <td>
                      <div>
                        {Number(poolData[pool].unitPrice).toFixed(4)}
                        {stats ? (
                          <div>
                            {stats.unitPrice.daily ? (
                              <span className={stats.unitPrice.daily > 0 ? "text-green-500" : "text-red-500"}>
                                {/* Aggiunta di una freccia su o giù basata sul valore */}
                                {stats.unitPrice.daily > 0 ? " ↑" : " ↓"} {stats.unitPrice.daily.toFixed(2)}
                              </span>
                            ) : (
                              " : 0"
                            )}
                          </div>
                        ) : (
                          <div>0</div>
                        )}
                      </div>
                    </td>
                    <td>
                      {deviations[pool]
                        ? deviations[pool].map((deviation, index) => (
                            <span key={index}>
                              {deviation.direction ? "" : "-"}
                              {Number(deviation.deviation) / 100}%{index < deviations[pool].length - 1 && " / "}
                            </span>
                          ))
                        : "N/A"}
                    </td>
                    <td>
                      {deviations[pool] ? (
                        <>
                          {deviations[pool].map((deviation, index) => (
                            <span key={index}>
                              {Number(deviation.currentWeight) / 100}%{index < deviations[pool].length - 1 && " / "}
                            </span>
                          ))}
                        </>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-base-100 btn-xl w-20 rounded-none"
                        onClick={async () => {
                          openModal(pool);
                          handlePoolClick(pool);
                        }}
                      >
                        details
                      </button>
                      <button
                        className="btn btn-base-100 btn-xl w-20 rounded-none"
                        onClick={async () => {
                          handlePoolClick(pool);
                          fetchBalances(pool);
                          openAddLiquidityModal();
                        }}
                      >
                        add
                      </button>
                      <button
                        className="btn btn-base-100 btn-xl w-20 rounded-none"
                        onClick={async () => {
                          handlePoolClick(pool);
                          fetchBalances(pool);
                          // reset removeLiquidity Data
                          setRemoveLiquidityData({
                            poolAddress: pool,
                            amount: "",
                          });
                          openRemoveLiquidityModal();
                        }}
                      >
                        remove
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
              <th>Unit Price</th>
              <th>Deviations</th>
              <th>Weights</th>
              <th>Actions</th>
            </tr>
          </tfoot>
        </table>
      </div>
      {isModalDataModalOpen && (
        <div className="p-4 shadow rounded">
          <input type="checkbox" id="pool-info-modal" className="modal-toggle" />
          <div className="modal modal-open bg-blend-exclusion">
            <div className="modal-box w-11/12 max-w-5xl md:w-9/12 bg-base-300">
              <label
                htmlFor="pool-info-modal"
                className="btn btn-sm btn-circle absolute right-2 top-2 text-red-500"
                onClick={closeModalDataModal}
              >
                ✕
              </label>
              <h2 className="text-2xl mb-4 text-blue-700">Pool Info</h2>
              <p className="text-lg mb-2">
                <strong className="text-base">Address:</strong> {modalData.address}
              </p>

              <div className="stas">
                <div className="stat-title">Total Liquidity:</div>
                <div className="stat-value">
                  {" "}
                  ${Number(ethers.utils.formatUnits(modalData.totalLiquidity, 6)).toFixed(4)}
                </div>{" "}
              </div>

              {modalData.assets.map(
                (
                  asset: {
                    slippage(slippage: any): unknown;
                    symbol:
                      | string
                      | number
                      | bigint
                      | boolean
                      | React.ReactElement<any, string | React.JSXElementConstructor<any>>
                      | Iterable<React.ReactNode>
                      | Promise<React.AwaitedReactNode>
                      | null
                      | undefined;
                    reserve:
                      | string
                      | number
                      | bigint
                      | boolean
                      | React.ReactElement<any, string | React.JSXElementConstructor<any>>
                      | Iterable<React.ReactNode>
                      | React.ReactPortal
                      | Promise<React.AwaitedReactNode>
                      | null
                      | undefined;
                    weight: any;
                    direction: any;
                    deviation: any;
                    targetWeight: any;
                    currentWeight: any;
                  },
                  index: React.Key | null | undefined,
                ) => {
                  const token = tokens.find((token: Token) => token.symbol === asset.symbol) as unknown as Token;
                  return (
                    <div key={index} className="grid grid-cols-2 gap-2 mb-4 mt-4">
                      <div className="flex items-center">
                        {token && (
                          <img src={token.logoURI} alt={token.symbol} className="mask mask-circle w-10 h-10 mr-2" />
                        )}
                        <div>
                          <strong className="text-base">{asset.symbol}:</strong> {Number(asset.reserve).toFixed(4)}
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="mb-1">
                          <strong className="text-base">Slippage:</strong> {Number(asset.slippage) / 100}%
                        </p>
                        <p className="mb-1">
                          <strong className="text-base">Weight:</strong> {Number(asset.weight).toFixed(4)}%
                        </p>
                        <p className="mb-1">
                          <strong className="text-base">Deviation:</strong> {asset.direction ? "" : "-"}
                          {(Number(asset.deviation) / 100).toFixed(2)}%
                        </p>
                        <p className="mb-1">
                          <strong className="text-base">Target:</strong> {(Number(asset.targetWeight) / 100).toFixed(2)}
                          %
                        </p>
                        <p className="mb-1">
                          <strong className="text-base">Actual:</strong>{" "}
                          {(Number(asset.currentWeight) / 100).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  );
                },
              )}

              <UnitPriceChart unitPriceData={unitPriceData} />
              <ValuationChart valuationData={valuationData} />

              <button className="btn btn-primary mt-4" onClick={() => handleRebalance(modalData.address)}>
                Perform Rebalance
              </button>
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
            {liquidityData.tokens.map((token, index) => (
              <div key={index}>
                <div className="mt-2">{getTokenSymbol(token)}</div>
                <input
                  type="text"
                  name={`amount${index}`}
                  className="input input-bordered w-full my-2"
                  placeholder={`Amount ${index + 1}`}
                  value={liquidityData.amounts[index]}
                  onChange={e => {
                    const newAmounts = [...liquidityData.amounts];
                    newAmounts[index] = e.target.value;
                    setLiquidityData(prevState => ({
                      ...prevState,
                      amounts: newAmounts,
                    }));
                  }}
                />
                <button
                  className="btn btn-sm btn-primary my-2"
                  onClick={() => {
                    const newAmounts = [...liquidityData.amounts];
                    newAmounts[index] = balances[index].balance;
                    setLiquidityData(prevState => ({
                      ...prevState,
                      amounts: newAmounts,
                    }));
                  }}
                >
                  Max
                </button>
              </div>
            ))}
            <div className="my-2">Use Custom Token</div>
            <select
              className="select select-bordered w-full text-lg"
              value={customToken}
              onChange={async e => {
                await handleCustomToken(e.target.value);
                await fetchTokenBalance(String(e.target.value), signer?.account.address as unknown as any);
              }}
            >
              <option value="">Select Token</option>
              {(tokens as { address: string; symbol: string }[]).map(token => (
                <option key={token.address} value={token.address} className="text-lg">
                  {token.symbol}
                </option>
              ))}
            </select>
            <div className="mt-2"> {tokenBalance}</div>
            <input
              type="text"
              className="input input-bordered w-full my-2"
              placeholder={`Amount To Add`}
              value={customAmount}
              onChange={e => {
                setCustomAmount(e.target.value);
              }}
            />

            <button
              className="btn btn-sm btn-primary my-2"
              onClick={async () => {
                await zapIn(liquidityData.poolAddress, String(customToken), String(customAmount));
              }}
            >
              Zap In
            </button>
            <button className="btn btn-primary w-full" onClick={handleAddLiquidity}>
              Add Liquidity
            </button>
            <button className="btn btn-primary w-full my-4" onClick={handleRebalanceWeight}>
              Rebalance and Add
            </button>
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
              placeholder={liquidityBalances[removeLiquidityData.poolAddress]}
              value={removeLiquidityData.amount}
              onChange={e => handleInputChange(e, setRemoveLiquidityData)}
            />
            <select
              className="select select-bordered w-full text-lg"
              value={customToken}
              onChange={async e => await handleCustomToken(e.target.value)}
            >
              <option value="">Select Token</option>
              {(tokens as { address: string; symbol: string }[]).map(token => (
                <option key={token.address} value={token.address} className="text-lg">
                  {token.symbol}
                </option>
              ))}
            </select>

            <button className="btn btn-danger w-full my-2" onClick={handleRemoveLiquidity}>
              Remove Liquidity
            </button>
            <button
              className="btn btn-danger w-full my-2"
              onClick={async () => {
                await zapOut(removeLiquidityData.poolAddress, String(customToken), removeLiquidityData.amount);
              }}
            >
              Zap Out
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

export default PoolsBox;
