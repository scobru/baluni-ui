"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");
require("@typechain/hardhat");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("@nomicfoundation/hardhat-verify");
require("hardhat-deploy");
require("hardhat-deploy-ethers");
// If not set, it uses ours Alchemy's default API key.
// You can get your own at https://dashboard.alchemyapi.io
const providerApiKey = process.env.ALCHEMY_API_KEY || "oKxs-03sij-U_N0iOlrSsZFr29-IqbuF";
// If not set, it uses the hardhat account 0 private key.
const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY ?? "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
// If not set, it uses ours Etherscan default API key.
const etherscanApiKey = process.env.ETHERSCAN_API_KEY || "DNXJA8RX2Q3VZ4URQIWP7Z68CJXQZSC6AW";
const config = {
    solidity: {
        version: "0.8.17",
        settings: {
            optimizer: {
                enabled: true,
                // https://docs.soliditylang.org/en/latest/using-the-compiler.html#optimizer-options
                runs: 200,
            },
            evmVersion: "london",
        },
    },
    defaultNetwork: "localhost",
    namedAccounts: {
        deployer: {
            // By default, it will take the first Hardhat account as the deployer
            default: 0,
        },
    },
    networks: {
        // View the networks that are pre-configured.
        // If the network you are looking for is not here you can add new network settings
        hardhat: {
            forking: {
                url: `https://eth-mainnet.alchemyapi.io/v2/${providerApiKey}`,
                enabled: process.env.MAINNET_FORKING_ENABLED === "true",
            },
        },
        mainnet: {
            url: `https://eth-mainnet.alchemyapi.io/v2/${providerApiKey}`,
            accounts: [deployerPrivateKey],
        },
        sepolia: {
            url: `https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`,
            accounts: [deployerPrivateKey],
        },
        goerli: {
            url: `https://eth-goerli.alchemyapi.io/v2/${providerApiKey}`,
            accounts: [deployerPrivateKey],
        },
        arbitrum: {
            url: `https://arb-mainnet.g.alchemy.com/v2/${providerApiKey}`,
            accounts: [deployerPrivateKey],
        },
        arbitrumGoerli: {
            url: `https://arb-goerli.g.alchemy.com/v2/${providerApiKey}`,
            accounts: [deployerPrivateKey],
        },
        optimism: {
            url: `https://opt-mainnet.g.alchemy.com/v2/${providerApiKey}`,
            accounts: [deployerPrivateKey],
        },
        optimismGoerli: {
            url: `https://opt-goerli.g.alchemy.com/v2/${providerApiKey}`,
            accounts: [deployerPrivateKey],
        },
        polygon: {
            url: `https://polygon-mainnet.g.alchemy.com/v2/${providerApiKey}`,
            accounts: [deployerPrivateKey],
        },
        polygonMumbai: {
            url: `https://polygon-mumbai.g.alchemy.com/v2/${providerApiKey}`,
            accounts: [deployerPrivateKey],
        },
        polygonZkEvm: {
            url: `https://polygonzkevm-mainnet.g.alchemy.com/v2/${providerApiKey}`,
            accounts: [deployerPrivateKey],
        },
        polygonZkEvmTestnet: {
            url: `https://polygonzkevm-testnet.g.alchemy.com/v2/${providerApiKey}`,
            accounts: [deployerPrivateKey],
        },
        gnosis: {
            url: "https://rpc.gnosischain.com",
            accounts: [deployerPrivateKey],
        },
        chiado: {
            url: "https://rpc.chiadochain.net",
            accounts: [deployerPrivateKey],
        },
        base: {
            url: "https://mainnet.base.org",
            accounts: [deployerPrivateKey],
        },
        baseGoerli: {
            url: "https://goerli.base.org",
            accounts: [deployerPrivateKey],
        },
        scrollSepolia: {
            url: "https://sepolia-rpc.scroll.io",
            accounts: [deployerPrivateKey],
        },
        scroll: {
            url: "https://rpc.scroll.io",
            accounts: [deployerPrivateKey],
        },
        pgn: {
            url: "https://rpc.publicgoods.network",
            accounts: [deployerPrivateKey],
        },
        pgnTestnet: {
            url: "https://sepolia.publicgoods.network",
            accounts: [deployerPrivateKey],
        },
    },
    // configuration for harhdat-verify plugin
    etherscan: {
        apiKey: `${etherscanApiKey}`,
    },
    // configuration for etherscan-verify from hardhat-deploy plugin
    verify: {
        etherscan: {
            apiKey: `${etherscanApiKey}`,
        },
    },
    sourcify: {
        enabled: false,
    },
};
exports.default = config;
