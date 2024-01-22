// src/App.js
import React from "react";
import TokenSelector from "../../components/TokenSelector";
import { NextPage } from "next";

const Baluni: NextPage = () => {
  return (
    <div>
      <h1>Select a Token</h1>
      <TokenSelector />
    </div>
  );
};

export default Baluni;
