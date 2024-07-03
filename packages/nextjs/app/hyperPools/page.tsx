import React from "react";
import HyperPoolsBox from "../../components/HyperPoolsBox";
import type { NextPage } from "next";

/* eslint-disable @next/next/no-img-element */

const HyperPools: NextPage = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 ">
      <div className="flex justify-center items-center">
        <div className="font-bold text-center my-10 text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-blue-600 via-slate-400 to-base-300 text-transparent bg-clip-text">
          Hyper Pools
        </div>
      </div>{" "}
      <div className=" w-fit my-10 mx-20">
        <img
          src="https://cryptologos.cc/logos/yearn-finance-yfi-logo.png"
          alt=""
          className="bg-black   rounded-xl mask mask-circle w-16 h-16 mr-2 "
        />{" "}
      </div>
      <HyperPoolsBox />
      <div className=" text-center mx-auto my-10 text-sm font-semibold ">
        🪄 Check the console to see the magic happen{" "}
      </div>
    </div>
  );
};

export default HyperPools;
