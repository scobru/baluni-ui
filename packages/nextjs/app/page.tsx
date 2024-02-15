import Link from "next/link";
import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <div>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center mb-8">
            <span className="block text-2xl mb-2">Welcome to the Web Interface for</span>
            <span className="block text-5xl font-bold">Baluni CLI</span>
          </h1>
          <pre className="text-lg bg-gray-100 p-2 rounded-md text-black shadow-secondary shadow-md">
            <code>npm install baluni</code>
          </pre>
        </div>

        <div className="flex-grow bg-base-300 w-full mt-16 px-8 py-12">
          <p className="text-center text-xl mx-auto">
            This application serves as a graphical user interface for the Baluni command-line tool, offering a more
            accessible way to manage your ERC-20 tokens and interact with smart contracts.
          </p>{" "}
          <p className="text-center text-lg mt-4">
            Discover more about the Baluni CLI and its features on{" "}
            <Link
              href="https://github.com/scobru/baluni"
              target="_blank"
              rel="noopener noreferrer"
              className="italic bg-base-300 text-base font-bold"
            >
              GitHub
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
