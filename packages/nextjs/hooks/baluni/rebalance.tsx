// TESTING
//import { SwapTokenLogic } from "baluni/dist/api/odos";
import { SwapTokenLogic } from "../../../../../baluni/src/api/odos/index";
import { updateConfig } from "./updateConfig";
import rebalancerAbi from "baluni-contracts/artifacts/contracts/managers/BaluniV1Rebalancer.sol/BaluniV1Rebalancer.json";
import registryAbi from "baluni-contracts/artifacts/contracts/registry/BaluniV1Registry.sol/BaluniV1Registry.json";
import { INFRA } from "baluni/dist/api";
import erc20Abi from "baluni/dist/api/abis/common/ERC20.json";
import { Builder } from "baluni/dist/api/classes/builder";
import { QuoteParams } from "baluni/dist/api/odos/logics/logic.swap-token";
import { batchSwap } from "baluni/dist/core/common/uniswap/batchSwap";
import { TConfigReturn } from "baluni/dist/core/types/config";
import { BuildSwapOdosParams } from "baluni/dist/core/types/odos";
import { Tswap } from "baluni/dist/core/types/uniswap";
import { getTokenBalance } from "baluni/dist/core/utils/getTokenBalance";
import { getTokenMetadata } from "baluni/dist/core/utils/getTokenMetadata";
import { getTokenValue } from "baluni/dist/core/utils/getTokenValue";
import { fetchPrices } from "baluni/dist/core/utils/quote1Inch";
import { DexWallet } from "baluni/dist/core/utils/web3/dexWallet";
import { waitForTx } from "baluni/dist/core/utils/web3/networkUtils";
import { BigNumber, Contract, ethers } from "ethers";
import { formatEther, formatUnits } from "ethers/lib/utils";

interface RebalanceStats {
  totalPortfolioValue: BigNumber;
  currentAllocations: { [token: string]: number };
  adjustments: Array<{
    token: string;
    action: string;
    differencePercentage: number;
    valueToRebalance: BigNumber;
  }>;
}

let config: TConfigReturn;

export async function rebalancePortfolio(
  dexWallet: DexWallet,
  desiredTokens: string[],
  desiredAllocations: { [token: string]: number },
  usdcAddress: string,
  walletProvider: ethers.providers.JsonRpcProvider,
) {
  config = await updateConfig(
    desiredTokens,
    desiredAllocations,
    walletProvider.network.chainId,
    false,
    {},
    0,
    false,
    false,
  );

  console.log("**************************************************************************");
  console.log("⚖️  Rebalance Portfolio\n", "🔋 Check Gas and Recharge\n");
  let totalPortfolioValue = BigNumber.from(0);

  console.log("🏦 Total Portfolio Value (in USDT) at Start: ", formatEther(totalPortfolioValue));

  const swapsSell: Tswap[] = [];
  const swapsBuy: Tswap[] = [];
  const tokenValues: { [token: string]: BigNumber } = {};
  const provider = walletProvider;

  // First, calculate the current value of each token in the portfolio
  for (const token of desiredTokens) {
    const tokenContract = new ethers.Contract(token, erc20Abi, provider);
    const tokenMetadata = await getTokenMetadata(token, dexWallet.walletProvider);
    const _tokenbalance = await getTokenBalance(dexWallet.walletProvider, dexWallet.walletAddress, token);
    const tokenBalance = _tokenbalance.balance;
    const decimals = tokenMetadata.decimals;
    const tokenSymbol = await tokenContract.symbol();
    const tokenValue = await getTokenValue(
      tokenSymbol,
      token,
      tokenBalance,
      decimals,
      usdcAddress,
      String(dexWallet.walletProvider.network.chainId),
    );
    tokenSymbol == "USDC" ? tokenValue.mul(1e12) : tokenValue;
    tokenValues[token] = tokenValue;
    totalPortfolioValue = totalPortfolioValue.add(tokenValue);
  }

  console.log("🏦 Total Portfolio Value (in USDT): ", formatEther(totalPortfolioValue));

  // Calculate the current allocations
  const currentAllocations: { [token: string]: number } = {};

  Object.keys(tokenValues).forEach(token => {
    currentAllocations[token] = tokenValues[token].mul(10000).div(totalPortfolioValue).toNumber(); // Store as percentage
  });

  // Segregate tokens into sell and buy lists
  const tokensToSell = [];
  const tokensToBuy = [];

  // Find token to sell and buy
  for (const token of desiredTokens) {
    const currentAllocation = currentAllocations[token]; // current allocation as percentage
    const desiredAllocation = desiredAllocations[token];
    const difference = desiredAllocation - currentAllocation; // Calculate the difference for each token
    const tokenMetadata = await getTokenMetadata(token, dexWallet.walletProvider);
    const tokenDecimals = tokenMetadata.decimals;

    const _tokenBalance = await getTokenBalance(dexWallet.walletProvider, dexWallet.walletAddress, token);
    const tokenBalance = _tokenBalance.balance;
    const tokenSymbol = tokenMetadata.symbol;
    console.log("tokenBalance", tokenBalance.toString());
    console.log("tokenSymbol", tokenSymbol);
    console.log("token", token);
    console.log("difference", difference);
    console.log("Current Allocation", currentAllocation);
    console.log("Desired Allocation", desiredAllocation);
    const valueToRebalance = totalPortfolioValue.mul(BigNumber.from(Math.abs(difference))).div(10000); // USDT value to rebalance

    const formattedBalance = formatUnits(tokenBalance, tokenDecimals);
    console.group(`🪙  Token: ${token}`);
    console.log(`📊 Current Allocation: ${currentAllocation}%`);
    console.log(`💰 Difference: ${difference}%`);
    console.log(`💲 Value (USD): ${formatEther(tokenValues[token])}`);
    console.log(`⚖️  Value to Rebalance (USD): ${formatEther(valueToRebalance)}`);
    console.log(`👛 Balance: ${formattedBalance} ${tokenSymbol}`);
    console.groupEnd();

    if (difference < 0 && Math.abs(difference) > config?.LIMIT) {
      // Calculate token amount to sell
      //const tokenPriceInUSDT = await quotePair(token, usdcAddress);
      const tokenMetadata = await getTokenMetadata(token, dexWallet.walletProvider);
      const decimals = tokenMetadata.decimals;
      const _token = {
        address: token,
        decimals: decimals,
      };

      const tokenPriceInUSDT: number = await fetchPrices(_token, String(walletProvider.network.chainId)); // Ensure this returns a value
      const pricePerToken = ethers.utils.parseUnits(tokenPriceInUSDT!.toString(), "ether");

      const tokenAmountToSell = valueToRebalance.mul(BigNumber.from(10).pow(decimals)).div(pricePerToken);

      tokensToSell.push({ token, amount: tokenAmountToSell });
    } else if (difference > 0 && Math.abs(difference) > config?.LIMIT) {
      // For buying, we can use valueToRebalance directly as we will be spending USDT
      tokensToBuy.push({ token, amount: valueToRebalance.div(1e12) });
    }
  }

  // Sell Tokens
  for (const { token, amount } of tokensToSell) {
    console.info(`🔴 Selling ${formatEther(amount)} worth of ${token}`);
    const tokenContract = new Contract(token, erc20Abi, dexWallet.wallet);

    const tokenSymbol = await tokenContract.symbol();
    const tokenDecimal = await tokenContract.decimals();

    const intAmount = Number(formatUnits(amount, tokenDecimal));

    const swap: Tswap = {
      dexWallet,
      token0: tokenSymbol,
      token1: "USDC.E",
      reverse: false,
      protocol: config?.SELECTED_PROTOCOL,
      chainId: config?.SELECTED_CHAINID,
      amount: String(intAmount),
      slippage: Number(config?.SLIPPAGE),
    };
    swapsSell.push(swap);
  }

  // Buy Tokens
  for (const { token, amount } of tokensToBuy) {
    if (token === usdcAddress) {
      console.log("SKIP USDC BUY");
      break;
    }
    console.info(`🟩 Buying ${Number(amount) / 1e6} USDC worth of ${token}`);
    const tokenCtx = new Contract(token, erc20Abi, dexWallet.wallet);
    const intAmount = Number(formatUnits(amount, 6));
    const tokenSym = await tokenCtx.symbol();

    const swap: Tswap = {
      dexWallet: dexWallet,
      token0: tokenSym,
      token1: "USDC.E",
      reverse: true,
      protocol: config?.SELECTED_PROTOCOL,
      chainId: config?.SELECTED_CHAINID,
      amount: String(intAmount),
      slippage: Number(config?.SLIPPAGE),
    };
    swapsBuy.push(swap);
  }

  console.log("__________________", swapsSell);

  if (swapsSell.length !== 0) {
    try {
      console.log("🔄 Swaps");
      await batchSwap(swapsSell);
    } catch (e) {
      console.log(e);
    }
  }

  if (swapsBuy.length !== 0) {
    try {
      console.log("🔄 Swaps");
      await batchSwap(swapsBuy);
    } catch (e) {
      console.log(e);
    }
  }

  console.log("✔️ Rebalance completed.");
}

export async function calculateRebalanceStats(
  dexWallet: DexWallet,
  desiredTokens: string[],
  desiredAllocations: { [token: string]: number },
  usdcAddress: string,
  walletProvider: ethers.providers.JsonRpcProvider,
) {
  try {
    console.log("**************************************************************************");
    console.log("📊 Calculating Rebalance Statistics");

    let totalPortfolioValue = BigNumber.from(0);
    const tokenValues: { [token: string]: BigNumber } = {};
    // Calculate the current value of each token in the portfolio
    for (const token of desiredTokens) {
      const tokenMetadata = await getTokenMetadata(token, walletProvider);
      const _tokenbalance = await getTokenBalance(walletProvider, dexWallet.walletAddress, token);
      const tokenBalance = _tokenbalance.balance;
      console.log(tokenBalance);

      const tokenValue = await getTokenValue(
        tokenMetadata.symbol as string,
        token,
        tokenBalance,
        tokenMetadata.decimals,
        usdcAddress,
        String(walletProvider.network.chainId),
      );
      tokenValues[token] = tokenValue;
      totalPortfolioValue = totalPortfolioValue.add(tokenValue);
    }

    console.log("🏦 Total Portfolio Value (in USDT): ", formatEther(totalPortfolioValue));

    // Calculate the current allocations
    const currentAllocations: { [token: string]: number } = {};
    Object.keys(tokenValues).forEach(token => {
      currentAllocations[token] = tokenValues[token].mul(10000).div(totalPortfolioValue).toNumber(); // Store as percentage
    });

    const rebalanceStats: RebalanceStats = {
      totalPortfolioValue: totalPortfolioValue,
      currentAllocations: currentAllocations,
      adjustments: [],
    };

    // Determine adjustments for rebalancing
    for (const token of desiredTokens) {
      const currentAllocation = currentAllocations[token];
      const desiredAllocation = desiredAllocations[token];
      const difference = desiredAllocation - currentAllocation;
      const valueToRebalance = totalPortfolioValue.mul(BigNumber.from(Math.abs(difference))).div(10000); // USDT value to rebalance

      if (Math.abs(difference) > 0) {
        rebalanceStats.adjustments.push({
          token: token,
          action: difference > 0 ? "Buy" : "Sell",
          differencePercentage: difference,
          valueToRebalance: valueToRebalance,
        });
      }
    }

    return rebalanceStats;
  } catch (e) {
    return { error: e };
  }
}

/* export async function rebalancePortfolioOdos(
  dexWallet: DexWallet,
  desiredTokens: string[],
  desiredAllocations: { [token: string]: number },
  usdcAddress: string,
  slippage: number,
) {
  config = await updateConfig(
    desiredTokens,
    desiredAllocations,
    dexWallet.walletProvider.network.chainId,
    false,
    {},
    0,
    false,
    false,
  );
  console.log("⚖️  Rebalance Portfolio\n");

  const builder = new Builder(dexWallet.wallet);
  builder.setup(dexWallet.walletProvider.network.chainId);

  const gas = await dexWallet?.walletProvider?.getGasPrice();
  const chainId = dexWallet.walletProvider.network.chainId;

  const tokenValues: { [token: string]: BigNumber } = {};
  let totalPortfolioValue = BigNumber.from(0);

  console.log(`🏦 Total Portfolio Value (in USDT) at Start: ${String(formatEther(totalPortfolioValue))}`);

  // Calculate Total Portfolio Value
  // --------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------

  console.log("📊 Calculate Total Portfolio Value");

  for (const token of desiredTokens) {
    const tokenContract = new ethers.Contract(token, erc20Abi, dexWallet.wallet);
    const tokenMetadata = await getTokenMetadata(token, dexWallet.walletProvider);
    const _tokenbalance = await getTokenBalance(dexWallet.walletProvider, dexWallet.walletAddress, token);
    const tokenBalance = _tokenbalance.balance;
    const decimals = tokenMetadata.decimals;
    const tokenSymbol = await tokenContract?.symbol();
    const currentValue = await getTokenValue(tokenSymbol, token, tokenBalance, decimals, config?.USDC, String(chainId));

    tokenValues[token] = currentValue;
    totalPortfolioValue = totalPortfolioValue.add(currentValue);
  }

  console.log(`🏦 Total Portfolio Value (in USDT): ", ${String(formatEther(totalPortfolioValue))}`);

  const currentAllocations: { [token: string]: number } = {};
  const tokensToSell = [];
  let tokensToBuy = [];

  Object.keys(tokenValues).forEach(token => {
    currentAllocations[token] = tokenValues[token].mul(10000).div(totalPortfolioValue).toNumber(); // Store as percentage
  });

  // Rebalance
  // --------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------

  console.log("📊 Rebalance Portfolio");

  for (const token of desiredTokens) {
    const currentAllocation = currentAllocations[token];
    const desiredAllocation = desiredAllocations[token];
    const difference = desiredAllocation - currentAllocation;
    const tokenMetadata = await getTokenMetadata(token, dexWallet.walletProvider);
    const tokenDecimals = tokenMetadata.decimals;
    const _tokenBalance = await getTokenBalance(dexWallet.walletProvider, dexWallet.walletAddress, token);
    const tokenSymbol: string = tokenMetadata.symbol as string;

    const tokenBalance = _tokenBalance.balance;

    const valueToRebalance = totalPortfolioValue.mul(BigNumber.from(Math.abs(difference))).div(10000);

    const formattedBalance = formatUnits(tokenBalance, tokenDecimals);

    console.group(`🪙  Token: ${token}`);
    console.log(`📊 Current Allocation: ${currentAllocation}%`);
    console.log(`💰 Difference: ${difference}%`);
    console.log(`💲 Value (USD): ${formatEther(tokenValues[token])}`);
    console.log(`⚖️  Value to Rebalance (USD): ${formatEther(valueToRebalance)}`);
    console.log(`👛 Balance: ${formattedBalance} ${tokenSymbol}`);
    console.groupEnd();

    if (difference < 0 && Math.abs(difference) > config?.LIMIT) {
      const tokenMetadata = await getTokenMetadata(token, dexWallet?.walletProvider);
      const decimals = tokenMetadata.decimals;
      const _token = {
        address: token,
        decimals: decimals,
      };
      const tokenPriceInUSDT: number = await fetchPrices(_token, String(chainId)); // Ensure this returns a value
      const pricePerToken = ethers.utils.parseUnits(tokenPriceInUSDT!.toString(), "ether");
      const tokenAmountToSell = valueToRebalance.mul(BigNumber.from(10).pow(decimals)).div(pricePerToken);
      console.log(`🔴 Amount To Sell ${formatEther(tokenAmountToSell)} ${tokenSymbol}`);
      tokensToSell.push({ token, amount: tokenAmountToSell });
    } else if (difference > 0 && Math.abs(difference) > config?.LIMIT) {
      tokensToBuy.push({ token, amount: valueToRebalance.div(1e12) });
    }
  }

  // Quote ODOS
  const quoteRequestBody = {
    chainId: Number(chainId), // Replace with desired chainId
    inputTokens: [] as { tokenAddress: string; amount: string }[],
    outputTokens: [] as { tokenAddress: string; proportion: number }[],
    userAddr: "0x",
    slippageLimitPercent: Number(slippage), // set your slippage limit percentage (1 = 1%),
    referralCode: 3844415834, // referral code (recommended)
    disableRFQs: true,
    compact: true,
  };

  // Sell Tokens
  // --------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------

  console.log("🔄 Sell Tokens");
  for (const { token, amount: amountWei } of tokensToSell) {
    try {
      const tokenContract = new Contract(token, erc20Abi, dexWallet.wallet);
      const tokenSymbol = await tokenContract.symbol();
      const tokenDecimal = await tokenContract.decimals();

      console.log(`🔴 Selling ${formatUnits(amountWei, tokenDecimal)} worth of ${tokenSymbol}`);
      const tokenBalance = await getTokenBalance(dexWallet.walletProvider, dexWallet.walletAddress, token);
      const balance = tokenBalance.balance;

      // Sell token if RSI and StochRSI are overbought
      if (BigNumber.from(amountWei).lt(balance) || BigNumber.from(amountWei).eq(balance))
        if (!quoteRequestBody.inputTokens) {
          quoteRequestBody.inputTokens = [];
        }

      quoteRequestBody.inputTokens.push({
        amount: String(amountWei),
        tokenAddress: token,
      });
      console.log("Input Token Added");
    } catch (e) {
      console.log(e);
    }
  }

  // Buy Tokens
  // --------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------

  console.log("🔄 Buy Tokens");

  let totalAmountWei = BigNumber.from(0);
  const existTokenToSell = quoteRequestBody.inputTokens.length > 0;

  if (existTokenToSell) {
    tokensToBuy.forEach(token => {
      totalAmountWei = totalAmountWei.add(token.amount);
    });

    quoteRequestBody.inputTokens.map(token => {
      if (token.tokenAddress === usdcAddress) {
        token.amount = String(totalAmountWei);
      }
    });

    let totalProportion = 0;

    for (const { token, amount: amountWei } of tokensToBuy) {
      console.log(`🟩 Buying ${Number(amountWei) / 1e6} USDC worth of ${token}`);

      const tokenCtx = new Contract(token, erc20Abi, dexWallet.wallet);
      const tokenSym = await tokenCtx.symbol();
      console.log("Condition met for buying", tokenSym);
      quoteRequestBody.outputTokens.push({
        tokenAddress: token,
        proportion: Number(amountWei) / Number(totalAmountWei),
      });
      totalProportion += Number(amountWei) / Number(totalAmountWei);
    }

    if (totalProportion != 1) {
      console.error("⚠️ Total proportion is greater than 1 or less than 1", totalProportion);
      tokensToBuy = [];
    }
  } else {
    console.log("No Tokens To Sell");
  }

  // Build Swap Odos
  // --------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------

  try {
    if (quoteRequestBody.inputTokens.length === 0 || quoteRequestBody.outputTokens.length === 0) {
      console.log("📡 No tokens to sell or buy");
    } else {
      quoteRequestBody.userAddr = dexWallet.walletAddress;

      const builder = new Builder(dexWallet.wallet);
      await builder.setup(chainId);

      const params: QuoteParams = {
        userAddr: builder.agentAddress,
        chainId: chainId,
        inputTokens: quoteRequestBody.inputTokens,
        outputTokens: quoteRequestBody.outputTokens,
        slippageLimitPercent: Number(quoteRequestBody.slippageLimitPercent),
      };

      const swap_logics = new SwapTokenLogic(dexWallet.wallet);
      swap_logics.setup(chainId);

      console.log("🛠️ Builder:", builder);

      const quote = await swap_logics.quote(params);
      console.log("📡 Quote:", quote);

      const logicsData = await swap_logics.build(builder.sender, builder.agentAddress, quote);
      console.log("📡 Logics Data:", logicsData);

      const builderData = await builder.buildTransaction(
        logicsData.approvals,
        logicsData.calldatas,
        logicsData.inputs,
        logicsData.outputs,
      );
      console.log("📡 Builder Data:", builderData);

      if (builderData?.approvals.length > 0) {
        console.log("📡 Approvals");
        const approvals = builderData.approvals;

        for (const approval of approvals) {
          const approvalTx = await dexWallet.wallet.sendTransaction(approval);
          const broadcaster = await waitForTx(dexWallet.walletProvider, approvalTx?.hash, dexWallet.walletAddress);
          console.log(`📡 Approval broadcasted: ${broadcaster}`);
        }
      }

      if (builderData?.calldatas.length > 0) {
        console.log("📡 Calldatas");

        const simulate = await builder.baluniRouterCtx.callStatic.execute(
          builderData?.calldatas,
          builderData?.tokens_return,
        );

        if ((await simulate) === false) return console.log("📡 Simulation failed");

        console.log(`📡  Simulation successful:: ${simulate}`);

        if (!simulate) return console.log("📡 Simulation failed");

        const calldata = builder.baluniRouterCtx.interface.encodeFunctionData("execute", [
          builderData.calldatas,
          builderData.tokens_return,
        ]);

        const tx = {
          to: builder.baluniRouterCtx.address,
          value: 0,
          data: calldata,
          gasPrice: gas,
        };

        const executeTx = await dexWallet.wallet.sendTransaction(tx);
        const broadcaster = await waitForTx(dexWallet.walletProvider, executeTx?.hash, dexWallet.walletAddress);
        console.log(`📡 Tx broadcasted:: ${broadcaster}`);
      }
    }
  } catch (e) {
    console.log(e);
  }
} */

export async function rebalancePortfolioOdos(
  dexWallet: DexWallet,
  desiredTokens: string[],
  desiredAllocations: { [token: string]: number },
  usdcAddress: string,
  slippage: number,
) {
  config = await updateConfig(
    desiredTokens,
    desiredAllocations,
    dexWallet.walletProvider.network.chainId,
    false,
    {},
    0,
    false,
    false,
  );
  console.log("⚖️  Rebalance Portfolio\n");

  const registerAddress = INFRA[dexWallet.walletProvider.network.chainId].REGISTRY;
  const registryCtx = new Contract(registerAddress, registryAbi.abi, dexWallet.wallet);
  const baluniRebalancer = await registryCtx.baluniRebalancer();
  const rebalancerCtx = new Contract(baluniRebalancer, rebalancerAbi.abi, dexWallet.wallet);

  const builder = new Builder(dexWallet.wallet);
  builder.setup(dexWallet.walletProvider.network.chainId);

  const gas = await dexWallet?.walletProvider?.getGasPrice();
  const chainId = dexWallet.walletProvider.network.chainId;

  const tokenValues: { [token: string]: BigNumber } = {};
  let totalPortfolioValue = BigNumber.from(0);

  console.log(`🏦 Total Portfolio Value (in USDT) at Start: ${String(formatEther(totalPortfolioValue))}`);

  // Calculate Total Portfolio Value
  // --------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------

  console.log("📊 Calculate Total Portfolio Value");

  for (const token of desiredTokens) {
    const tokenContract = new ethers.Contract(token, erc20Abi, dexWallet.wallet);
    const tokenMetadata = await getTokenMetadata(token, dexWallet.walletProvider);
    const _tokenbalance = await getTokenBalance(dexWallet.walletProvider, dexWallet.walletAddress, token);
    const tokenBalance = _tokenbalance.balance;
    const decimals = tokenMetadata.decimals;
    const tokenSymbol = await tokenContract?.symbol();
    const currentValue = await getTokenValue(tokenSymbol, token, tokenBalance, decimals, config?.USDC, String(chainId));

    tokenValues[token] = currentValue;
    totalPortfolioValue = totalPortfolioValue.add(currentValue);
  }

  console.log(`🏦 Total Portfolio Value (in USDT): ", ${String(formatEther(totalPortfolioValue))}`);

  const currentAllocations: { [token: string]: number } = {};
  const tokensToSell = [];
  let tokensToBuy = [];

  Object.keys(tokenValues).forEach(token => {
    currentAllocations[token] = tokenValues[token].mul(10000).div(totalPortfolioValue).toNumber(); // Store as percentage
  });

  // Rebalance
  // --------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------

  console.log("📊 Rebalance Portfolio");

  const amountAllocaton = Object.values(desiredAllocations);

  const rebalanceData = await rebalancerCtx.checkRebalance(
    [],
    desiredTokens,
    amountAllocaton,
    500,
    dexWallet.walletAddress,
    await registryCtx.USDC(),
  );

  console.log(rebalanceData);

  for (let i = 0; i < rebalanceData.overweightVaults.length; i++) {
    tokensToSell.push({
      token: desiredTokens[Number(rebalanceData.overweightVaults[i])],
      amount: rebalanceData.overweightAmounts[i],
    });
  }

  // for (const token of desiredTokens) {
  //   const currentAllocation = currentAllocations[token];
  //   const desiredAllocation = desiredAllocations[token];
  //   const difference = desiredAllocation - currentAllocation;
  //   const tokenMetadata = await getTokenMetadata(token, dexWallet.walletProvider);
  //   const tokenDecimals = tokenMetadata.decimals;
  //   const _tokenBalance = await getTokenBalance(dexWallet.walletProvider, dexWallet.walletAddress, token);
  //   const tokenSymbol: string = tokenMetadata.symbol as string;

  //   const tokenBalance = _tokenBalance.balance;

  //   const valueToRebalance = totalPortfolioValue.mul(BigNumber.from(Math.abs(difference))).div(10000);

  //   const formattedBalance = formatUnits(tokenBalance, tokenDecimals);

  //   console.group(`🪙  Token: ${token}`);
  //   console.log(`📊 Current Allocation: ${currentAllocation}%`);
  //   console.log(`💰 Difference: ${difference}%`);
  //   console.log(`💲 Value (USD): ${formatEther(tokenValues[token])}`);
  //   console.log(`⚖️  Value to Rebalance (USD): ${formatEther(valueToRebalance)}`);
  //   console.log(`👛 Balance: ${formattedBalance} ${tokenSymbol}`);
  //   console.groupEnd();

  //   if (difference < 0 && Math.abs(difference) > config?.LIMIT) {
  //     const tokenMetadata = await getTokenMetadata(token, dexWallet?.walletProvider);
  //     const decimals = tokenMetadata.decimals;
  //     const _token = {
  //       address: token,
  //       decimals: decimals,
  //     };
  //     const tokenPriceInUSDT: number = await fetchPrices(_token, String(chainId)); // Ensure this returns a value
  //     const pricePerToken = ethers.utils.parseUnits(tokenPriceInUSDT!.toString(), "ether");
  //     const tokenAmountToSell = valueToRebalance.mul(BigNumber.from(10).pow(decimals)).div(pricePerToken);
  //     console.log(`🔴 Amount To Sell ${formatEther(tokenAmountToSell)} ${tokenSymbol}`);
  //     tokensToSell.push({ token, amount: tokenAmountToSell });
  //   } else if (difference > 0 && Math.abs(difference) > config?.LIMIT) {
  //     tokensToBuy.push({ token, amount: valueToRebalance.div(1e12) });
  //   }
  // }

  // Quote ODOS
  const quoteRequestBody = {
    chainId: Number(chainId), // Replace with desired chainId
    inputTokens: [] as { tokenAddress: string; amount: string }[],
    outputTokens: [] as { tokenAddress: string; proportion: number }[],
    userAddr: "0x",
    slippageLimitPercent: Number(slippage), // set your slippage limit percentage (1 = 1%),
    referralCode: 3844415834, // referral code (recommended)
    disableRFQs: true,
    compact: true,
  };

  // Sell Tokens
  // --------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------

  console.log("🔄 Sell Tokens");

  console.log("Tokens to sell", tokensToSell);

  for (const { token: token, amount: amountWei } of tokensToSell) {
    try {
      const tokenContract = new Contract(token, erc20Abi, dexWallet.wallet);
      const tokenSymbol = await tokenContract.symbol();
      const tokenDecimal = await tokenContract.decimals();

      console.log(`🔴 Selling ${formatUnits(amountWei, tokenDecimal)} worth of ${tokenSymbol}`);
      const tokenBalance = await getTokenBalance(dexWallet.walletProvider, dexWallet.walletAddress, token);
      const balance = tokenBalance.balance;

      if (BigNumber.from(amountWei).lt(balance) || BigNumber.from(amountWei).eq(balance))
        if (!quoteRequestBody.inputTokens) {
          quoteRequestBody.inputTokens = [];
        }

      quoteRequestBody.inputTokens.push({
        tokenAddress: token,
        amount: String(Number(amountWei)),
      });
      console.log("Input Token Added");
    } catch (e) {
      console.log(e);
    }
  }

  // Buy Tokens
  // --------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------

  console.log("🔄 Buy Tokens");

  let totalAmountWei = BigNumber.from(0);
  const existTokenToSell = quoteRequestBody.inputTokens.length > 0;

  for (let i = 0; i < rebalanceData.underweightVaults.length; i++) {
    tokensToBuy.push({
      token: desiredTokens[Number(rebalanceData.underweightVaults[i])],
      amount: rebalanceData.underweightAmounts[i],
    });
  }

  if (existTokenToSell) {
    tokensToBuy.forEach(token => {
      totalAmountWei = totalAmountWei.add(token.amount);
    });

    quoteRequestBody.inputTokens.map(token => {
      if (token.tokenAddress === usdcAddress) {
        token.amount = String(totalAmountWei);
      }
    });

    let totalProportion = 0;

    for (const { token, amount: amountWei } of tokensToBuy) {
      console.log(`🟩 Buying ${Number(amountWei) / 1e6} USDC worth of ${token}`);

      const tokenCtx = new Contract(token, erc20Abi, dexWallet.wallet);
      const tokenSym = await tokenCtx.symbol();
      console.log("Condition met for buying", tokenSym);
      quoteRequestBody.outputTokens.push({
        tokenAddress: token,
        proportion: Number(amountWei) / Number(totalAmountWei),
      });
      totalProportion += Number(amountWei) / Number(totalAmountWei);
    }

    if (totalProportion != 1) {
      console.error("⚠️ Total proportion is greater than 1 or less than 1", totalProportion);
      tokensToBuy = [];
    }
  } else {
    console.log("No Tokens To Sell");
  }

  // Build Swap Odos
  // --------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------

  try {
    if (quoteRequestBody.inputTokens.length === 0 || quoteRequestBody.outputTokens.length === 0) {
      console.log("📡 No tokens to sell or buy");
    } else {
      quoteRequestBody.userAddr = dexWallet.walletAddress;

      const builder = new Builder(dexWallet.wallet);
      await builder.setup(chainId);

      const params: QuoteParams = {
        userAddr: builder.agentAddress,
        chainId: chainId,
        inputTokens: quoteRequestBody.inputTokens,
        outputTokens: quoteRequestBody.outputTokens,
        slippageLimitPercent: Number(quoteRequestBody.slippageLimitPercent),
      };

      const swap_logics = new SwapTokenLogic(dexWallet.wallet);
      swap_logics.setup(chainId);

      console.log("🛠️ Builder:", builder);

      const quote = await swap_logics.quote(params);
      console.log("📡 Quote:", quote);

      const logicsData = await swap_logics.build(builder.sender, builder.agentAddress, quote);
      console.log("📡 Logics Data:", logicsData);

      const builderData = await builder.buildTransaction(
        logicsData.approvals,
        logicsData.calldatas,
        logicsData.inputs,
        logicsData.outputs,
      );
      console.log("📡 Builder Data:", builderData);

      if (builderData?.approvals.length > 0) {
        console.log("📡 Approvals");
        const approvals = builderData.approvals;

        for (const approval of approvals) {
          const approvalTx = await dexWallet.wallet.sendTransaction(approval);
          const broadcaster = await waitForTx(dexWallet.walletProvider, approvalTx?.hash, dexWallet.walletAddress);
          console.log(`📡 Approval broadcasted: ${broadcaster}`);
        }
      }

      if (builderData?.calldatas.length > 0) {
        console.log("📡 Calldatas");

        const simulate = await builder.baluniRouterCtx.callStatic.execute(
          builderData?.calldatas,
          builderData?.tokens_return,
        );

        if ((await simulate) === false) return console.log("📡 Simulation failed");

        console.log(`📡  Simulation successful:: ${simulate}`);

        if (!simulate) return console.log("📡 Simulation failed");

        const calldata = builder.baluniRouterCtx.interface.encodeFunctionData("execute", [
          builderData.calldatas,
          builderData.tokens_return,
        ]);

        const tx = {
          to: builder.baluniRouterCtx.address,
          value: 0,
          data: calldata,
          gasPrice: gas,
        };

        const executeTx = await dexWallet.wallet.sendTransaction(tx);
        const broadcaster = await waitForTx(dexWallet.walletProvider, executeTx?.hash, dexWallet.walletAddress);
        console.log(`📡 Tx broadcasted:: ${broadcaster}`);
      }
    }
  } catch (e) {
    console.log(e);
  }
}

export async function rebalancePortfolioOdosParams(
  dexWallet: DexWallet,
  desiredTokens: string[],
  desiredAllocations: { [token: string]: number },
  usdcAddress: string,
  slippage: number,
) {
  config = await updateConfig(
    desiredTokens,
    desiredAllocations,
    dexWallet.walletProvider.network.chainId,
    false,
    {},
    0,
    false,
    false,
  );
  console.log("⚖️  Rebalance Portfolio\n");

  const chainId = dexWallet.walletProvider.network.chainId;
  const tokenValues: { [token: string]: BigNumber } = {};

  let totalPortfolioValue = BigNumber.from(0);

  console.log(`🏦 Total Portfolio Value (in USDT) at Start: ${String(formatEther(totalPortfolioValue))}`);

  // Calculate Total Portfolio Value
  // --------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------

  console.log("📊 Calculate Total Portfolio Value");

  for (const token of desiredTokens) {
    const tokenContract = new ethers.Contract(token, erc20Abi, dexWallet.wallet);
    const tokenMetadata = await getTokenMetadata(token, dexWallet.walletProvider);
    const _tokenbalance = await getTokenBalance(dexWallet.walletProvider, dexWallet.walletAddress, token);
    const tokenBalance = _tokenbalance.balance;
    const decimals = tokenMetadata.decimals;
    const tokenSymbol = await tokenContract?.symbol();

    const currentValue = await getTokenValue(tokenSymbol, token, tokenBalance, decimals, config?.USDC, String(chainId));

    tokenValues[token] = currentValue;
    totalPortfolioValue = totalPortfolioValue.add(currentValue);
  }

  console.log(`🏦 Total Portfolio Value (in USDT): ", ${String(formatEther(totalPortfolioValue))}`);

  const currentAllocations: { [token: string]: number } = {};

  const tokensToSell = [];
  let tokensToBuy = [];

  Object.keys(tokenValues).forEach(token => {
    currentAllocations[token] = tokenValues[token].mul(10000).div(totalPortfolioValue).toNumber(); // Store as percentage
  });

  // Rebalance
  // --------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------

  console.log("📊 Rebalance Portfolio");

  for (const token of desiredTokens) {
    const currentAllocation = currentAllocations[token];
    const desiredAllocation = desiredAllocations[token];
    const difference = desiredAllocation - currentAllocation;
    const tokenMetadata = await getTokenMetadata(token, dexWallet.walletProvider);
    const tokenDecimals = tokenMetadata.decimals;
    const _tokenBalance = await getTokenBalance(dexWallet.walletProvider, dexWallet.walletAddress, token);
    const tokenSymbol: string = tokenMetadata.symbol as string;
    const tokenBalance = _tokenBalance.balance;
    const valueToRebalance = totalPortfolioValue.mul(BigNumber.from(Math.abs(difference))).div(10000);
    const formattedBalance = formatUnits(tokenBalance, tokenDecimals);

    console.group(`🪙  Token: ${token}`);
    console.log(`📊 Current Allocation: ${currentAllocation}%`);
    console.log(`💰 Difference: ${difference}%`);
    console.log(`💲 Value (USD): ${formatEther(tokenValues[token])}`);
    console.log(`⚖️  Value to Rebalance (USD): ${formatEther(valueToRebalance)}`);
    console.log(`👛 Balance: ${formattedBalance} ${tokenSymbol}`);
    console.groupEnd();

    if (difference < 0 && Math.abs(difference) > config?.LIMIT) {
      const tokenMetadata = await getTokenMetadata(token, dexWallet?.walletProvider);
      const decimals = tokenMetadata.decimals;
      const _token = {
        address: token,
        decimals: decimals,
      };
      const tokenPriceInUSDT: number = await fetchPrices(_token, String(chainId)); // Ensure this returns a value
      const pricePerToken = ethers.utils.parseUnits(tokenPriceInUSDT!.toString(), "ether");
      const tokenAmountToSell = valueToRebalance.mul(BigNumber.from(10).pow(decimals)).div(pricePerToken);
      console.log(`🔴 Amount To Sell ${formatEther(tokenAmountToSell)} ${tokenSymbol}`);
      tokensToSell.push({ token, amount: tokenAmountToSell });
    } else if (difference > 0 && Math.abs(difference) > config?.LIMIT) {
      tokensToBuy.push({ token, amount: valueToRebalance.div(1e12) });
    }
  }

  // Quote ODOS
  const quoteRequestBody = {
    chainId: Number(chainId), // Replace with desired chainId
    inputTokens: [] as { tokenAddress: string; amount: string }[],
    outputTokens: [] as { tokenAddress: string; proportion: string | number }[],
    userAddr: "0x",
    slippageLimitPercent: slippage, // set your slippage limit percentage (1 = 1%),
    referralCode: 3844415834, // referral code (recommended)
    disableRFQs: true,
    compact: true,
  };

  // Sell Tokens
  // --------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------

  console.log("🔄 Sell Tokens");
  for (const { token, amount: amountWei } of tokensToSell) {
    try {
      const tokenContract = new Contract(token, erc20Abi, dexWallet.wallet);
      const tokenSymbol = await tokenContract.symbol();
      const tokenDecimal = await tokenContract.decimals();

      console.log(`🔴 Selling ${formatUnits(amountWei, tokenDecimal)} worth of ${tokenSymbol}`);
      const tokenBalance = await getTokenBalance(dexWallet.walletProvider, dexWallet.walletAddress, token);
      const balance = tokenBalance.balance;

      // Sell token if RSI and StochRSI are overbought
      if (BigNumber.from(amountWei).lt(balance) || BigNumber.from(amountWei).eq(balance))
        if (!quoteRequestBody.inputTokens) {
          quoteRequestBody.inputTokens = [];
        }

      quoteRequestBody.inputTokens.push({
        amount: String(amountWei),
        tokenAddress: token,
      });
      console.log("Input Token Added");
    } catch (e) {
      console.log(e);
    }
  }

  // Buy Tokens
  // --------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------

  console.log("🔄 Buy Tokens");

  let totalAmountWei = BigNumber.from(0);
  const existTokenToSell = quoteRequestBody.inputTokens.length > 0;

  if (existTokenToSell) {
    tokensToBuy.forEach(token => {
      totalAmountWei = totalAmountWei.add(token.amount);
    });

    quoteRequestBody.inputTokens.map(token => {
      if (token.tokenAddress === usdcAddress) {
        token.amount = String(totalAmountWei);
      }
    });

    let totalProportion = 0;

    for (const { token, amount: amountWei } of tokensToBuy) {
      console.log(`🟩 Buying ${Number(amountWei) / 1e6} USDC worth of ${token}`);

      const tokenCtx = new Contract(token, erc20Abi, dexWallet.wallet);
      const tokenSym = await tokenCtx.symbol();
      console.log("Condition met for buying", tokenSym);
      quoteRequestBody.outputTokens.push({
        tokenAddress: token,
        proportion: String(Number(amountWei) / Number(totalAmountWei)),
      });
      totalProportion += Number(amountWei) / Number(totalAmountWei);
    }

    if (totalProportion != 1) {
      console.error("⚠️ Total proportion is greater than 1 or less than 1", totalProportion);
      tokensToBuy = [];
    }
  } else {
    console.log("No Tokens To Sell");
  }

  // Build Swap Odos
  // --------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------

  try {
    if (quoteRequestBody.inputTokens.length === 0 || quoteRequestBody.outputTokens.length === 0) {
      console.log("📡 No tokens to sell or buy");
    } else {
      quoteRequestBody.userAddr = dexWallet.walletAddress;
      const params: BuildSwapOdosParams = {
        wallet: dexWallet.wallet,
        sender: dexWallet.walletAddress,
        chainId: String(chainId),
        inputTokens: quoteRequestBody.inputTokens,
        outputTokens: quoteRequestBody.outputTokens as { tokenAddress: string; proportion: number }[],
        slippageLimitPercent: Number(quoteRequestBody.slippageLimitPercent),
        referralCode: Number(quoteRequestBody.referralCode),
        disableRFQs: Boolean(quoteRequestBody.disableRFQs),
        compact: Boolean(quoteRequestBody.compact),
      };

      return params;
    }
  } catch (e) {
    console.log(e);
  }
}
