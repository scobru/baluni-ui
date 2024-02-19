"use client";
"use strict";
exports.__esModule = true;
// Make sure to install axios for making HTTP requests
var viem_1 = require("viem");
var scaffold_eth_1 = require("~~/hooks/scaffold-eth");
var Tournament = function () {
    var round = scaffold_eth_1.useScaffoldContractRead({
        contractName: "BaluniTournamentV1",
        functionName: "getCurrentRound"
    });
    var verificationTime = scaffold_eth_1.useScaffoldContractRead({
        contractName: "BaluniTournamentV1",
        functionName: "getNextVerificationTime"
    });
    var latestPrice = scaffold_eth_1.useScaffoldContractRead({
        contractName: "BaluniTournamentV1",
        functionName: "getLatestRoundPrice"
    });
    var price = scaffold_eth_1.useScaffoldContractRead({
        contractName: "BaluniTournamentV1",
        functionName: "getPrice"
    });
    var prizePool = scaffold_eth_1.useScaffoldContractRead({
        contractName: "BaluniTournamentV1",
        functionName: "getCurrentPricePool"
    });
    var partecipants = scaffold_eth_1.useScaffoldContractRead({
        contractName: "BaluniTournamentV1",
        functionName: "getCurrentRoundPartecipants"
    });
    var isRoundOpen = scaffold_eth_1.useScaffoldContractRead({
        contractName: "BaluniTournamentV1",
        functionName: "isRoundOpen"
    });
    return (React.createElement("div", { className: "mx-auto p-5 my-20  " },
        React.createElement("div", { className: "container mx-auto p-5" },
            React.createElement("div", { className: "text-center font-bold mx-auto my-10 text-6xl text-black" }, "Tournament"),
            React.createElement("div", { className: "container mx-auto p-5 rounded-xl w-fit border border-secondary shadow-neutral shadow-lg" },
                React.createElement("div", { className: "card bg-white/80 text-black shadow-md shadow-secondary mx-auto max-w-4xl border-primary border-1" },
                    React.createElement("div", { className: "card-body text-center" },
                        React.createElement("p", { className: "text-4xl" },
                            "round ",
                            React.createElement("strong", null, Number(round.data)),
                            React.createElement("p", { className: "text-sm" },
                                "ends at ",
                                React.createElement("strong", null, new Date(Number(verificationTime.data) * 1000).toLocaleString()))),
                        React.createElement("p", { className: "text-3xl" },
                            "\uD83C\uDFC6Price ",
                            React.createElement("strong", null,
                                " ",
                                viem_1.formatEther(Number(prizePool === null || prizePool === void 0 ? void 0 : prizePool.data)),
                                " MATIC")),
                        React.createElement("p", { className: "text-2xl" },
                            "submissions are",
                            " ",
                            String(isRoundOpen.data) === "true" ? (React.createElement("span", { className: "badge badge-success" }, "open")) : (React.createElement("span", { className: "badge badge-error" }, "closed"))),
                        "z",
                        React.createElement("p", { className: "text-2xl" },
                            "There are ",
                            React.createElement("strong", null,
                                Number(partecipants.data),
                                "/50"),
                            " participants"),
                        " ",
                        React.createElement("p", { className: "text-xl" },
                            "previous round closed at price ",
                            React.createElement("strong", null,
                                viem_1.formatEther(Number(latestPrice === null || latestPrice === void 0 ? void 0 : latestPrice.data)),
                                " USD")),
                        React.createElement("p", { className: "text-lg" },
                            "Now Price: ",
                            React.createElement("strong", null,
                                " ",
                                viem_1.formatEther(Number(price === null || price === void 0 ? void 0 : price.data)),
                                " "),
                            " USD")))))));
};
exports["default"] = Tournament;
