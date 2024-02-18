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
var hardhat_1 = require("hardhat");
var dotenv = require("dotenv");
dotenv.config();
var tournamentAddress = "0xbAc698969620A4e129eBE3cdDD7Be93d8bd637B8"; // Polygon
var poolAddress = "0x41D1341541aB776A35f671309C7035c5B4BBBC63"; // Aggiungi l'indirizzo della pool al tuo file .env
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var signers, tournament, pool, currentTime, verificationTime, tx, error_1, hasUnresolvedPredictions, txPool, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, hardhat_1.ethers.getSigners()];
                case 1:
                    signers = _a.sent();
                    return [4 /*yield*/, hardhat_1.ethers.getContractAt("BaluniTournamentV1", tournamentAddress, signers[0])];
                case 2:
                    tournament = _a.sent();
                    return [4 /*yield*/, hardhat_1.ethers.getContractAt("BaluniPoolV1", poolAddress, signers[0])];
                case 3:
                    pool = _a.sent();
                    currentTime = Math.floor(Date.now() / 1000);
                    return [4 /*yield*/, tournament.verificationTime()];
                case 4:
                    verificationTime = _a.sent();
                    if (!(currentTime >= verificationTime)) return [3 /*break*/, 10];
                    _a.label = 5;
                case 5:
                    _a.trys.push([5, 8, , 9]);
                    console.log("Tentativo di risolvere il torneo...");
                    return [4 /*yield*/, tournament.resolveTournament()];
                case 6:
                    tx = _a.sent();
                    return [4 /*yield*/, tx.wait()];
                case 7:
                    _a.sent();
                    console.log("Torneo risolto con successo.");
                    return [3 /*break*/, 9];
                case 8:
                    error_1 = _a.sent();
                    console.error("Errore nella risoluzione del torneo:", error_1);
                    return [3 /*break*/, 9];
                case 9: return [3 /*break*/, 11];
                case 10:
                    console.log("Non è ancora il momento di risolvere il torneo.");
                    _a.label = 11;
                case 11:
                    _a.trys.push([11, 17, , 18]);
                    return [4 /*yield*/, pool.hasAnyUnresolvedPastEndTime()];
                case 12:
                    hasUnresolvedPredictions = _a.sent();
                    if (!hasUnresolvedPredictions) return [3 /*break*/, 15];
                    console.log("Tentativo di risolvere la pool...");
                    return [4 /*yield*/, pool.resolve()];
                case 13:
                    txPool = _a.sent();
                    return [4 /*yield*/, txPool.wait()];
                case 14:
                    _a.sent();
                    console.log("Pool risolta con successo.");
                    return [3 /*break*/, 16];
                case 15:
                    console.log("Nessuna previsione da risolvere nella pool al momento.");
                    _a.label = 16;
                case 16: return [3 /*break*/, 18];
                case 17:
                    error_2 = _a.sent();
                    console.error("Errore nella risoluzione della pool:", error_2);
                    return [3 /*break*/, 18];
                case 18: return [2 /*return*/];
            }
        });
    });
}
var counter = 0;
function runEveryMinute() {
    return __awaiter(this, void 0, void 0, function () {
        var error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, main()];
                case 1:
                    _a.sent();
                    counter++;
                    console.log("Counter: ", counter);
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _a.sent();
                    console.error(error_3);
                    return [3 /*break*/, 3];
                case 3:
                    setTimeout(runEveryMinute, 1 * 1 * 60 * 1000);
                    return [2 /*return*/];
            }
        });
    });
}
runEveryMinute();
