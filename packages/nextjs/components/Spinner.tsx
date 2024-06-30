// components/Spinner.js
import React from "react";
import Image from "next/image";

const Spinner = () => {
  return (
    <div className="text-center w-20 h-20 mx-auto">
      <div role="status">
        <Image
          alt="Loading Spinner"
          className="cursor-pointer rounded-full w-20 h-20 animate-spin-bounce"
          src="/favicon.png"
          width={30}
          height={30}
        />
      </div>
    </div>
  );
};

export default Spinner;
