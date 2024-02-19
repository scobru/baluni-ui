import React from "react";
import TokenSelector from "../../components/TokenSelector";
import { NextPage } from "next";

const Rebalance: NextPage = () => {
  return (
    <div className="mx-auto  p-5 my-20  ">
      <div className="text-center font-bold mx-auto my-10 text-6xl text-black">Rebalance</div>
      <div className="text-center mx-auto my-10 text-base font-semibold text-black">
        ⚖️ Select some tokens that you hold in your wallet, assign them a weight, and let Baluni handle the rest.
      </div>

      <TokenSelector />
      <div className="text-center  mx-auto my-10 text-sm font-semibold text-black">
        🪄 Check the console to see the magic happen{" "}
      </div>
    </div>
  );
};

export default Rebalance;
