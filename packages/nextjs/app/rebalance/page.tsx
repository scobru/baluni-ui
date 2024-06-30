import React from "react";
import RebalanceBox from "../../components/RebalanceBox";
import { NextPage } from "next";

if (typeof window !== "undefined") {
  // @ts-ignore
  window.Browser = {};
}

const Rebalance: NextPage = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex justify-center items-center">
        <div className="font-bold text-center my-10 text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-blue-600 via-slate-400 to-base-300 text-transparent bg-clip-text">
          Rebalance
        </div>
      </div>

      {/* Introduction Section */}
      {/* Cards Section */}
      <div className="collapse">
        <input type="checkbox" />
        <div className="collapse-title text-xl font-medium">How it works?</div>
        <div className="collapse-content grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 my-16">
          {/* Card 1 */}

          {/* Card 2 */}
          <div className="flex flex-col items-center p-6  rounded-lg ">
            <p className="text-6xl md:text-6xl text-left mb-2 justify-center leading-8 opacity-75">
              You can keep your tokens balanced according to the percentages you choose.
            </p>
          </div>

          <div className="flex flex-col bg-base-300 items-center p-10 shadow-lg rounded-lg hover:bg-base-100 hover:text-base-content transition-all duration-300">
            <p className="text-4xl md:text-4xl text-right align-sub mb-2 justify-center leading-4 ">
              Baluni automatically identifies the overperforming tokens and rebalances your portfolio.
            </p>
          </div>

          <div className="flex flex-col items-center p-6 rounded-lg bg-base-200 ">
            <div className="mt-8">
              <p className="text-2xl md:text-2xl text-justify leading-2 tracking-wider">
                By utilizing{" "}
                <a
                  href="https://www.odos.xyz/"
                  className="underline text-blue-600 hover:text-blue-800 transition-colors duration-300"
                >
                  ODOS
                </a>{" "}
                for routing, we ensure the best possible routing in the DeFi landscape.
                <img
                  src="https://assets.odos.xyz/landingPage/logo_white_transparent.png"
                  alt="ODOS Logo"
                  className="mt-2 mix-blend-difference"
                />
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mx-auto my-10 text-lg md:text-xl lg:text-xl font-semibold ">
        <RebalanceBox />
        <div className="animate-pulse mt-8">🪄 Check the console to see the magic happen</div>
      </div>
    </div>
  );
};

export default Rebalance;
