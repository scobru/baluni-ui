"use client";

// Make sure to install axios for making HTTP requests
import { useEffect, useState } from "react";
import axios from "axios";
import { BigNumber } from "ethers";
import { formatEther } from "viem";
import { useWalletClient } from "wagmi";
import { useBalance } from "wagmi";
import { Address } from "~~/components/scaffold-eth/Address";
import { useScaffoldContract, useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

const Pool = () => {
  const { data: signer } = useWalletClient();
  const { data: baluni } = useScaffoldContract({ contractName: "Pool", walletClient: signer });

  const poolBalance = useBalance({
    address: baluni?.address,
    token: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889",
  });

  const [currentTokenPrices, setCurrentTokenPrices] = useState<{ [key: string]: any }>({});

  const fetchTokenPrices = async () => {
    try {
      const ids = "wmatic"; // Corrected for CoinGecko API
      const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
      setCurrentTokenPrices(response.data);
    } catch (error) {
      console.error("Error fetching token prices from CoinGecko", error);
    }
  };

  useEffect(() => {
    fetchTokenPrices();
  }, []);

  const predictionCount = useScaffoldContractRead({
    contractName: "Pool",
    functionName: "getPredictionCount",
  });

  const last10Predictions = useScaffoldContractRead({
    contractName: "Pool",
    functionName: "getPredictionFromTo",
    args: [BigNumber.from(0).toBigInt(), Number(predictionCount?.data) as any],
  });

  const yourTotalScore = useScaffoldContractRead({
    contractName: "Pool",
    functionName: "distributionCounter",
    args: [signer?.account.address],
  });

  const exit = useScaffoldContractWrite({
    contractName: "Pool",
    functionName: "exit",
  });

  const userReward = useScaffoldContractRead({
    contractName: "Pool",
    functionName: "calculateReward",
    args: [signer?.account.address],
  });

  const getTokenId = (tokenId: number) => {
    switch (tokenId) {
      case 0:
        return "wmatic";
      default:
        return "";
    }
  };

  return (
    <div className="mx-auto p-5 my-5 w-full text-center ">
      <div className="font-bold my-10 text-2xl sm:text-3xl md:text-4xl lg:text-5xl  xl:text-6xl  text-black">Pool</div>
      <div className="container mx-auto p-5  rounded-xl w-fit border border-secondary shadow-neutral shadow-lg">
        <div className="p-6 rounded-xl bg-base-200 backdrop-blur-sm backdrop-filter shadow-lg border-primary">
          <div className="mb-6 text-lg sm:text-xl md:text-2xl font-semibold ">
            <p>
              Pool Balance: <strong className=""> {poolBalance?.data?.formatted || "Loading..."} </strong> MATIC
            </p>
          </div>
          <div className="mb-6 text-lg sm:text-xl md:text-2xl font-semibold ">
            <p>
              Reward: <strong className="">{userReward?.data ? formatEther(userReward?.data) : "Loading..."} </strong>{" "}
              MATIC
            </p>
            <div className="text-xs sm:text-sm md:text-base font-semibold ">
              ⚠️Reward are available after resolution
            </div>{" "}
          </div>
          <div className="mb-6 text-sm sm:text-md md:text-lg font-semibold ">
            <p>
              Your Score:{" "}
              <strong className="">
                {yourTotalScore && yourTotalScore?.data ? Number(yourTotalScore?.data) : "Loading..."}{" "}
              </strong>
            </p>

            <p className="text-xs sm:text-sm md:text-base font-semibold ">⚠️ Score reset itself every pool exit</p>
            <p className="text-xs sm:text-sm md:text-base font-semibold ">⚠️ Score is available after resolution</p>
          </div>
          <button
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out transform hover:-translate-y-1 shadow-lg hover:shadow-red-500/50"
            onClick={() => exit.writeAsync()}
          >
            Exit Pool
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <h2 className="text-md sm:text-lg md:text-xl font-semibold mb-2">Forecasts</h2>
        <table className=" text-left text-xs sm:text-sm md:text-base border-collapse w-fit mx-auto">
          <thead>
            <tr className="bg-base-100 text-xs sm:text-sm md:text-base font-semibold">
              <th className="p-2">#</th>
              <th>Predictor</th>
              <th>Token</th>
              <th>Predicted</th>
              <th>Start Price</th>
              <th>Timestamp</th>
              <th>End Time</th>
              <th>Now Price</th>
              <th>Difference</th>
              <th>Resolved</th>
            </tr>
          </thead>
          <tbody>
            {last10Predictions?.data?.map((prediction, index) => {
              const tokenKey: string = getTokenId(prediction.token);
              const actualPrice = currentTokenPrices[tokenKey]?.usd;
              const now = new Date().getTime();
              const endTime = new Date(Number(prediction.endTime) * 1000).getTime();
              const rowClass = now < endTime ? "bg-yellow-200" : "bg-red-200"; // Yellow for active, red for expired

              return (
                <tr key={index} className={`${rowClass} hover:bg-gray-50 text-black`}>
                  <td className="p-2">{index + 1}</td>
                  <td>
                    <Address address={prediction.predictor} />
                  </td>
                  <td>{getTokenId(prediction.token)}</td>
                  <td>
                    <strong>${Number(formatEther(prediction.predictedPrice)).toFixed(4)}</strong>
                  </td>
                  <td>
                    <strong>${Number(formatEther(prediction.actualPrice)).toFixed(4)}</strong>
                  </td>
                  <td>{new Date(Number(prediction.timestamp) * 1000).toLocaleString()}</td>
                  <td>{new Date(Number(prediction.endTime) * 1000).toLocaleString()}</td>
                  <td>
                    <strong>{actualPrice ? `$${actualPrice.toFixed(4)}` : "Loading..."}</strong>
                  </td>
                  <td>
                    <strong>${Number(formatEther(prediction.difference)).toFixed(4)}</strong>
                  </td>
                  <td>
                    <strong>{String(prediction.resolved)}</strong>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Pool;
