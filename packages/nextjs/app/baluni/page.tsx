// src/App.js
import React from "react";
import TokenSelector from "../../components/TokenSelector";
import { NextPage } from "next";

const Baluni: NextPage = () => {
  return (
    <div>
      <div className="text-center font-bold mx-auto my-10 text-6xl">Select a Token</div>
      <TokenSelector />
    </div>
  );
};

export default Baluni;
