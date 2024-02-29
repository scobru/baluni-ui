"use client";

import React, { useState } from "react";
import { predict } from "baluni/dist/predict/predict";
import { WalletClient, formatEther, parseEther } from "viem";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

// props
interface PredictionProps {
  signer: WalletClient;
}

const Prediction = ({ signer }: PredictionProps) => {
  const [algoName, setAlgoName] = useState("REGR");
  const [period, setPeriod] = useState(60);
  const [symbol, setSymbol] = useState("bitcoin");
  const [submisionSymbol, setSubmissionSymbol] = useState(0);
  const [epochs, setEpochs] = useState(200);
  const [predictionResult, setPredictionResult] = useState({ actual: "", predicted: "", mape: "", rmse: "", mae: "" });
  const [tournamentBet, setTournamentBet] = useState("0.01");

  const userFee = useScaffoldContractRead({
    contractName: "Pool",
    functionName: "userSubmissionFees",
    args: [signer?.account?.address],
  });

  const executeSubmitPrediction = useScaffoldContractWrite({
    contractName: "Pool",
    functionName: "submit",
    args: [submisionSymbol, parseEther(predictionResult.predicted)],
    value: Number(userFee?.data) == 0 ? parseEther("0.01") : userFee?.data,
  });

  const executeSubmitTournament = useScaffoldContractWrite({
    contractName: "Tournament",
    functionName: "submitPrediction",
    args: [parseEther(predictionResult.predicted)],
    value: parseEther(tournamentBet),
  });

  const submitPrediction = async () => {
    let _submissionSymbol = 0;

    if (symbol === "wmatic") {
      setSubmissionSymbol(0);
      _submissionSymbol = 0;
    }

    executeSubmitPrediction.writeAsync({ args: [_submissionSymbol, parseEther(predictionResult.predicted)] });
  };

  const submitPredictionTournament = async () => {
    executeSubmitTournament.writeAsync({
      args: [parseEther(predictionResult.predicted)],
      value: parseEther(tournamentBet),
    });
  };

  const makePrediction = async () => {
    try {
      if (period <= 0) {
        notification.error("Period must be a positive number.");
        return;
      }
      const notificationLoading = notification.loading("Making prediction...");
      const { actual, predicted } = await predict(algoName, symbol, period, epochs);
      if (!actual || !predicted) {
        notification.remove(notificationLoading);
        notification.error("Error making prediction");
        return;
      }
      notification.remove(notificationLoading);
      notification.success("Prediction made successfully");
      setPredictionResult({ actual: String(actual), predicted: String(predicted), mape: "", rmse: "", mae: "" });
    } catch (error) {
      notification.error(String(error));
    }
  };

  return (
    <div className="container mx-auto p-10 bg-base-200 text-base-content rounded-xl border border-secondary shadow-neutral">
      <label htmlFor="algoName" className="block mb-2 font-semibold">
        Algorithm
      </label>
      <select name="algoName" id="algoName" onChange={e => setAlgoName(e.target.value)}>
        <option value="REGR">REGR</option>
        <option value="1CONV">1CONV</option>
        <option value="LSTM">LSTM</option>
        <option value="RNN">RNN</option>
        <option value="GRU">GRU</option>
      </select>
      <label htmlFor="epochs" className="block mb-2 mt-4 font-semibold">
        Epochs
      </label>
      <input
        type="number"
        id="epochs"
        onChange={e => setEpochs(Number(e.target.value))}
        className="p-2 mb-2 w-full"
        value={epochs}
      />

      <label htmlFor="period" className="block mb-2 mt-4 font-semibold">
        Period
      </label>
      <select name="period" id="period" onChange={e => setPeriod(Number(e.target.value))} className="p-2 mb-2 w-full">
        <option value="30">30</option>
        <option value="60">60</option>
        <option value="120">120</option>
        <option value="180">180</option>
        <option value="240">240</option>
        <option value="300">300</option>
      </select>
      <label htmlFor="symbol" className="block mb-2 font-semibold">
        Symbol
      </label>
      <select name="symbol" id="symbol" onChange={e => setSymbol(e.target.value)}>
        <option value="">Select Token</option>
        <option value="wmatic">Matic</option>
      </select>
      <button onClick={makePrediction} className="bg-primary text-white p-2 rounded-md mt-4 w-full">
        Make Prediction
      </button>
      {predictionResult.actual && predictionResult.predicted && (
        <div className="mt-4 card card-compact ">
          <h2 className="text-3xl mt-2 font-bold">Prediction</h2>
          <p className="text-3xl font-light ">
            <strong>Actual:</strong> {Number(predictionResult?.actual).toFixed(2)}
          </p>
          <p className="text-3xl font-light ">
            <strong>Predicted:</strong> {Number(predictionResult?.predicted).toFixed(2)}
          </p>
          {userFee && userFee?.data ? (
            <p className="text-lg ">
              Submission Fee:{" "}
              <strong>
                {Number(userFee?.data) == 0 ? parseEther("0.01").toString() : formatEther(Number(userFee?.data) as any)}
              </strong>
            </p>
          ) : null}
          <h2 className="text-md mt-5 font-semibold">
            📣Stake your forecast and partecipate to the BALUNI community pool{" "}
          </h2>

          <button onClick={submitPrediction} className="bg-primary text-white p-2 rounded-md mt-4 w-full">
            Stake Forecast
          </button>
          <h2 className="text-md mt-10 font-semibold">
            📣Submit your prediction for the tournament. The more you bet, the greater your chances of winning.{" "}
          </h2>

          <h2 className="text-sm my-2 mt-2">Bet Amount</h2>
          <input type="text" className="input input-primary" onChange={e => setTournamentBet(e.target.value)} />
          <button
            onClick={submitPredictionTournament}
            className="bg-primary mt-2  text-white p-2 rounded-md  w-full"
            disabled={Boolean(tournamentBet == "")}
          >
            Submit to Tournament
          </button>
        </div>
      )}
      <p className="text-base font-semibold ">🔢Check the console for the rest of the metrics.</p>
    </div>
  );
};

export default Prediction;
