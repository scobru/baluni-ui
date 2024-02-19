"use client";
"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while (_)
        try {
          if (
            ((f = 1),
            y &&
              (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (!((t = _.trys), (t = t.length > 0 && t[t.length - 1])) && (op[0] === 6 || op[0] === 2)) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
exports.__esModule = true;
var react_1 = require("react");
var predict_1 = require("baluni/dist/predict/predict");
var viem_1 = require("viem");
var scaffold_eth_1 = require("~~/hooks/scaffold-eth");
var scaffold_eth_2 = require("~~/utils/scaffold-eth");
var Prediction = function (_a) {
  var _b;
  var signer = _a.signer;
  var _c = react_1.useState("REGR"),
    algoName = _c[0],
    setAlgoName = _c[1];
  var _d = react_1.useState(60),
    period = _d[0],
    setPeriod = _d[1];
  var _e = react_1.useState("bitcoin"),
    symbol = _e[0],
    setSymbol = _e[1];
  var _f = react_1.useState(0),
    submisionSymbol = _f[0],
    setSubmissionSymbol = _f[1];
  var _g = react_1.useState(200),
    epochs = _g[0],
    setEpochs = _g[1];
  var _h = react_1.useState({ actual: "", predicted: "", mape: "", rmse: "", mae: "" }),
    predictionResult = _h[0],
    setPredictionResult = _h[1];
  var _j = react_1.useState("0.01"),
    tournamentBet = _j[0],
    setTournamentBet = _j[1];
  var userFee = scaffold_eth_1.useScaffoldContractRead({
    contractName: "BaluniPoolV1",
    functionName: "userSubmissionFees",
    args: [
      (_b = signer === null || signer === void 0 ? void 0 : signer.account) === null || _b === void 0
        ? void 0
        : _b.address,
    ],
  });
  var executeSubmitPrediction = scaffold_eth_1.useScaffoldContractWrite({
    contractName: "BaluniPoolV1",
    functionName: "submit",
    args: [submisionSymbol, viem_1.parseEther(predictionResult.predicted)],
    value:
      Number(userFee === null || userFee === void 0 ? void 0 : userFee.data) == 0
        ? viem_1.parseEther("0.01")
        : userFee === null || userFee === void 0
        ? void 0
        : userFee.data,
  });
  var executeSubmitTournament = scaffold_eth_1.useScaffoldContractWrite({
    contractName: "BaluniTournamentV1",
    functionName: "submitPrediction",
    args: [viem_1.parseEther(predictionResult.predicted)],
    value: viem_1.parseEther(tournamentBet),
  });
  var submitPrediction = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var _submissionSymbol;
      return __generator(this, function (_a) {
        _submissionSymbol = 0;
        if (symbol === "wmatic") {
          setSubmissionSymbol(0);
          _submissionSymbol = 0;
        }
        executeSubmitPrediction.writeAsync({
          args: [_submissionSymbol, viem_1.parseEther(predictionResult.predicted)],
        });
        return [2 /*return*/];
      });
    });
  };
  var submitPredictionTournament = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      return __generator(this, function (_a) {
        executeSubmitTournament.writeAsync({
          args: [viem_1.parseEther(predictionResult.predicted)],
          value: viem_1.parseEther(tournamentBet),
        });
        return [2 /*return*/];
      });
    });
  };
  var makePrediction = function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var notificationLoading, _a, actual, predicted, error_1;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            _b.trys.push([0, 2, , 3]);
            if (period <= 0) {
              scaffold_eth_2.notification.error("Period must be a positive number.");
              return [2 /*return*/];
            }
            notificationLoading = scaffold_eth_2.notification.loading("Making prediction...");
            return [4 /*yield*/, predict_1.predict(algoName, symbol, period, epochs)];
          case 1:
            (_a = _b.sent()), (actual = _a.actual), (predicted = _a.predicted);
            if (!actual || !predicted) {
              scaffold_eth_2.notification.remove(notificationLoading);
              scaffold_eth_2.notification.error("Error making prediction");
              return [2 /*return*/];
            }
            scaffold_eth_2.notification.remove(notificationLoading);
            scaffold_eth_2.notification.success("Prediction made successfully");
            setPredictionResult({ actual: String(actual), predicted: String(predicted), mape: "", rmse: "", mae: "" });
            return [3 /*break*/, 3];
          case 2:
            error_1 = _b.sent();
            scaffold_eth_2.notification.error(String(error_1));
            return [3 /*break*/, 3];
          case 3:
            return [2 /*return*/];
        }
      });
    });
  };
  return react_1["default"].createElement(
    "div",
    {
      className:
        "container mx-auto p-5 bg-base-100 text-base-content rounded-xl border border-secondary shadow-neutral",
    },
    react_1["default"].createElement(
      "label",
      { htmlFor: "algoName", className: "block mb-2 font-semibold" },
      "Algorithm",
    ),
    react_1["default"].createElement(
      "select",
      {
        name: "algoName",
        id: "algoName",
        onChange: function (e) {
          return setAlgoName(e.target.value);
        },
      },
      react_1["default"].createElement("option", { value: "REGR" }, "REGR"),
      react_1["default"].createElement("option", { value: "1CONV" }, "1CONV"),
      react_1["default"].createElement("option", { value: "LSTM" }, "LSTM"),
      react_1["default"].createElement("option", { value: "RNN" }, "RNN"),
      react_1["default"].createElement("option", { value: "GRU" }, "GRU"),
    ),
    react_1["default"].createElement(
      "label",
      { htmlFor: "epochs", className: "block mb-2 mt-4 font-semibold" },
      "Epochs",
    ),
    react_1["default"].createElement("input", {
      type: "number",
      id: "epochs",
      onChange: function (e) {
        return setEpochs(Number(e.target.value));
      },
      className: "p-2 mb-2 w-full",
      value: epochs,
    }),
    react_1["default"].createElement(
      "label",
      { htmlFor: "period", className: "block mb-2 mt-4 font-semibold" },
      "Period",
    ),
    react_1["default"].createElement(
      "select",
      {
        name: "period",
        id: "period",
        onChange: function (e) {
          return setPeriod(Number(e.target.value));
        },
        className: "p-2 mb-2 w-full",
      },
      react_1["default"].createElement("option", { value: "30" }, "30"),
      react_1["default"].createElement("option", { value: "60" }, "60"),
      react_1["default"].createElement("option", { value: "120" }, "120"),
      react_1["default"].createElement("option", { value: "180" }, "180"),
      react_1["default"].createElement("option", { value: "240" }, "240"),
      react_1["default"].createElement("option", { value: "300" }, "300"),
    ),
    react_1["default"].createElement("label", { htmlFor: "symbol", className: "block mb-2 font-semibold" }, "Symbol"),
    react_1["default"].createElement(
      "select",
      {
        name: "symbol",
        id: "symbol",
        onChange: function (e) {
          return setSymbol(e.target.value);
        },
      },
      react_1["default"].createElement("option", { value: "" }, "Select Token"),
      react_1["default"].createElement("option", { value: "wmatic" }, "Matic"),
    ),
    react_1["default"].createElement(
      "button",
      { onClick: makePrediction, className: "bg-primary text-white p-2 rounded-md mt-4 w-full" },
      "Make Prediction",
    ),
    predictionResult.actual &&
      predictionResult.predicted &&
      react_1["default"].createElement(
        "div",
        { className: "mt-4 card card-compact " },
        react_1["default"].createElement("h2", { className: "text-2xl font-bold" }, "Prediction Result:"),
        react_1["default"].createElement(
          "p",
          { className: "text-lg " },
          react_1["default"].createElement("strong", null, "Actual:"),
          " ",
          Number(predictionResult === null || predictionResult === void 0 ? void 0 : predictionResult.actual).toFixed(
            2,
          ),
        ),
        react_1["default"].createElement(
          "p",
          { className: "text-lg " },
          react_1["default"].createElement("strong", null, "Predicted:"),
          " ",
          Number(
            predictionResult === null || predictionResult === void 0 ? void 0 : predictionResult.predicted,
          ).toFixed(2),
        ),
        userFee && (userFee === null || userFee === void 0 ? void 0 : userFee.data)
          ? react_1["default"].createElement(
              "p",
              { className: "text-lg " },
              react_1["default"].createElement("strong", null, "Submission Fee:"),
              " ",
              Number(userFee === null || userFee === void 0 ? void 0 : userFee.data) == 0
                ? viem_1.parseEther("0.01").toString()
                : viem_1.formatEther(Number(userFee === null || userFee === void 0 ? void 0 : userFee.data)),
            )
          : null,
        react_1["default"].createElement(
          "h2",
          { className: "text-xl font-semibold" },
          "\uD83D\uDCE3Publish your forecast and partecipate to the BALUNI community pool",
          " ",
        ),
        react_1["default"].createElement(
          "button",
          { onClick: submitPrediction, className: "bg-primary text-white p-2 rounded-md mt-4 w-full" },
          "Stake Forecast",
        ),
        react_1["default"].createElement(
          "button",
          {
            onClick: submitPredictionTournament,
            className: "bg-primary text-white p-2 rounded-md mt-4 w-full",
            disabled: Boolean(tournamentBet == ""),
          },
          "Submit to Tournament",
        ),
        react_1["default"].createElement("h2", { className: "text-sm my-2" }, "Tournament Bet"),
        react_1["default"].createElement("input", {
          type: "text",
          className: "input inpit-primary border-1",
          onChange: function (e) {
            return setTournamentBet(e.target.value);
          },
        }),
      ),
    react_1["default"].createElement(
      "p",
      { className: "text-base font-semibold " },
      "\uD83D\uDD22Check the console for the rest of the metrics.",
    ),
  );
};
exports["default"] = Prediction;
