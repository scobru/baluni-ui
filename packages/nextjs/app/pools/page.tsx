import React from "react";
import PoolsBox from "../../components/PoolsBox";
import type { NextPage } from "next";

/* eslint-disable @next/next/no-img-element */

const Pools: NextPage = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-center items-center">
        <div className="font-bold text-center my-10 text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-blue-600 via-slate-400 to-base-300 text-transparent bg-clip-text">
          Pools
        </div>
      </div>
      <div className="collapse">
        <input type="checkbox" />
        <div className="collapse-title text-xl font-medium">How it Works?</div>
        <div className="collapse-content grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 my-16">
          {/* Card 1 */}
          <div className="flex flex-col items-center p-6 rounded-lg">
            <p className="text-6xl md:text-6xl text-left mb-2 justify-center opacity-75">
              Add liquidity to pools with more than two token.
            </p>
          </div>

          {/* Card 2 */}
          <div className="flex flex-col bg-base-300 items-center p-10 shadow-lg rounded-lg hover:bg-base-100 hover:text-base-content transition-all duration-300">
            <p className="text-4xl md:text-4xl text-right align-sub mb-2 justify-center leading-7">
              Liquidity providers can rebalance the pool to maintain balanced value.
            </p>
            <p className="text-4xl md:text-4xl text-right align-sub mb-2 justify-center leading-7">
              The rates within the pool are maintained through Uniswap v3 oracles.
            </p>
          </div>

          <div className="flex flex-col bg-base-300 items-center p-10 shadow-lg rounded-lg hover:bg-base-100 hover:text-base-content transition-all duration-300">
            <p className="text-5xl md:text-5xl text-right align-sub mb-2 justify-center ">
              One position for more tokens.
            </p>
          </div>
        </div>
      </div>
      <div className="w-fit my-10 mx-20">
        <img src="/favicon.png" alt="BALUNI Logo" className="w-20 h-20 rounded-xl" />
      </div>
      <PoolsBox />
    </div>
  );
};

export default Pools;
