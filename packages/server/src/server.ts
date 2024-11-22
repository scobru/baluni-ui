import express from "express";
import path from "path";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { calculateStatistics } from "./calculateStatistics";

const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3001;


export const TOKENS_URL = 'https://gateway.ipfs.io/ipns/tokens.uniswap.org'

app.use(
  cors({
    origin: "*", // Replace with your frontend's domain
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type,Authorization",
  }),
);

app.use(express.json());

const dbPromise = open({
  filename: path.join(__dirname, "..", "baluniData.db"),
  driver: sqlite3.Database,
});

// Endpoint per ottenere tutti i dati da hyperPoolsData
app.get("/api/hyperpools-data", async (req, res) => {
  try {
    const db = await dbPromise;
    const hyperpoolsData = await db.all("SELECT * FROM hyperPoolsData");
    res.json(hyperpoolsData);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch hyper pools data" });
  }
});

app.get("/api/valuation-data", async (req, res) => {
  try {
    const db = await dbPromise;
    const valuations = await db.all("SELECT * FROM totalValuations");
    res.json(valuations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch valuation data" });
  }
});

app.get("/api/totalInterestEarned-data", async (req, res) => {
  try {
    const db = await dbPromise;
    const results = await db.all("SELECT * FROM totalInterestEarned");
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch total interest data" });
  }
});

app.get("/api/unitPrices-data", async (req, res) => {
  try {
    const db = await dbPromise;
    const results = await db.all("SELECT * FROM unitPrices");
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch unit prices data" });
  }
});

app.get("/api/statistics", async (req, res) => {
  try {
    const statistics = await calculateStatistics();
    res.json(statistics);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch statistics data" });
  }
});

app.get('/:chainId/yearn-v3/vaults', async (req, res) => {
  const { chainId } = req.params
  const apiURL = `https://ydaemon.yearn.fi/${chainId}/vaults/all`

  try {
    const response = await fetch(apiURL)
    const data = await response.json()

    return res.json(data)
  } catch (error) {
    console.error('Failed to fetch Yearn Finance vaults:', error)
    return res
      .status(500)
      .json({ error: 'Failed to fetch Yearn Finance vaults.' })
  }
})

app.get('/:chainId/uni-v3/tokens', async (req, res) => {
  try {
    const response = await fetch(TOKENS_URL)
    const data = await response.json()
    const { chainId } = req.params
    const filteredTokens = data.tokens.filter(
      (token: { chainId: number }) => token.chainId === Number(chainId)
    )

    res.json(filteredTokens)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tokens', error: error })
  }
})

app.get('/:chainId/uni-v3/tokens/:tokenSymbol', async (req, res) => {
  const { chainId, tokenSymbol } = req.params

  if (!chainId || !tokenSymbol) {
    return res
      .status(400)
      .json({ error: 'Missing chainId or tokenName query parameter' })
  }

  try {
    const response = await fetch(TOKENS_URL)
    const data = await response.json()
    const matchingTokens = data.tokens.filter(
      (token: { chainId: number; symbol: string }) =>
        token.chainId === Number(chainId) &&
        token.symbol.toLowerCase() === tokenSymbol.toString().toLowerCase()
    )

    if (matchingTokens.length === 0) {
      return res.status(404).json({ error: 'Token not found' })
    }

    res.json(matchingTokens[0]) // Returns the first matching token, assuming names are unique per chainId
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tokens', error: error })
  }
})

// write hello world
app.get('/', (req, res) => {
  res.send('Hello World')
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
