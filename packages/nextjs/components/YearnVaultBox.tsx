"use client";

import type React from "react";
import { useEffect, useState } from "react";
import useTokenList from "../hooks/useTokenList";
import { clientToSigner } from "../utils/ethers";
import { notification } from "../utils/scaffold-eth";
import Spinner from "./Spinner";
import { InterestChart, UnitPriceChart, ValuationChart } from "./charts/Charts";
import registryAbi from "baluni-contracts/artifacts/contracts/registry/BaluniV1Registry.sol/BaluniV1Registry.json";
import vaultRegistryAbi from "baluni-contracts/artifacts/contracts/registry/BaluniV1YearnVaultRegistry.sol/BaluniV1YearnVaultRegistry.json";
import baluniVaultAbi from "baluni-contracts/artifacts/contracts/vaults/BaluniV1YearnVault.sol/BaluniV1YearnVault.json";
import { INFRA } from "baluni/dist/api/";
import { Contract, ethers } from "ethers";
import { erc20Abi } from "viem";
import { useWalletClient } from "wagmi";

const vaultDescription = {
  Accumulator: {
    objective:
      "This is a strategy to allow investors to stake in their assets so that the assets stake would return an interest. It is more beneficial if you are holding BV-YRN(USDCxWBTC) than USDC because BV-YRN(USDCxWBTC) token gains interest through lending protocol in yearn. Investor can combine both similar single asset in different allocation weight to achieve optimal returns from lending",
    description:
      "Single asset allows investors to lend their assets like BV-YRN(USDCxWBTC) to markets like yearn, this way it earns interest by putting the asset to work. The interest rate varies with the market. They can change every day or even just hours, all depending on the supply of the assets. Interest rates can also range from high 30% to low as 1%. As these stakings have no locking period, they can be withdrawn at any time when the investor chooses to.",
  },
};

interface VaultData {
  symbol: string;
  assets: string[];
  assetsSymbol: string[];
  yearnVault: string;
  yearnData: any;
  baseBalance: string;
  quoteBalance: string;
  totalSupply: string;
  interest: string;
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

interface InterestData {
  timestamp: string;
  address: string;
  interestEarned: string;
}

interface StatisticsData {
  address: string;
  unitPrice: { daily: number };
  valuation: { daily: number };
  interest: { daily: number };
}

function getVaultDescription() {
  return vaultDescription.Accumulator;
}

const YearnVaultBox = () => {
  const { data: signer } = useWalletClient();
  const { tokens } = useTokenList();

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;

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
  const [liquidityBalances, setLiquidityBalances] = useState<{
    [key: string]: string;
  }>({});
  const [tlvs, setTlvs] = useState<{ [key: string]: string }>({});
  const [addLiquidityData, setAddLiquidityData] = useState<AddLiquidityData>({
    vaultAddress: "",
    amount: "",
  });
  const [removeLiquidityData, setRemoveLiquidityData] = useState<RemoveLiquidityData>({
    vaultAddress: "",
    amount: "",
  });
  const [, /* activeForm */ setActiveForm] = useState<{
    [key: string]: string;
  }>({});
  const [vaultData, setVaultData] = useState<{ [key: string]: VaultData }>({});
  const [valuationData, setValuationData] = useState<ValuationData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [interestData, setInterestData] = useState<InterestData[]>([]);
  const [unitPriceData, setUnitPricesData] = useState<UnitPricesData[]>([]);
  const [allValuationData, setAllValuationData] = useState<ValuationData[]>([]);
  const [allInterestData, setAllInterestData] = useState<InterestData[]>([]);
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
    try {
      const [valuationResponse, interestResponse, unitPriceResponse, statisticsResponse] = await Promise.all([
        await fetch(serverUrl + "/api/valuation-data"),
        await fetch(serverUrl + "/api/totalInterestEarned-data"),
        await fetch(serverUrl + "/api/unitPrices-data"),
        await fetch(serverUrl + "/api/statistics"),
      ]);

      const [valuationData, interestData, unitPriceData, statisticsData] = await Promise.all([
        valuationResponse.json(),
        interestResponse.json(),
        unitPriceResponse.json(),
        statisticsResponse.json(),
      ]);

      setAllValuationData(valuationData);
      setAllInterestData(interestData);
      setAllUnitPriceData(unitPriceData);

      if (!statisticsData) return console.error("Error fetching statistics data");
      setStatisticsData(statisticsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    if (!signer && !vaultRegistry) return;

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
  }, [signer, vaultRegistry]);

  const fetchWithRetry = async (url: RequestInfo | URL, options: RequestInit | undefined, retries = 1) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        if (i === retries - 1) {
          throw error;
        }
      }
    }
  };

  const getVaults = async () => {
    if (!signer || !vaultRegistry) return;
    setLoading(true);
    const factory = new ethers.Contract(vaultRegistry, vaultRegistryAbi.abi, clientToSigner(signer));
    const vaultsAddress = await factory.getAllVaults();
    setVaults(vaultsAddress);

    const balances: { [key: string]: string } = {};
    const symbols: { [key: string]: string } = {};
    const assetsSymbol = [];
    const poolAssets = [];

    const vaultsData: { [key: string]: VaultData } = {};
    const tlvs: { [key: string]: string } = {};

    for (const vaultAddress of vaultsAddress) {
      const vault = new ethers.Contract(vaultAddress, baluniVaultAbi.abi, clientToSigner(signer));
      const balance = await vault.balanceOf(signer.account.address);
      balances[vaultAddress] = ethers.utils.formatUnits(balance, 18);

      const yearnVault = await vault.yearnVault();

      //const baseAsset = await vault.baseAsset();
      const baseAssetContract = new ethers.Contract(yearnVault, erc20Abi, clientToSigner(signer));
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
      const chainId = 137;
      const unitPrice = await vault.unitPrice();

      let data;
      try {
        data = await fetchWithRetry(`http://localhost:3001/${String(chainId)}/yearn-v3/vaults`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          mode: "cors",
        });
      } catch (error) {
        console.error("Error fetching vault data:", error);
        setLoading(false);
        return;
      }

      const filteredData = data.filter((vault: any) => vault.address === yearnVault);
      const interestEarned = ethers.utils.formatUnits(await vault.interestEarned(), 6);

      vaultsData[vaultAddress] = {
        symbol: String(await vault.symbol()),
        assets: poolAssets as any,
        assetsSymbol: assetsSymbol,
        yearnVault: yearnVault,
        yearnData: filteredData,
        baseBalance: ethers.utils.formatUnits(balanceBase, baseDecimal),
        quoteBalance: ethers.utils.formatUnits(balanceQuote, quoteDecimal),
        totalSupply: ethers.utils.formatEther(totalSupply),
        interest: interestEarned,
        totalLiquidity: ethers.utils.formatUnits(await vault.totalValuation(), baseDecimal),
        unitPrice: ethers.utils.formatUnits(unitPrice, 18),
      };

      console.log(vaultsData[vaultAddress]);
    }
    setVaultData(prevData => ({ ...prevData, ...vaultsData }));

    setLiquidityBalances(balances);
    setTlvs(tlvs);
    setPoolSymbols(symbols);
    setLoading(false);
  };

  const setContract = async () => {
    const registry = new Contract(INFRA[137].REGISTRY, registryAbi.abi, clientToSigner(signer as any));
    const vaultRegistry = await registry.getBaluniYearnVaultRegistry();
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
    const filteredInterestData = allInterestData.filter(data => data.address === vaultAddress);
    const filteredUnitPriceData = allUnitPriceData.filter(data => data.address === vaultAddress);
    setSelectedVault(vaultAddress);
    setValuationData(filteredValuationData);
    setInterestData(filteredInterestData);
    setUnitPricesData(filteredUnitPriceData);
  };

  const handleAddLiquidity = async () => {
    const { amount, vaultAddress } = addLiquidityData;
    if (!vaultAddress) return notification.error("Select pool first!");
    const vault = new ethers.Contract(vaultAddress, baluniVaultAbi.abi, clientToSigner(signer as any));
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

    const pool = new ethers.Contract(vaultAddress, baluniVaultAbi.abi, clientToSigner(signer));

    try {
      const parsedAmounts = ethers.utils.parseUnits(amount, decimals);
      const tx = await pool.deposit(parsedAmounts, signer.account.address);
      await tx.wait();
      notification.success("Liquidity added successfully!");
    } catch (error) {
      console.error("Add liquidity failed:", error);
    }
  };

  const handleBuy = async (vaultAddress: string) => {
    if (!vaultAddress) return notification.error("Select pool first!");
    const vault = new ethers.Contract(vaultAddress, baluniVaultAbi.abi, clientToSigner(signer as any));
    if (!signer) return;

    try {
      const tx = await vault.buy();
      await tx.wait();
      notification.success("Liquidity added successfully!");
    } catch (error) {
      notification.error(JSON.stringify(error));
      console.error("Add liquidity failed:", error);
    }
  };

  const handleRemoveLiquidity = async () => {
    const { vaultAddress, amount } = removeLiquidityData;

    if (!signer || !vaultAddress || !amount) return;

    const vaultCtx = new ethers.Contract(vaultAddress, baluniVaultAbi.abi, clientToSigner(signer));
    const allowance = await vaultCtx.allowance(signer.account.address, vaultAddress);

    const decimals = await vaultCtx.decimals();

    if (allowance.lt(ethers.utils.parseUnits(amount, decimals))) {
      const approveTx = await vaultCtx.approve(vaultAddress, ethers.utils.parseUnits(amount, decimals));
      await approveTx.wait();
    }

    const shares = ethers.utils.parseUnits(amount, decimals);

    try {
      const tx = await vaultCtx.withdraw(shares, signer.account.address);
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
      <button className="button btn-base rounded-none" onClick={() => getVaults()}>
        <img src="https://www.svgrepo.com/download/470882/refresh.svg" alt="" className="mask mask-circle h-10 w-10" />
      </button>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr className="my-4 p-4  rounded-2xl bg-base-100 mx-auto items-center">
              <th>Assets</th>
              <th>Symbol</th>
              <th>TLV</th>
              <th>Liquidity</th>
              <th>Unit Price</th>
              <th>APR</th>
              <th>Daily Change</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody className="text-xl">
            {vaults.map((vault, index) => {
              let stats;
              if (statisticsData.length > 0) {
                stats = statisticsData.find(stat => stat.address === vault);
              } else {
                stats = null;
              }
              return (
                <tr
                  key={index}
                  className="my-4 p-4 hover:bg-info hover:text-info-content rounded-2xl bg-base-100 mx-auto items-center"
                >
                  <td>
                    <div className="flex flex-wrap  items-center gap-3">
                      {/* <img
                        src={vaultData[vault]?.yearnData[0]?.icon}
                        alt={`${vaultData[vault]?.symbol} icon`}
                        className="w-14 h-14 "
                      /> */}
                      <div className="justify-center text-3xl">
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
                  <td>${Number(tlvs[vault]).toFixed(4)}</td>
                  <td>{Number(liquidityBalances[vault]).toFixed(5) || "0"}</td>
                  <td>${Number(vaultData[vault]?.unitPrice).toFixed(5) || "0"}</td>
                  <td>{(vaultData[vault]?.yearnData[0]?.apr.netAPR * 100).toFixed(2)}%</td>
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
                  <td className="hover:text-info-content">
                    <button
                      className="label label-text text-xl font-semibold "
                      onClick={() => {
                        handleVaultClick(vault);
                        openVaultInfoModal(vault);
                      }}
                    >
                      Details
                    </button>
                    <button
                      className="label label-text text-xl font-semibold "
                      onClick={() => {
                        handleVaultClick(vault);
                        openDepositModal();
                      }}
                    >
                      Add
                    </button>
                    <button
                      className="label label-text text-xl font-semibold "
                      onClick={() => {
                        handleVaultClick(vault);
                        openWithdrawModal();
                      }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="my-4 p-4 rounded-2xl bg-base-100 mx-auto items-center">
              <th>Assets</th>
              <th>Symbol</th>
              <th>TLV</th>
              <th>Liquidity</th>
              <th>Unit Price</th>
              <th>APR</th>
              <th>Daily Change</th>
              <th>Actions</th>
            </tr>
          </tfoot>
        </table>
      </div>
      {selectedVault && isVaultInfoModalOpen && (
        <div className="p-4 shadow rounded">
          <input type="checkbox" id="vault-info-modal" className="modal-toggle" />
          <div className="modal modal-open bg-blend-exclusion">
            <div className="modal-box w-11/12 max-w-5xl md:w-9/12 bg-base-300">
              <h3 className="font-bold text-xl">Vault Info</h3>
              <p className="text-lg mb-2">
                <strong className="text-base">Address:</strong> {selectedVault}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 text-center">
                <div className="stat">
                  <div className="stat-title text-lg">APR</div>
                  <div className="stat-value text-md">
                    {(vaultData[selectedVault]?.yearnData[0]?.apr.netAPR * 100).toFixed(2)}%
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title text-lg">Last 30 Day</div>
                  <div className="stat-value text-md">
                    {(vaultData[selectedVault]?.yearnData[0]?.apr.points.monthAgo * 100).toFixed(2)}%
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title text-lg">Last 7 Day</div>
                  <div className="stat-value text-md">
                    {(vaultData[selectedVault]?.yearnData[0]?.apr.points.weekAgo * 100).toFixed(2)}%
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title text-lg">Inception</div>
                  <div className="stat-value text-md">
                    {(vaultData[selectedVault]?.yearnData[0]?.apr.points.inception * 100).toFixed(2)}%
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title text-lg">Unit Price</div>
                  <div className="stat-value text-md">
                    {Number(vaultData[selectedVault]?.unitPrice).toFixed(5) || "0"}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title text-lg">TLV</div>
                  <div className="stat-value text-md">{Number(tlvs[selectedVault])} USDC</div>
                </div>
                <div className="stat">
                  <div className="stat-title text-lg">Your Liquidity</div>
                  <div className="stat-value text-md">{Number(liquidityBalances[selectedVault]) || "0"}</div>
                </div>
                <div className="stat">
                  <div className="stat-title text-lg">Interest Earned</div>
                  <div className="stat-value text-md">{Number(vaultData[selectedVault]?.interest)}</div>
                  <button
                    className="btn btn-danger w-full sm:w-auto my-2 text-md"
                    onClick={() => {
                      setActiveForm(prevState => ({
                        ...prevState,
                        [selectedVault]: prevState[selectedVault] === "remove" ? "" : "remove",
                      }));
                      handleBuy(selectedVault);
                    }}
                    disabled={Number(vaultData[selectedVault]?.interest) < 0}
                  >
                    Reinvest Earnings
                  </button>
                </div>
              </div>
              <div className="card  p-6 lg:p-8 w-full">
                <h2 className="card-title text-3xl sm:text-4xl mb-6 sm:mb-10">Charts</h2>
                <div className="w-full overflow-x-auto">
                  <ValuationChart valuationData={valuationData} />
                </div>
                <div className="w-full overflow-x-auto mt-6">
                  <InterestChart interestData={interestData} />
                </div>
                <div className="w-full overflow-x-auto mt-6">
                  <UnitPriceChart unitPriceData={unitPriceData} />
                </div>
              </div>
              <div className="p-6 rounded shadow mt-6">
                <span className="text-xl font-bold mt-2">Strategy Objective</span>
                <div className="text-lg font-semibold ">{getVaultDescription().objective}</div>
                <span className="text-xl font-bold mt-2">Strategy Description</span>
                <div className="text-md opacity-70 mt-2">{getVaultDescription()?.description}</div>
              </div>
              <div className="modal-action">
                <button className="btn text-md" onClick={closeVaultInfoModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isDepositModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box bg-base-300">
            <h3 className="text-xl font-bold">Deposit</h3>
            <input
              type="text"
              name="amount"
              className="input input-bordered w-full mb-6 text-md"
              placeholder="Amount"
              value={addLiquidityData.amount}
              onChange={e => handleInputChange(e, setAddLiquidityData)}
            />
            <button className="btn btn-primary w-full text-lg" onClick={handleAddLiquidity}>
              Deposit
            </button>
            <div className="modal-action">
              <button className="btn text-md" onClick={closeDepositModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {isWithdrawModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box bg-base-300">
            <h3 className="text-xl font-bold">Withdraw</h3>
            <input
              type="text"
              name="amount"
              className="input input-bordered w-full mb-6 text-md"
              placeholder="Amount"
              value={removeLiquidityData.amount}
              onChange={e => handleInputChange(e, setRemoveLiquidityData)}
            />
            <button className="btn btn-danger w-full text-lg" onClick={handleRemoveLiquidity}>
              Withdraw
            </button>
            <div className="modal-action">
              <button className="btn text-md" onClick={closeWithdrawModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YearnVaultBox;
