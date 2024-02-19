"use client";

// Make sure to install axios for making HTTP requests
import { formatEther } from "viem";
import { useScaffoldContractRead, useScaffoldEventHistory } from "~~/hooks/scaffold-eth";

const Tournament = () => {
  const round = useScaffoldContractRead({
    contractName: "BaluniTournamentV1",
    functionName: "getCurrentRound",
  });

  const tournamentResolved = useScaffoldEventHistory({
    contractName: "BaluniTournamentV1",
    eventName: "TournamentResolved",
    fromBlock: 53685900n, // two days
    transactionData: true,
    blockData: true,
    receiptData: true,
    watch: true,
    enabled: true,
  });

  console.log("tournamentResolved", tournamentResolved.data);

  const verificationTime = useScaffoldContractRead({
    contractName: "BaluniTournamentV1",
    functionName: "getNextVerificationTime",
  });

  const latestPrice = useScaffoldContractRead({
    contractName: "BaluniTournamentV1",
    functionName: "getLatestRoundPrice",
  });

  const price = useScaffoldContractRead({
    contractName: "BaluniTournamentV1",
    functionName: "getPrice",
  });

  const prizePool = useScaffoldContractRead({
    contractName: "BaluniTournamentV1",
    functionName: "getCurrentPricePool",
  });

  const partecipants = useScaffoldContractRead({
    contractName: "BaluniTournamentV1",
    functionName: "getCurrentRoundPartecipants",
  });

  const isRoundOpen = useScaffoldContractRead({
    contractName: "BaluniTournamentV1",
    functionName: "isRoundOpen",
  });

  return (
    <div className="mx-auto p-5 my-">
      <div className="container mx-auto p-5">
        <div className="text-center font-bold mx-auto my-10 text-6xl text-black">Tournament</div>
        <div className="container mx-auto p-5 rounded-xl w-fit border border-secondary shadow-neutral shadow-lg">
          <div className="card bg-base-200  shadow-md shadow-secondary mx-auto max-w-4xl border-primary border-1">
            <div className="card-body text-center">
              <p className="text-4xl">
                round <strong>{Number(round.data)}</strong>
                <p className="text-sm">
                  ends at <strong>{new Date(Number(verificationTime.data) * 1000).toLocaleString()}</strong>
                </p>
              </p>
              <p className="text-3xl">
                🏆Price <strong> {formatEther(Number(prizePool?.data) as any)} MATIC</strong>
              </p>
              <p className="text-2xl">
                submissions are{" "}
                {String(isRoundOpen.data) === "true" ? (
                  <span className="badge badge-success">open</span>
                ) : (
                  <span className="badge badge-error">closed</span>
                )}
              </p>
              <p className="text-2xl">
                There are <strong>{Number(partecipants.data)}/50</strong> participants
              </p>{" "}
              <p className="text-xl">
                previous round closed at price <strong>{formatEther(Number(latestPrice?.data) as any)} USD</strong>
              </p>
              <p className="text-lg">
                Now Price: <strong> {formatEther(Number(price?.data) as any)} </strong> USD
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tournament;
