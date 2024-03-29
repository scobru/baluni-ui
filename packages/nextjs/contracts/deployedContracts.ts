/**
 * This file is autogenerated by Scaffold-ETH.
 * You should not edit it manually or your changes might be overwritten.
 */
import { GenericContractsDeclaration } from "~~/utils/scaffold-eth/contract";

const deployedContracts = {
  137: {
    BaluniPoolV1: {
      address: "0x26EcB9aCa9d7d44EAbbE3f4f6905DEbb115843Dc",
      abi: [
        {
          inputs: [
            {
              internalType: "address",
              name: "_oracleAddress",
              type: "address",
            },
            {
              internalType: "address",
              name: "_wnative",
              type: "address",
            },
            {
              internalType: "address",
              name: "_yearnVault",
              type: "address",
            },
          ],
          stateMutability: "nonpayable",
          type: "constructor",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "address",
              name: "predictor",
              type: "address",
            },
            {
              indexed: false,
              internalType: "enum BaluniPoolV1.Coin",
              name: "token",
              type: "uint8",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "predictedPrice",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "actualPrice",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "timestamp",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "endTime",
              type: "uint256",
            },
          ],
          name: "PredictionRegistered",
          type: "event",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "address",
              name: "predictor",
              type: "address",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "amount",
              type: "uint256",
            },
          ],
          name: "RewardWithdrawn",
          type: "event",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "user",
              type: "address",
            },
          ],
          name: "calculateReward",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "",
              type: "address",
            },
          ],
          name: "distributionCounter",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "exit",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [],
          name: "exitLimit",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "index",
              type: "uint256",
            },
          ],
          name: "getPrediction",
          outputs: [
            {
              components: [
                {
                  internalType: "address",
                  name: "predictor",
                  type: "address",
                },
                {
                  internalType: "enum BaluniPoolV1.Coin",
                  name: "token",
                  type: "uint8",
                },
                {
                  internalType: "uint256",
                  name: "predictedPrice",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "actualPrice",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "resolvedPrice",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "difference",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "timestamp",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "endTime",
                  type: "uint256",
                },
                {
                  internalType: "bool",
                  name: "resolved",
                  type: "bool",
                },
              ],
              internalType: "struct BaluniPoolV1.Prediction",
              name: "",
              type: "tuple",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "getPredictionCount",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "from",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "to",
              type: "uint256",
            },
          ],
          name: "getPredictionFromTo",
          outputs: [
            {
              components: [
                {
                  internalType: "address",
                  name: "predictor",
                  type: "address",
                },
                {
                  internalType: "enum BaluniPoolV1.Coin",
                  name: "token",
                  type: "uint8",
                },
                {
                  internalType: "uint256",
                  name: "predictedPrice",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "actualPrice",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "resolvedPrice",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "difference",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "timestamp",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "endTime",
                  type: "uint256",
                },
                {
                  internalType: "bool",
                  name: "resolved",
                  type: "bool",
                },
              ],
              internalType: "struct BaluniPoolV1.Prediction[]",
              name: "",
              type: "tuple[]",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "getSubmissionFee",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "getTotalPredictions",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "hasAnyUnresolvedPastEndTime",
          outputs: [
            {
              internalType: "bool",
              name: "",
              type: "bool",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "hasUnresolvedPredictions",
          outputs: [
            {
              internalType: "bool",
              name: "",
              type: "bool",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "last10Predictions",
          outputs: [
            {
              components: [
                {
                  internalType: "address",
                  name: "predictor",
                  type: "address",
                },
                {
                  internalType: "enum BaluniPoolV1.Coin",
                  name: "token",
                  type: "uint8",
                },
                {
                  internalType: "uint256",
                  name: "predictedPrice",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "actualPrice",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "resolvedPrice",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "difference",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "timestamp",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "endTime",
                  type: "uint256",
                },
                {
                  internalType: "bool",
                  name: "resolved",
                  type: "bool",
                },
              ],
              internalType: "struct BaluniPoolV1.Prediction[]",
              name: "",
              type: "tuple[]",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "",
              type: "address",
            },
          ],
          name: "lastWithdraw",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "oracle",
          outputs: [
            {
              internalType: "contract Oracle",
              name: "",
              type: "address",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "predictionDuration",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          name: "predictions",
          outputs: [
            {
              internalType: "address",
              name: "predictor",
              type: "address",
            },
            {
              internalType: "enum BaluniPoolV1.Coin",
              name: "token",
              type: "uint8",
            },
            {
              internalType: "uint256",
              name: "predictedPrice",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "actualPrice",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "resolvedPrice",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "difference",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "timestamp",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "endTime",
              type: "uint256",
            },
            {
              internalType: "bool",
              name: "resolved",
              type: "bool",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "resolutionLimit",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "resolve",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [],
          name: "submissionBaseFee",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "submissionStepFee",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "enum BaluniPoolV1.Coin",
              name: "_token",
              type: "uint8",
            },
            {
              internalType: "uint256",
              name: "_predictedPrice",
              type: "uint256",
            },
          ],
          name: "submit",
          outputs: [],
          stateMutability: "payable",
          type: "function",
        },
        {
          inputs: [],
          name: "totalDistribution",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "totalPredictions",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "",
              type: "address",
            },
          ],
          name: "userSubmissionFees",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "wnative",
          outputs: [
            {
              internalType: "contract IWETH",
              name: "",
              type: "address",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "yearnVault",
          outputs: [
            {
              internalType: "contract IVault",
              name: "",
              type: "address",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          stateMutability: "payable",
          type: "receive",
        },
      ],
      inheritedFunctions: {},
    },
    BaluniTournamentV1: {
      address: "0xf823c515eAdC0C8fC2699f88F3e87389e97953b0",
      abi: [
        {
          inputs: [
            {
              internalType: "address",
              name: "_oracleAddress",
              type: "address",
            },
            {
              internalType: "uint256",
              name: "_maxParticipants",
              type: "uint256",
            },
          ],
          stateMutability: "nonpayable",
          type: "constructor",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: false,
              internalType: "uint256",
              name: "round",
              type: "uint256",
            },
            {
              indexed: true,
              internalType: "address",
              name: "predictor",
              type: "address",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "predictedPrice",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "amount",
              type: "uint256",
            },
          ],
          name: "PredictionSubmitted",
          type: "event",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: false,
              internalType: "uint256",
              name: "round",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "address[]",
              name: "winners",
              type: "address[]",
            },
            {
              indexed: false,
              internalType: "uint256[]",
              name: "prizeAmounts",
              type: "uint256[]",
            },
          ],
          name: "TournamentResolved",
          type: "event",
        },
        {
          inputs: [],
          name: "currentRound",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "getCurrentPricePool",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "getCurrentRound",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "getCurrentRoundPartecipants",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "getLastWinners",
          outputs: [
            {
              internalType: "address[]",
              name: "",
              type: "address[]",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "getLatestRoundPrice",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "getMaxPartecipants",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "getNextVerificationTime",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "getPartecipants",
          outputs: [
            {
              internalType: "address[]",
              name: "",
              type: "address[]",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "getPredictions",
          outputs: [
            {
              components: [
                {
                  internalType: "uint256",
                  name: "round",
                  type: "uint256",
                },
                {
                  internalType: "address",
                  name: "predictor",
                  type: "address",
                },
                {
                  internalType: "uint256",
                  name: "predictedPrice",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "amount",
                  type: "uint256",
                },
              ],
              internalType: "struct BaluniTournamentV1.Prediction[]",
              name: "",
              type: "tuple[]",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "getPrice",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "isRoundOpen",
          outputs: [
            {
              internalType: "bool",
              name: "",
              type: "bool",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "keeperPercentageFee",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "lastRoundPrice",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "maxParticipants",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "oracle",
          outputs: [
            {
              internalType: "contract Oracle",
              name: "",
              type: "address",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          name: "predictions",
          outputs: [
            {
              internalType: "uint256",
              name: "round",
              type: "uint256",
            },
            {
              internalType: "address",
              name: "predictor",
              type: "address",
            },
            {
              internalType: "uint256",
              name: "predictedPrice",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "amount",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "priceFeedAddress",
          outputs: [
            {
              internalType: "address",
              name: "",
              type: "address",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "prizePool",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "resolutionEndTime",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "resolveTournament",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          name: "roundWinners",
          outputs: [
            {
              internalType: "address",
              name: "",
              type: "address",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "submissionEndTime",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "_predictedPrice",
              type: "uint256",
            },
          ],
          name: "submitPrediction",
          outputs: [],
          stateMutability: "payable",
          type: "function",
        },
        {
          inputs: [],
          name: "verificationEndTime",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "verificationTime",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          stateMutability: "payable",
          type: "receive",
        },
      ],
      inheritedFunctions: {},
    },
    Oracle: {
      address: "0xaC81354605019e00FfCfb36df3031419E62540B3",
      abi: [
        {
          inputs: [
            {
              internalType: "address",
              name: "_priceFeedAddress",
              type: "address",
            },
          ],
          stateMutability: "nonpayable",
          type: "constructor",
        },
        {
          inputs: [],
          name: "getLatestPrice",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
      ],
      inheritedFunctions: {},
    },
  },
} as const;

export default deployedContracts satisfies GenericContractsDeclaration;
