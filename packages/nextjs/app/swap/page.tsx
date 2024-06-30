import React from "react";
import SwapBox from "../../components/SwapBox";
import { NextPage } from "next";

/* eslint-disable @next/next/no-img-element */

const Swap: NextPage = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-center items-center">
        <div className="font-bold text-center my-10 text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-blue-600 via-slate-400 to-base-300 text-transparent bg-clip-text">
          Swap
        </div>
      </div>{" "}
      <div className="text-center mx-auto my-10 text-base font-semibold ">🦄 Swap your tokens</div>
      <div className=" w-fit my-10 mx-20">
        <img src="/favicon.png" alt="" className="w-20 h-20 rounded-xl" />{" "}
      </div>
      <SwapBox />
      <div className="text-center  mx-auto my-10 text-sm font-semibold ">
        🪄 Check the console to see the magic happen{" "}
      </div>
    </div>
  );
};

export default Swap;
