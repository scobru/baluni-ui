// import chalk from "chalk";
import ERC20_ABI from "../uniswap/contracts/ERC20.json";
import { DexWallet } from "./dexWallet";
import { PrettyConsole } from "./prettyConsole";
import { loadPrettyConsole } from "./prettyConsole";
import { Contract, ethers } from "ethers";

const prettyConsole = loadPrettyConsole();

export async function getTokenBalance(dexWallet: DexWallet, accountAddress: string, tokenAddress: string) {
  console.log(dexWallet);
  const provider = new ethers.providers.JsonRpcProvider(dexWallet.walletProvier.chain.rpcUrls.default.http[0]);
  const tokenContract = new Contract(tokenAddress, ERC20_ABI, provider);
  const decimals = await tokenContract.decimals();
  const symbol = await tokenContract.symbol();
  const rawBalance = await tokenContract.balanceOf(accountAddress);
  const formattedBalance = ethers.utils.formatUnits(rawBalance, decimals);

  // prettier-ignore
  prettyConsole.success((`Address: ${accountAddress} has ${formattedBalance} ${symbol}`));

  return { balance: rawBalance, formatted: formattedBalance };
}
