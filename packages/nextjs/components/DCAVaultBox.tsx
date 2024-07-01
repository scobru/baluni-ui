"use client";

import React, { useEffect, useState } from "react";
import useTokenList from "../hooks/useTokenList";
import { clientToSigner } from "../utils/ethers";
import { notification } from "../utils/scaffold-eth";
import Spinner from "./Spinner";
import { UnitPriceChart, ValuationChart } from "./charts/Charts";
import dcaVaultRegistryAbi from "baluni-contracts/artifacts/contracts/registry/BaluniV1DCAVaultRegistry.sol/BaluniV1DCAVaultRegistry.json";
import registryAbi from "baluni-contracts/artifacts/contracts/registry/BaluniV1Registry.sol/BaluniV1Registry.json";
import baluniDCAVaultAbi from "baluni-contracts/artifacts/contracts/vaults/BaluniV1DCAVault.sol/BaluniV1DCAVault.json";
import { INFRA } from "baluni/dist/api/";
import { Contract, ethers } from "ethers";
import { useWalletClient } from "wagmi";
import { erc20Abi } from "viem";

const vaultDescription = {
  DCA: {
    objective:
      "The dollar-cost average has been a trading strategy used in the stock market to allow investors to buy stocks at an average price. As the price of BTC and other assets are very volatile, it is a great strategy for leveling the cost so that it does not buy high. The strategy is aimed at long-term growth with little to no work on when to invest",
    description:
      "The strategy buys assets like BTC over a period of time. The strategy will buy each day at the same time to get the average price of the assets. This is continued for months to even years depending on the principal amount. This way we are never buying all the assets at once in order to avoid buying at a high price. As BTC and other cryptocurrencies are volatile, the dollar cost average allows us to level the price and ensure that we do not lose too much but at the same time do not miss out on the large gains.",
  },
};

interface VaultData {
  symbol: string;
  assets: string[];
  assetsSymbol: string[];
  baseBalance: string;
  quoteBalance: string;
  totalSupply: string;
  totalLiquidity: string;
  unitPrice: string;
}

interface TokenBalance {
  fromTokenBalance: string;
  toTokenBalance: string;
}

interface AddLiquidityData {
  vaultAddress: string;
  amount: string;
}

interface RemoveLiquidityData {
  vaultAddress: string;
  amount: string;
}

interface Token {
  address: string;
  symbol: string;
  logoURI: string;
}

interface ValuationData {
  timestamp: string;
  address: string;
  totalValuation: string;
}

interface UnitPricesData {
  timestamp: string;
  address: string;
  unitPrice: string;
}

interface StatisticsData {
  address: string;
  unitPrice: { daily: number };
  valuation: { daily: number };
}

function getVaultDescription() {
  return vaultDescription.DCA;
}

const DCAVaultBox = () => {
  const { data: signer } = useWalletClient();
  const { tokens } = useTokenList();
  const serverUrl = String(process.env.NEXT_PUBLIC_SERVER_URL);

  const [vaultRegistry, setVaultRegistry] = useState<string | undefined>();
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isVaultInfoModalOpen, setIsVaultInfoModalOpen] = useState(false);
  const [selectedVault, setSelectedVault] = useState<string | null>(null);

  const [, /* tokenBalances */ setTokenBalances] = useState<TokenBalance>({
    fromTokenBalance: "0",
    toTokenBalance: "0",
  });

  const [vaults, setVaults] = useState<string[]>([]);
  const [poolSymbols, setPoolSymbols] = useState<{ [key: string]: string }>({});
  const [liquidityBalances, setLiquidityBalances] = useState<{ [key: string]: string }>({});
  const [tlvs, setTlvs] = useState<{ [key: string]: string }>({});
  const [addLiquidityData, setAddLiquidityData] = useState<AddLiquidityData>({
    vaultAddress: "",
    amount: "",
  });
  const [removeLiquidityData, setRemoveLiquidityData] = useState<RemoveLiquidityData>({
    vaultAddress: "",
    amount: "",
  });
  const [vaultData, setVaultData] = useState<{ [key: string]: VaultData }>({});
  const [valuationData, setValuationData] = useState<ValuationData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [unitPriceData, setUnitPricesData] = useState<UnitPricesData[]>([]);
  const [allValuationData, setAllValuationData] = useState<ValuationData[]>([]);
  const [allUnitPriceData, setAllUnitPriceData] = useState<UnitPricesData[]>([]);
  const [statisticsData, setStatisticsData] = useState<StatisticsData[]>([]);

  const openDepositModal = () => setIsDepositModalOpen(true);
  const closeDepositModal = () => setIsDepositModalOpen(false);

  const openWithdrawModal = () => setIsWithdrawModalOpen(true);
  const closeWithdrawModal = () => setIsWithdrawModalOpen(false);

  const openVaultInfoModal = (vault: string) => {
    setSelectedVault(vault);
    setIsVaultInfoModalOpen(true);
  };

  const closeVaultInfoModal = () => {
    setSelectedVault(null);
    setIsVaultInfoModalOpen(false);
  };

  useEffect(() => {
    if (!signer) return;
    setContract();
  }, [signer]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const intervalId = setInterval(() => {}, 60000);

    return () => clearInterval(intervalId);
  }, [vaults, signer]);

  const fetchAllData = async () => {
    const valuationUrl = serverUrl + "/api/valuation-data";
    const unitPriceUrl = serverUrl + "/api/unitPrices-data";
    const statisticsUrl = serverUrl + "/api/statistics";
    try {
      const [valuationResponse, unitPriceResponse, statisticsResponse] = await Promise.all([
        fetch(valuationUrl),
        fetch(unitPriceUrl),
        fetch(statisticsUrl),
      ]);
      const [valuationData, unitPriceData, statisticsData] = await Promise.all([
        valuationResponse.json(),
        unitPriceResponse.json(),
        statisticsResponse.json(),
      ]);

      setAllValuationData(valuationData);
      setAllUnitPriceData(unitPriceData);
      setStatisticsData(statisticsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    if (!signer && !vaultRegistry && !serverUrl) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        await fetchAllData();
        await getVaults();
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setLoading(false);
    };

    fetchData();
  }, [vaultRegistry]);

  const getVaults = async () => {
    if (!signer || !vaultRegistry) return;
    const factory = new ethers.Contract(vaultRegistry, dcaVaultRegistryAbi.abi, clientToSigner(signer));
    const vaultsAddress = await factory.getAllVaults();
    setVaults(vaultsAddress);

    const balances: { [key: string]: string } = {};
    const symbols: { [key: string]: string } = {};
    const assetsSymbol = [];
    const poolAssets = [];

    const vaultsData: { [key: string]: VaultData } = {};
    const tlvs: { [key: string]: string } = {};

    for (const vaultAddress of vaultsAddress) {
      const vault = new ethers.Contract(vaultAddress, baluniDCAVaultAbi.abi, clientToSigner(signer));
      const balance = await vault.balanceOf(signer.account.address);
      balances[vaultAddress] = ethers.utils.formatUnits(balance, 18);
      const baseAsset = await vault.baseAsset();
      const baseAssetContract = new ethers.Contract(baseAsset, erc20Abi, clientToSigner(signer));
      const baseDecimal = await baseAssetContract.decimals();
      const balanceBase = await baseAssetContract.balanceOf(vaultAddress);
      tlvs[vaultAddress] = ethers.utils.formatUnits(await vault.totalValuation(), baseDecimal);

      poolAssets[0] = await vault.baseAsset();
      poolAssets[1] = await vault.quoteAsset();

      assetsSymbol[0] = getTokenSymbol(poolAssets[0]);
      assetsSymbol[1] = getTokenSymbol(poolAssets[1]);

      const poolERC20 = new ethers.Contract(vaultAddress, erc20Abi, clientToSigner(signer));
      const totalSupply = await poolERC20.totalSupply();
      const quoteAsset = await vault.quoteAsset();
      const quoteAssetContract = new ethers.Contract(quoteAsset, erc20Abi, clientToSigner(signer));
      const quoteDecimal = await quoteAssetContract.decimals();
      const balanceQuote = await quoteAssetContract.balanceOf(vaultAddress);

      const unitPrice = await vault.unitPrice();

      vaultsData[vaultAddress] = {
        symbol: String(await vault.symbol()),
        assets: poolAssets as any,
        assetsSymbol: assetsSymbol,
        baseBalance: ethers.utils.formatUnits(balanceBase, baseDecimal),
        quoteBalance: ethers.utils.formatUnits(balanceQuote, quoteDecimal),
        totalSupply: ethers.utils.formatEther(totalSupply),
        totalLiquidity: ethers.utils.formatUnits(await vault.totalValuation(), baseDecimal),
        unitPrice: ethers.utils.formatUnits(unitPrice, 18),
      };
    }
    setVaultData(prevData => ({ ...prevData, ...vaultsData }));
    setLiquidityBalances(balances);
    setTlvs(tlvs);
    setPoolSymbols(symbols);
  };

  const setContract = async () => {
    const registry = new Contract(INFRA[137].REGISTRY, registryAbi.abi, clientToSigner(signer as any));
    const vaultRegistry = await registry.getBaluniDCAVaultRegistry();
    setVaultRegistry(vaultRegistry);
  };

  if (loading) {
    return <Spinner />;
  }

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
        setTokenBalances(prevState => ({ ...prevState, fromTokenBalance: balance }));
      } else if (name === "toToken" && value) {
        const balance = await fetchTokenBalance(value, account);
        setTokenBalances(prevState => ({ ...prevState, toTokenBalance: balance }));
      }
    }
  };

  const handleVaultClick = (vaultAddress: string) => {
    if (!signer) return;
    setAddLiquidityData({
      amount: "",
      vaultAddress,
    });
    setRemoveLiquidityData({
      ...removeLiquidityData,
      vaultAddress,
    });
    const filteredValuationData = allValuationData.filter(data => data.address === vaultAddress);
    const filteredUnitPriceData = allUnitPriceData.filter(data => data.address === vaultAddress);

    setValuationData(filteredValuationData);
    setUnitPricesData(filteredUnitPriceData);
  };

  const handleAddLiquidity = async () => {
    const { amount, vaultAddress } = addLiquidityData;
    if (!vaultAddress) return notification.error("Select pool first!");
    const vault = new ethers.Contract(vaultAddress, baluniDCAVaultAbi.abi, clientToSigner(signer as any));
    const baseAsset = await vault.baseAsset();
    if (!signer) return;
    const tokenContract = new ethers.Contract(baseAsset, erc20Abi, clientToSigner(signer));
    const decimals = await tokenContract.decimals();
    const allowance = await tokenContract.allowance(signer.account.address, vaultAddress);

    if (allowance.lt(ethers.utils.parseUnits(amount, await tokenContract.decimals()))) {
      const approveTx = await tokenContract.approve(
        vaultAddress,
        ethers.utils.parseUnits(amount, await tokenContract.decimals()),
      );
      await approveTx.wait();
    }

    try {
      const parsedAmounts = ethers.utils.parseUnits(amount, decimals);
      const tx = await vault.deposit(parsedAmounts, signer.account.address);
      await tx.wait();
      notification.success("Liquidity added successfully!");
    } catch (error) {
      console.error("Add liquidity failed:", error);
    }
  };

  const handleRemoveLiquidity = async () => {
    const { vaultAddress, amount } = removeLiquidityData;

    if (!signer || !vaultAddress || !amount) return;

    const tokenContract = new ethers.Contract(vaultAddress, baluniDCAVaultAbi.abi, clientToSigner(signer));
    const allowance = await tokenContract.allowance(signer.account.address, vaultAddress);

    if (allowance.lt(ethers.utils.parseUnits(amount, 18))) {
      const approveTx = await tokenContract.approve(vaultAddress, ethers.utils.parseUnits(amount, 18));
      await approveTx.wait();
    }

    const shares = ethers.utils.parseUnits(amount, 18);

    try {
      const tx = await tokenContract.withdraw(shares, signer.account.address);
      await tx.wait();
      notification.success("Liquidity removed successfully!");
    } catch (error) {
      console.error("Remove liquidity failed:", error);
    }
  };

  function getTokenSymbol(tokenAddress: string) {
    const token = (tokens as Token[]).find(token => token.address === tokenAddress) as Token | undefined;
    return token ? token.symbol : "Unknown Token";
  }

  function getTokenIcon(tokenAddress: string) {
    const token = (tokens as Token[]).find(token => token.address === tokenAddress) as Token | undefined;
    return token ? token.logoURI : "Unknown Token";
  }

  return (
    <div className="container mx-auto p-6 mb-8">
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr className="my-4 p-4 rounded-2xl bg-base-100 mx-auto items-center">
              <th>Assets</th>
              <th>Symbol</th>
              <th>TLV</th>
              <th>Liquidity</th>
              <th>Unit Price</th>
              <th>Daily Change</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody className="text-xl">
            {vaults.map((vault, index) => {
              const stats = statisticsData.find(stat => stat.address === vault);
              return (
                <tr
                  key={index}
                  className="my-4 p-4 hover:bg-info hover:text-info-content rounded-2xl bg-base-100 mx-auto items-center"
                >
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-wrap justify-center text-3xl">
                        {vaultData[vault]?.assetsSymbol.map((symbol, index) => (
                          <img
                            key={index}
                            src={getTokenIcon(vaultData[vault]?.assets[index])}
                            alt={symbol}
                            className="mask mask-circle w-10 h-10"
                          />
                        ))}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="font-bold">{vaultData[vault]?.symbol}</div>
                    <div className="text-sm opacity-50">{poolSymbols[vault]}</div>
                  </td>
                  <td>{Number(tlvs[vault]).toFixed(4)}</td>
                  <td>{Number(liquidityBalances[vault]).toFixed(5) || "0"}</td>
                  <td>{Number(vaultData[vault]?.unitPrice).toFixed(5) || "0"}</td>
                  <td>
                    {stats ? (
                      <>
                        <div>Unit Price: {stats.unitPrice.daily ? stats.unitPrice.daily.toFixed(2) : 0}%</div>
                        <div>Valuation: {stats.valuation.daily ? stats.valuation.daily.toFixed(2) : 0}%</div>
                      </>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-base-100 btn-xl w-20 rounded-none"
                      onClick={() => {
                        handleVaultClick(vault);
                        openVaultInfoModal(vault);
                      }}
                    >
                      details
                    </button>
                    <button
                      className="btn btn-base-200  btn-xl w-20 rounded-none "
                      onClick={() => {
                        handleVaultClick(vault);
                        openDepositModal();
                      }}
                    >
                      add
                    </button>
                    <button
                      className="btn btn-base-300  btn-xl w-20 rounded-none"
                      onClick={() => {
                        handleVaultClick(vault);
                        openWithdrawModal();
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
            <tr className="my-4 p-4  rounded-2xl bg-base-100 mx-auto items-center">
              <th>Assets</th>
              <th>Symbol</th>
              <th>TLV</th>
              <th>Liquidity</th>
              <th>Unit Price</th>
              <th>Daily Change</th>
              <th>Actions</th>
            </tr>
          </tfoot>
        </table>
      </div>
      {isVaultInfoModalOpen && selectedVault && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-5xl md:w-9/12">
            <h3 className="font-bold text-lg">Vault Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 text-center">
              <div className="stat">
                <div className="stat-title">Unit Price</div>
                <div className="stat-value">{Number(vaultData[selectedVault]?.unitPrice).toFixed(3)}</div>
              </div>
              <div className="stat">
                <div className="stat-title">TLV</div>
                <div className="stat-value">{Number(tlvs[selectedVault]).toFixed(4)} USDC</div>
                <div className="text-lg">
                  {Number(vaultData[selectedVault]?.baseBalance).toFixed(3)} {vaultData[selectedVault].assetsSymbol[0]}{" "}
                </div>
                <div className="text-lg">
                  {Number(vaultData[selectedVault]?.quoteBalance).toFixed(8)} {vaultData[selectedVault].assetsSymbol[1]}{" "}
                </div>
              </div>
              <div className="stat">
                <div className="stat-title">Your Liquidity</div>
                <div className="stat-value">{Number(liquidityBalances[selectedVault]).toFixed(5) || "0"}</div>
              </div>
            </div>
            <div className="card bg-base-100 p-4 lg:p-6 w-full">
              <h2 className="card-title text-2xl sm:text-3xl mb-4 sm:mb-8">Charts</h2>
              <div className="w-full overflow-x-auto">
                <ValuationChart valuationData={valuationData} />
              </div>
              <div className="w-full overflow-x-auto mt-4">
                <UnitPriceChart unitPriceData={unitPriceData} />
              </div>
            </div>
            <div className="p-4 rounded shadow mt-4">
              <span className="text-lg font-bold mt-2">Strategy Objective</span>
              <div className="text-lg font-semibold text-gray-700">{getVaultDescription()?.objective}</div>
              <span className="text-lg font-bold mt-2">Strategy Description</span>
              <div className="mt-2 text-gray-600">{getVaultDescription()?.description}</div>
            </div>
            <div className="modal-action">
              <button className="btn" onClick={closeVaultInfoModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {isDepositModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Deposit</h3>
            <input
              type="text"
              name="amount"
              className="input input-bordered w-full mb-4"
              placeholder="Amount"
              value={addLiquidityData.amount}
              onChange={e => handleInputChange(e, setAddLiquidityData)}
            />
            <button className="btn btn-primary w-full" onClick={handleAddLiquidity}>
              Deposit
            </button>
            <div className="modal-action">
              <button className="btn" onClick={closeDepositModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {isWithdrawModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Withdraw</h3>
            <input
              type="text"
              name="amount"
              className="input input-bordered w-full mb-4"
              placeholder="Amount"
              value={removeLiquidityData.amount}
              onChange={e => handleInputChange(e, setRemoveLiquidityData)}
            />
            <button className="btn btn-danger w-full" onClick={handleRemoveLiquidity}>
              Withdraw
            </button>
            <div className="modal-action">
              <button className="btn" onClick={closeWithdrawModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DCAVaultBox;
