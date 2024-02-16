import React from "react";
import TokenSelector from "../../components/TokenSelector";
import { NextPage } from "next";

const Baluni: NextPage = () => {
  return (
    <div>
      <div className="text-center font-bold mx-auto my-10 text-6xl">Rebalancer</div>
      <div className="text-center mx-auto my-10 text-base font-semibold">
        ⚖️ Select some tokens that you hold in your wallet, assign them a weight, and let Baluni handle the rest.
      </div>

      <TokenSelector />
      <div className="text-center  mx-auto my-10 text-sm font-semibold">
        🪄 Check the console to see the magic happen{" "}
      </div>
    </div>
  );
};

export default Baluni;
