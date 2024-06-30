import React from "react";
import MintBox from "../../components/MintBox";
import { NextPage } from "next";

const Swap: NextPage = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 ">
      <div className="flex justify-center items-center">
        <div className="font-bold text-center my-10 text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-blue-600 via-slate-400 to-base-300 text-transparent bg-clip-text">
          Mint
        </div>
      </div>
      <div className="collapse">
        <input type="checkbox" />
        <div className="collapse-title text-xl font-medium">How it works?</div>
        <div className="collapse-content grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 my-16">
          <div className="flex flex-col items-center p-6  rounded-lg ">
            <p className="text-7xl md:text-7xl text-left mb-2 justify-center leading-2 opacity-75">
              Using Baluni protocol is subject to a protocol fee.
            </p>
          </div>

          <div className="flex flex-col items-center p-6  rounded-lg ">
            <p className="text-5xl font-light md:text-5xl text-left mb-2 justify-center leading-2 opacity-95">
              All fees collected are transferred to the main BALUNI contract.
            </p>
          </div>

          <div className="flex flex-col bg-base-300 items-center p-10 shadow-lg rounded-lg hover:bg-base-100 hover:text-base-content transition-all duration-300">
            <p className="text-4xl md:text-4xl text-right align-sub mb-2 justify-center leading-2 ">
              Users can mint the Baluni token to later burn it and withdraw a portion of the accumulated fees.
            </p>
            <div className="mt-8">
              <p className="text-2xl md:text-2xl text-justify leading-2 tracking-wider">
                The minting cost varies based on the collateral in fees present within the contract, ensuring that
                Baluni remains a circular ecosystem.
              </p>
            </div>
          </div>
        </div>
      </div>{" "}
      <MintBox />
    </div>
  );
};

export default Swap;
