"use client";
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
// Make sure to install axios for making HTTP requests
var react_1 = require("react");
var axios_1 = require("axios");
var ethers_1 = require("ethers");
var viem_1 = require("viem");
var wagmi_1 = require("wagmi");
var Address_1 = require("~~/components/scaffold-eth/Address");
var scaffold_eth_1 = require("~~/hooks/scaffold-eth");
var scaffold_eth_2 = require("~~/hooks/scaffold-eth");
var Pool = function () {
    var _a;
    var signer = wagmi_1.useWalletClient().data;
    var baluni = scaffold_eth_1.useScaffoldContract({ contractName: "BaluniPoolV1", walletClient: signer }).data;
    var poolBalance = scaffold_eth_2.useAccountBalance(baluni === null || baluni === void 0 ? void 0 : baluni.address);
    var _b = react_1.useState({}), currentTokenPrices = _b[0], setCurrentTokenPrices = _b[1];
    var fetchTokenPrices = function () { return __awaiter(void 0, void 0, void 0, function () {
        var ids, response, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    ids = "wmatic";
                    return [4 /*yield*/, axios_1["default"].get("https://api.coingecko.com/api/v3/simple/price?ids=" + ids + "&vs_currencies=usd")];
                case 1:
                    response = _a.sent();
                    setCurrentTokenPrices(response.data);
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error("Error fetching token prices from CoinGecko", error_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    react_1.useEffect(function () {
        fetchTokenPrices();
    }, []);
    var predictionCount = scaffold_eth_1.useScaffoldContractRead({
        contractName: "BaluniPoolV1",
        functionName: "getPredictionCount"
    });
    var last10Predictions = scaffold_eth_1.useScaffoldContractRead({
        contractName: "BaluniPoolV1",
        functionName: "getPredictionFromTo",
        args: [ethers_1.BigNumber.from(0).toBigInt(), Number(predictionCount === null || predictionCount === void 0 ? void 0 : predictionCount.data)]
    });
    var youtTotalSubmission = scaffold_eth_1.useScaffoldContractRead({
        contractName: "BaluniPoolV1",
        functionName: "distributionCounter",
        args: [signer === null || signer === void 0 ? void 0 : signer.account.address]
    });
    var exit = scaffold_eth_1.useScaffoldContractWrite({
        contractName: "BaluniPoolV1",
        functionName: "exit"
    });
    var userReward = scaffold_eth_1.useScaffoldContractRead({
        contractName: "BaluniPoolV1",
        functionName: "calculateReward",
        args: [signer === null || signer === void 0 ? void 0 : signer.account.address]
    });
    var getTokenId = function (tokenId) {
        switch (tokenId) {
            case 0:
                return "wmatic";
            default:
                return "";
        }
    };
    return (React.createElement("div", { className: "mx-auto p-5 my-20 w-full text-center " },
        React.createElement("div", { className: "font-bold my-10 text-2xl sm:text-3xl md:text-4xl lg:text-5xl  xl:text-6xl  text-black" }, "Pool"),
        React.createElement("div", { className: "container mx-auto p-5  rounded-xl w-fit border border-secondary shadow-neutral shadow-lg" },
            React.createElement("div", { className: "p-6 rounded-xl bg-white/80 backdrop-blur-sm backdrop-filter shadow-lg border-primary" },
                React.createElement("div", { className: "mb-6 text-lg sm:text-xl md:text-2xl font-semibold text-gray-700" },
                    React.createElement("p", null,
                        "Pool Balance: ",
                        React.createElement("strong", { className: "text-black" },
                            " ",
                            (poolBalance === null || poolBalance === void 0 ? void 0 : poolBalance.balance) || "Loading...",
                            " "),
                        " MATIC")),
                React.createElement("div", { className: "mb-6 text-lg sm:text-xl md:text-2xl font-semibold text-gray-700" },
                    React.createElement("p", null,
                        "Reward:",
                        " ",
                        React.createElement("strong", { className: "text-black" },
                            (userReward === null || userReward === void 0 ? void 0 : userReward.data) ? viem_1.formatEther(userReward === null || userReward === void 0 ? void 0 : userReward.data) : "Loading...",
                            " "),
                        " ",
                        "MATIC")),
                React.createElement("div", { className: "mb-6 text-sm sm:text-md md:text-lg font-semibold text-gray-700" },
                    React.createElement("p", null,
                        "Submission:",
                        " ",
                        React.createElement("strong", { className: "text-black" },
                            youtTotalSubmission && (youtTotalSubmission === null || youtTotalSubmission === void 0 ? void 0 : youtTotalSubmission.data) ? Number(youtTotalSubmission === null || youtTotalSubmission === void 0 ? void 0 : youtTotalSubmission.data) : "Loading...",
                            " ")),
                    React.createElement("p", { className: "text-xs sm:text-sm md:text-base font-semibold text-gray-600" }, "Submission count is reset every pool exit")),
                React.createElement("button", { className: "bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out transform hover:-translate-y-1 shadow-lg hover:shadow-red-500/50", onClick: function () { return exit.writeAsync(); } }, "Exit Pool"))),
        React.createElement("div", { className: "overflow-x-auto" },
            React.createElement("h2", { className: "text-md sm:text-lg md:text-xl font-semibold mb-2" }, "Forecasts"),
            React.createElement("table", { className: " text-left text-xs sm:text-sm md:text-base border-collapse w-fit mx-auto" },
                React.createElement("thead", null,
                    React.createElement("tr", { className: "bg-base-100 text-xs sm:text-sm md:text-base font-semibold" },
                        React.createElement("th", { className: "p-2" }, "#"),
                        React.createElement("th", null, "Predictor"),
                        React.createElement("th", null, "Token"),
                        React.createElement("th", null, "Predicted"),
                        React.createElement("th", null, "Start Price"),
                        React.createElement("th", null, "Timestamp"),
                        React.createElement("th", null, "End Time"),
                        React.createElement("th", null, "Now Price"),
                        React.createElement("th", null, "Difference"),
                        React.createElement("th", null, "Resolved"))),
                React.createElement("tbody", null, (_a = last10Predictions === null || last10Predictions === void 0 ? void 0 : last10Predictions.data) === null || _a === void 0 ? void 0 : _a.map(function (prediction, index) {
                    var _a;
                    var tokenKey = getTokenId(prediction.token);
                    var actualPrice = (_a = currentTokenPrices[tokenKey]) === null || _a === void 0 ? void 0 : _a.usd;
                    var now = new Date().getTime();
                    var endTime = new Date(Number(prediction.endTime) * 1000).getTime();
                    var rowClass = now < endTime ? "bg-yellow-200" : "bg-red-200"; // Yellow for active, red for expired
                    return (React.createElement("tr", { key: index, className: rowClass + " hover:bg-gray-50 text-black" },
                        React.createElement("td", { className: "p-2" }, index + 1),
                        React.createElement("td", null,
                            React.createElement(Address_1.Address, { address: prediction.predictor })),
                        React.createElement("td", null, getTokenId(prediction.token)),
                        React.createElement("td", null,
                            React.createElement("strong", null,
                                "$",
                                Number(viem_1.formatEther(prediction.predictedPrice)).toFixed(4))),
                        React.createElement("td", null,
                            React.createElement("strong", null,
                                "$",
                                Number(viem_1.formatEther(prediction.actualPrice)).toFixed(4))),
                        React.createElement("td", null, new Date(Number(prediction.timestamp) * 1000).toLocaleString()),
                        React.createElement("td", null, new Date(Number(prediction.endTime) * 1000).toLocaleString()),
                        React.createElement("td", null,
                            React.createElement("strong", null, actualPrice ? "$" + actualPrice.toFixed(4) : "Loading...")),
                        React.createElement("td", null,
                            React.createElement("strong", null,
                                "$",
                                Number(viem_1.formatEther(prediction.difference)).toFixed(4))),
                        React.createElement("td", null,
                            React.createElement("strong", null, String(prediction.resolved)))));
                }))))));
};
exports["default"] = Pool;
