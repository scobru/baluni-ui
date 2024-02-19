// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./Oracle.sol";

contract BaluniTournamentV1 is ReentrancyGuard {
	Oracle public oracle;

	uint256 public keeperPercentageFee = 100;

	struct Prediction {
		uint256 round;
		address predictor;
		uint256 predictedPrice;
		uint256 amount;
	}

	uint256 public maxParticipants;

	uint256 public lastRoundPrice;

	Prediction[] public predictions;

	uint256 public verificationTime;
	address public priceFeedAddress;
	uint256 public prizePool;
	uint256 public currentRound = 0;

	struct WinnerInfo {
		uint256 index;
		uint256 difference;
		bool exists;
	}

	event PredictionSubmitted(
		uint256 round,
		address indexed predictor,
		uint256 predictedPrice,
		uint256 amount
	);

	event TournamentResolved(
		uint256 round,
		address[] winners,
		uint256[] prizeAmounts
	);

	constructor(
		address _oracleAddress,
		uint256 _maxParticipants
	) ReentrancyGuard() {
		oracle = Oracle(_oracleAddress);
		maxParticipants = _maxParticipants;
		verificationTime = block.timestamp + 1 days;
	}

	function isRoundOpen() public view returns (bool) {
		return block.timestamp <= verificationTime - 4 hours;
	}

	function submitPrediction(uint256 _predictedPrice) external payable {
		require(msg.value >= 0.01 ether, "Entry fee is 0.01 ether");
		require(
			predictions.length < maxParticipants,
			"Participant limit reached"
		);
		require(
			block.timestamp <= verificationTime - 4 hours,
			"Submissions closed 4 hours before round ends"
		);

		predictions.push(
			Prediction(currentRound, msg.sender, _predictedPrice, msg.value)
		);
		prizePool += msg.value;
		emit PredictionSubmitted(
			currentRound,
			msg.sender,
			_predictedPrice,
			msg.value
		);
	}

	function _resetTournament() private {
		delete predictions;
		prizePool = 0;
		verificationTime = block.timestamp + 1 days;
		currentRound += 1;
	}

	function resolveTournament() external nonReentrant {
		require(
			block.timestamp >= verificationTime,
			"Tournament cannot be resolved yet"
		);

		uint256 actualPrice = oracle.getLatestPrice();
		uint256 actualPriceUint = actualPrice * 1e10;
		lastRoundPrice = actualPriceUint;

		WinnerInfo[3] memory winners;
		address[] memory winnersAddresses = new address[](3);
		uint256[] memory prizeAmounts = new uint256[](3);

		if (predictions.length == 0) {
			emit TournamentResolved(
				currentRound,
				winnersAddresses,
				prizeAmounts
			);
			_resetTournament();
			return;
		}

		uint256 winnersCount = 0; // Contatore per i vincitori effettivi

		if (predictions.length == 1) {
			// Restituisci i fondi all'unico partecipante
			Address.sendValue(
				payable(predictions[0].predictor),
				predictions[0].amount
			);
			winnersAddresses[winnersCount] = predictions[0].predictor;
			prizeAmounts[winnersCount] = predictions[0].amount;
			winnersCount++;
		} else if (predictions.length == 2) {
			// Distribuisci i fondi equamente o basati sulla loro scommessa, qui esempio con distribuzione equa
			uint256 halfPrize = prizePool / 2;
			for (uint256 i = 0; i < 2; i++) {
				Address.sendValue(payable(predictions[i].predictor), halfPrize);
				winnersAddresses[winnersCount] = predictions[i].predictor;
				prizeAmounts[winnersCount] = halfPrize;
				winnersCount++;
			}
		} else {
			for (uint256 i = 0; i < winners.length; i++) {
				winners[i].difference = type(uint256).max;
				winners[i].exists = false;
			}

			for (uint256 i = 0; i < predictions.length; i++) {
				uint256 difference = predictions[i].predictedPrice >
					actualPriceUint
					? predictions[i].predictedPrice - actualPriceUint
					: actualPriceUint - predictions[i].predictedPrice;

				for (uint256 j = 0; j < winners.length; j++) {
					if (difference < winners[j].difference) {
						for (uint256 k = winners.length - 1; k > j; k--) {
							winners[k] = winners[k - 1];
						}
						winners[j] = WinnerInfo(i, difference, true);
						break;
					}
				}
			}

			uint256 totalBetTopThree = 0;
			for (uint256 i = 0; i < winners.length; i++) {
				if (winners[i].exists) {
					totalBetTopThree += predictions[winners[i].index].amount;
				}
			}

			require(totalBetTopThree > 0, "Total bet of top three is zero");

			uint256 keeperFee = (prizePool * keeperPercentageFee) / 10000;

			prizePool = prizePool - keeperFee;

			Address.sendValue(payable(msg.sender), keeperFee);

			for (uint256 i = 0; i < winners.length; i++) {
				if (winners[i].exists) {
					uint256 winnerPrize = (predictions[winners[i].index]
						.amount * prizePool) / totalBetTopThree;
					Address.sendValue(
						payable(predictions[winners[i].index].predictor),
						winnerPrize
					);
					prizeAmounts[i] = winnerPrize;
				}
			}
		}

		// Ridimensiona gli array basati sul numero effettivo di vincitori
		address[] memory finalWinnersAddresses = new address[](winnersCount);
		uint256[] memory finalPrizeAmounts = new uint256[](winnersCount);

		for (uint256 i = 0; i < winnersCount; i++) {
			finalWinnersAddresses[i] = winnersAddresses[i];
			finalPrizeAmounts[i] = prizeAmounts[i];
		}
		emit TournamentResolved(
			currentRound,
			finalWinnersAddresses,
			finalPrizeAmounts
		);
		_resetTournament();
	}

	function getPrice() public view returns (uint256) {
		return oracle.getLatestPrice() * 1e10;
	}

	function getLatestRoundPrice() external view returns (uint256) {
		return lastRoundPrice;
	}

	function getCurrentRound() external view returns (uint256) {
		return currentRound;
	}

	function getMaxPartecipants() external view returns (uint256) {
		return maxParticipants;
	}

	function getCurrentRoundPartecipants() external view returns (uint256) {
		return predictions.length;
	}

	function getCurrentPricePool() external view returns (uint256) {
		return prizePool;
	}

	function getNextVerificationTime() external view returns (uint256) {
		return verificationTime;
	}

	receive() external payable {
		prizePool += msg.value;
	}
}
