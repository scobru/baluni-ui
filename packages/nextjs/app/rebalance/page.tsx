import React from "react";
import Link from "next/link";
import TokenSelector from "../../components/TokenSelector";
import { NextPage } from "next";

const Rebalance: NextPage = () => {
  return (
    <div className="mx-auto  p-5 my-5  ">
      <div className="text-center font-bold mx-auto my-10 text-6xl text-black">Rebalance</div>
      <div className="text-center  mx-auto my-10 text-3xl font-bold text-black">Soon on Mainnet</div>
      <div className="text-center  mx-auto my-10 text-3xl font-semibold text-black">
        In meantime you can try our CLI
        <Link href={"https://github.com/scobru/baluni"}> here</Link>
      </div>
      <div className="text-center mx-auto my-10 text-base font-semibold text-black">
        ⚖️ Select some tokens that you hold in your wallet, assign them a weight, and let Baluni handle the rest.
      </div>
      <TokenSelector />
      <div className="text-center  mx-auto my-10 text-sm font-semibold text-black">
        🪄 Check the console to see the magic happen{" "}
      </div>
      ,
    </div>
  );
};

export default Rebalance;
