import { ApolloClient, InMemoryCache, gql } from "@apollo/client";
import dotenv from "dotenv";
import { BigNumber, Contract, ethers } from "ethers";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import contractsHyper from "baluni-hypervisor-contracts/deployments/deployedContracts.json";
import hyperFactoryAbi from "baluni-hypervisor-contracts/artifacts/contracts/HypervisorFactory.sol/HypervisorFactory.json";
import hyperVisoerAbi from "baluni-hypervisor-contracts/artifacts/contracts/Hypervisor.sol/Hypervisor.json";
import contractsBaluni from "baluni-contracts/deployments/deployedContracts.json";
import baluniOracleAbi from "baluni-contracts/artifacts/contracts/oracles/BaluniV1Oracle.sol/BaluniV1Oracle.json";
import { erc20Abi } from "viem";
import { formatUnits } from "ethers/lib/utils";
const univ3prices = require("@thanpolas/univ3prices");
import { setupRegistry } from "./setupRegistry";

dotenv.config();
const UNISWAP_GRAPHQL_ENDPOINT = process.env.UNISWAP_GRAPHQL_ENDPOINT;

let registryCtx: Contract | null | undefined = null;

if (!UNISWAP_GRAPHQL_ENDPOINT) {
  throw new Error(`Undefined ENV_VARIABLE: UNISWAP_GRAPHQL_ENDPOINT`);
}

const client = new ApolloClient({
  uri: UNISWAP_GRAPHQL_ENDPOINT,
  cache: new InMemoryCache(),
});

const provider = new ethers.providers.JsonRpcProvider(String(process.env.RPC_URL));
const signer = new ethers.Wallet(String(process.env.PRIVATE_KEY), provider);

export interface Token {
  id: string;
  name: string;
  symbol: string;
  totalValueLockedUSD?: string;
  totalSupply?: string;
  volumeUSD?: string;
  tokenDayData?: { priceUSD: string }[];
}

export interface Pool {
  id: string;
  token0: Token;
  token1: Token;
  totalValueLockedUSD: string;
  volumeUSD: string;
  feesUSD: string;
  sqrtPrice: string;
  poolDayData: { feesUSD: string; volumeUSD: string }[];
}

export interface PoolData {
  pools: Pool[];
}

export const GET_POOL_DATA = gql`
  query GetPoolData($orderBy: String) {
    pools(orderBy: $orderBy, orderDirection: desc) {
      id
      token0 {
        id
        name
        symbol
      }
      token1 {
        id
        name
        symbol
      }
      totalValueLockedUSD
      volumeUSD
      feesUSD
      sqrtPrice
      poolDayData {
        feesUSD
        volumeUSD
      }
    }
  }
`;

function calculateAPY(feesUSD: number, volumeUSD: number, periodInDays: number) {
  // return (feesUSD / volumeUSD) * (365 / periodInDays) * 100;

  return (feesUSD / volumeUSD) * 24;
}

const setupDatabase = async () => {
  const db = await open({
    filename: path.join(__dirname, "..", "baluniData.db"),
    driver: sqlite3.Database,
  });

  await db.exec(`
      CREATE TABLE IF NOT EXISTS hyperPoolsData (
        timestamp TEXT PRIMARY KEY NOT NULL,
        id TEXT,
        apy REAL,
        totalValueLockedUSD TEXT,
        volumeUSD TEXT,
        feesUSD TEXT,
        token0Symbol TEXT,
        token1Symbol TEXT,
        baseLower TEXT,
        baseUpper TEXT,
        limitLower TEXT,
        limitUpper TEXT,
        currentTick TEXT,
        basePosition TEXT,
        totalAmounts TEXT,
        limitPosition TEXT,
        totalSupply TEXT,
        baseLowerPrice REAL,
        baseUpperPrice REAL,
        limitLowerPrice REAL,
        limitUpperPrice REAL,
        currentPrice REAL,
        formattedPrice REAL,
        totalValuation REAL,
        unitPrice REAL,
      );
    `);

  return db;
};

const getHypervisors = async () => {
  const factory = new ethers.Contract(contractsHyper[137].BaluniV1HyperFactory, hyperFactoryAbi.abi, provider);
  const hypervisors = await factory?.getHypervisors();
  console.log("Fetched hypervisors:", hypervisors);
  return hypervisors;
};

const tickToPrice = (tick: number): number => {
  return Math.pow(1.0001, tick) * 1e12;
};

const getHypervisorData = async (hypervisorAddress: string) => {
  const hypervisor = new ethers.Contract(hypervisorAddress, hyperVisoerAbi.abi, signer);

  const baseLower = await hypervisor.baseLower();
  const baseUpper = await hypervisor.baseUpper();
  const limitLower = await hypervisor.limitLower();
  const limitUpper = await hypervisor.limitUpper();
  const currentTick = await hypervisor.currentTick();

  const basePosition = await hypervisor.getBasePosition();
  const totalAmounts = await hypervisor.getTotalAmounts();
  const limitPosition = await hypervisor.getLimitPosition();
  const totalSupply = await hypervisor.totalSupply();

  const token0 = await hypervisor.token0();
  const token1 = await hypervisor.token1();

  const baseLowerPrice = tickToPrice(baseLower);
  const baseUpperPrice = tickToPrice(baseUpper);
  const limitLowerPrice = tickToPrice(limitLower);
  const limitUpperPrice = tickToPrice(limitUpper);
  const currentPrice = tickToPrice(currentTick);

  const baluniOracle = new ethers.Contract(contractsBaluni[137].BaluniV1Oracle, baluniOracleAbi.abi, signer);
  const USDC = await registryCtx?.getUSDC();

  let totalValuation = BigNumber.from(0);
  let token0Valuation = BigNumber.from(0);
  let token1Valuation = BigNumber.from(0);

  if (token1 === USDC) {
    token1Valuation = BigNumber.from(totalAmounts[1]);
    totalValuation = totalValuation.add(token1Valuation);
  } else {
    const valuation = await baluniOracle.convert(token1, USDC, totalAmounts[1]);
    token1Valuation = BigNumber.from(valuation);
    totalValuation = totalValuation.add(token1Valuation);
  }

  if (token0 === USDC) {
    token0Valuation = BigNumber.from(totalAmounts[0]);
    totalValuation = totalValuation.add(token0Valuation);
  } else {
    const valuation = await baluniOracle.convert(token0, USDC, totalAmounts[0]);
    token0Valuation = BigNumber.from(valuation);
    totalValuation = totalValuation.add(token0Valuation);
  }

  // console.group("Token Data");
  // console.log("Token0:", token0);
  // console.log("Token1:", token1);
  // console.log("Token0 Valuation:", Number(token0Valuation));
  // console.log("Token1 Valuation:", Number(token1Valuation));
  // console.log("Token0 Amount:", token0Amount);
  // console.log("Token1 Amount:", token1Amount);
  // console.groupEnd();

  // console.log("Total Valuation:", formatUnits(totalValuation, 6));
  const pool = await hypervisor.pool();

  // console.group("Hypervisor Data");
  // console.log("Address:", hypervisorAddress);
  // console.log("Base Lower:", baseLower.toString());
  // console.log("Base Upper:", baseUpper.toString());
  // console.log("Limit Lower:", limitLower.toString());
  // console.log("Limit Upper:", limitUpper.toString());
  // console.log("Current Tick:", currentTick.toString());
  // console.log("Base Position:", basePosition);
  // console.log("Total Amounts:", totalAmounts);
  // console.log("Limit Position:", limitPosition);
  // console.log("Total Supply:", totalSupply.toString());
  // console.log("Pool:", pool);
  // console.log("Prices:", {
  //   baseLowerPrice,
  //   baseUpperPrice,
  //   limitLowerPrice,
  //   limitUpperPrice,
  //   currentPrice,
  // });
  // console.groupEnd();

  //const totalSupplyScaled = totalSupply.mul(1e12);
  const valuationScaled = totalValuation.mul(1e12);
  const _unitPrice = valuationScaled.div(totalSupply);

  const data = {
    address: hypervisorAddress,
    baseLower: baseLower.toString(),
    baseUpper: baseUpper.toString(),
    limitLower: limitLower.toString(),
    limitUpper: limitUpper.toString(),
    currentTick: currentTick.toString(),
    basePosition: JSON.stringify(basePosition),
    totalAmounts: JSON.stringify(totalAmounts),
    limitPosition: JSON.stringify(limitPosition),
    totalSupply: totalSupply.toString(),
    pool: pool,
    prices: {
      baseLowerPrice,
      baseUpperPrice,
      limitLowerPrice,
      limitUpperPrice,
      currentPrice,
    },
    totalValuation: formatUnits(totalValuation, 6),
    unitPrice: formatUnits(_unitPrice.mul(1e6), 18),

    /*     unitPrice: formatUnits(_unitPrice, 18),
     */
  };

  return data;
};

export async function fetchHyperPools() {
  registryCtx = await setupRegistry(provider, signer);

  console.log("Fetching data from Baluni Hypervisors Pools...");
  const db = await setupDatabase();

  // Fetch and store Pool data from Uniswap

  try {
    const { data } = await client.query<PoolData>({
      query: GET_POOL_DATA,
      variables: { orderBy: "feesUSD" },
      fetchPolicy: "network-only",
    });

    const periodInDays = 365;

    // Fetch Hypervisor data
    const hypervisors = await getHypervisors();

    for (const hypervisor of hypervisors) {
      const hypervisorData = await getHypervisorData(hypervisor);

      const hyperPool = hypervisorData.pool;

      // checksum hyperPool

      const hyperPoolChecksum = ethers.utils.getAddress(hyperPool);

      for (const pool of data.pools) {
        if (ethers.utils.getAddress(pool.id) === hyperPoolChecksum) {
          const totalFees = pool.poolDayData.reduce((acc, day) => acc + parseFloat(day.feesUSD), 0);
          const volume = pool.poolDayData.reduce((acc, day) => acc + parseFloat(day.volumeUSD), 0);

          const apy = calculateAPY(Number(totalFees), Number(volume), periodInDays);

          const token0Ctx = new ethers.Contract(pool.token0.id, erc20Abi, signer);
          const token0Decimals = await token0Ctx.decimals();

          const token1Ctx = new ethers.Contract(pool.token1.id, erc20Abi, signer);
          const token1Decimals = await token1Ctx.decimals();

          const formattedPrice = univ3prices([token0Decimals, token1Decimals], pool.sqrtPrice).toSignificant({
            reverse: true,
            decimalPlaces: 3,
          });

          await db.run(
            `INSERT OR REPLACE INTO hyperPoolsData 
                       (timestmp, id, apy, totalValueLockedUSD, volumeUSD, feesUSD, token0Symbol, token1Symbol, baseLower, baseUpper, limitLower, limitUpper, currentTick, basePosition, totalAmounts, limitPosition, totalSupply, baseLowerPrice, baseUpperPrice, limitLowerPrice, limitUpperPrice, currentPrice, formattedPrice, totalValuation, unitPrice) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            new Date().toISOString(),
            pool.id,
            apy,
            pool.totalValueLockedUSD,
            pool.volumeUSD,
            pool.feesUSD,
            pool.token0.symbol,
            pool.token1.symbol,
            hypervisorData.baseLower,
            hypervisorData.baseUpper,
            hypervisorData.limitLower,
            hypervisorData.limitUpper,
            hypervisorData.currentTick,
            hypervisorData.basePosition,
            hypervisorData.totalAmounts,
            hypervisorData.limitPosition,
            hypervisorData.totalSupply,
            hypervisorData.prices.baseLowerPrice,
            hypervisorData.prices.baseUpperPrice,
            hypervisorData.prices.limitLowerPrice,
            hypervisorData.prices.limitUpperPrice,
            hypervisorData.prices.currentPrice,
            formattedPrice,
            hypervisorData.totalValuation,
            hypervisorData.unitPrice,
          );

          await db.run(
            "INSERT INTO totalValuations (timestamp, totalValuation, address) VALUES (?, ?, ?)",
            new Date().toISOString(),
            hypervisorData.totalValuation,
            hypervisorData.address,
          );

          await db.run(
            "INSERT INTO unitPrices (timestamp, unitPrice, address) VALUES (?, ?, ?)",
            new Date().toISOString(),
            hypervisorData.unitPrice,
            hypervisorData.address,
          );

          console.log(`Match found for Pool ID: ${pool.id} and Hypervisor: ${hypervisor}`);
        }
      }
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }

  await db.close();
}
