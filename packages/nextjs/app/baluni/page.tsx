// src/App.js
import React from "react";
import TokenSelector from "../../components/TokenSelector";
import { NextPage } from "next";

const Baluni: NextPage = () => {
  return (
    <div>
      <div className="text-center mx-auto my-4 text-xl">Select a Token</div>
      <TokenSelector />
    </div>
  );
};

export default Baluni;
