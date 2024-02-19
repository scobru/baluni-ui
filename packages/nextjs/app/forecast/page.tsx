"use client";

import Prediction from "../../components/Prediction";
import type { NextPage } from "next";
import { WalletClient, useWalletClient } from "wagmi";

const Forecast: NextPage = () => {
  const { data: signer } = useWalletClient();

  return (
    <div className="mx-auto p-5 my-20 text-black">
      <div className="text-center font-bold mx-auto my-10 text-6xl">Forecast</div>

      <div className="text-center mx-auto my-10 text-base font-semibold">
        🔮 Use Baluni to forecast the future price of MATIC token.
      </div>
      <Prediction signer={signer as WalletClient} />
    </div>
  );
};

export default Forecast;
