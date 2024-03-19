/* eslint-disable react/no-unescaped-entities */
import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <div>
      <div className="flex items-center flex-col flex-grow pt-10 mx-4">
        <div className="px-5 w-full max-w-screen-md">
          <h1 className="text-center mb-8 text-black">
            <span className="block text-2xl mb-2">Welcome to </span>
            <span className="block text-5xl font-bold">Baluni</span>
          </h1>
          <pre className="text-lg bg-gray-100 p-2 rounded-md text-black shadow-secondary shadow-md">
            <code>npm install baluni</code>
          </pre>
          <pre className="text-lg bg-gray-100 p-2 my-2 rounded-md text-black shadow-secondary shadow-md">
            <code>git clone https://github.com/scobru/baluni</code>
          </pre>
        </div>

        <div className="flex flex-col w-full max-w-screen-md p-4 my-4  bg-base-200 ">
          <div className="container mx-auto p-4">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold ">About the project</h1>
              <p className="mt-4 text-lg">
                Baluni is an innovative application tailored for trading on decentralized exchanges, specifically
                targeting platforms like Uniswap. It is designed to assist both new and experienced traders in managing
                their cryptocurrency portfolios with ease. Baluni incorporates various features and tools to facilitate
                trading activities, making the management of ERC-20 tokens and smart contract interactions more
                accessible to a broad audience.
              </p>
            </div>

            <h2 className="text-3xl font-bold  mb-4">Key Components</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h3 className="card-title">Baluni CLI and GUI</h3>
                  <p>
                    The Baluni Command Line Interface (CLI) serves as the foundation of your project, offering powerful
                    features for managing ERC-20 tokens and interacting with smart contracts.
                  </p>
                  <p>
                    The Baluni Graphical User Interface (GUI) is built on top of the CLI, aiming to simplify the user
                    interaction with decentralized finance (DeFi) applications.
                  </p>
                </div>
              </div>
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h3 className="card-title">Deployment</h3>
                  <p>
                    Baluni Router is deployed on Polygon network. Baluni Pool and Tournament are deployed on Mumbai
                    testnet.
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-3xl font-bold  mb-4">Main Features</h2>
            <ul className="list-disc list-inside mb-8">
              <li>
                Market Prediction with AI: Utilizes machine learning technology for accurate forecasts on token price
                movements.
              </li>
              <li>
                Technical Analysis Tools: Includes RSI, StochRSI, and KST indicators for guiding trading decisions.
              </li>
              <li>
                Yearn Finance Integration: Leverages Yearn Finance for interest generation on idle assets between
                trades.
              </li>
              <li>
                Dollar-Cost Averaging (DCA): Allows users to invest a fixed amount in tokens over time, reducing the
                impact of volatility.
              </li>
              <li>Pump-and-dump Tool: Facilitates quick buy or sell actions for specific token pairs on Uniswap.</li>
            </ul>

            <h2 className="text-3xl font-bold  mb-4">Additional Innovations</h2>
            <ul className="list-disc list-inside mb-8">
              <li>
                Baluni Pool and Tournament: Introduces unique concepts for engaging users in prediction markets and
                competitive tournaments, focusing on participation and accuracy, respectively.
              </li>
              <li>
                Keeper Script: Automates the resolution of predictions and tournaments, enhancing user experience and
                platform reliability.
              </li>
            </ul>

            <div className="mb-8">
              <h2 className="text-3xl font-bold  mb-4">Configurability</h2>
              <p>
                The project emphasizes flexibility, allowing users to customize trading strategies by activating or
                deactivating modules based on their preferences. It supports a variety of prediction models and
                technical analysis indicators.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold  mb-4">Installation and Usage</h2>
              <p>
                Baluni can be easily installed using yarn or npm, and offers straightforward commands for accessing its
                features, including rebalancing, investing, and using the DCA module.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold  mb-4">Community and Contribution</h2>
              <p>
                The project encourages contributions and aims to foster a vibrant community of users and developers. It
                provides details for support and community engagement.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold  mb-4">Technical and Operational Insights</h2>
              <p>
                Baluni utilizes smart contracts for its core functionalities, including managing pools and tournaments
                on the blockchain. It integrates with Yearn Finance to optimize the value of assets between trades,
                supporting a dynamic and efficient investment strategy. The application leverages various technical
                analysis tools and AI-driven market prediction models to inform trading strategies. Baluni is built with
                the aim of making DeFi more accessible, providing a user-friendly interface on top of powerful trading
                and investment tools. In summary, Baluni is positioned as a comprehensive toolset for DeFi traders,
                blending traditional trading mechanisms with innovative blockchain technology to streamline and enhance
                the trading experience on decentralized platforms.
              </p>
            </div>

            <div className="mb-4">
              <p className="italic">Mainnet application available at:</p>
              <a href="https://baluni.vercel.app/" className="text-blue-500 underline">
                https://baluni.vercel.app/
              </a>
            </div>
            <div className="mb-4">
              <p className="italic">Testnet application available at:</p>
              <a href="https://balunibeta.vercel.app/" className="text-blue-500 underline">
                https://balunibeta.vercel.app/
              </a>
            </div>
            <p className="mb-4">
              Due to token scarcity, the rebalance feature is available only on the Mainnet application.
            </p>
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Github Repositories:</h3>
              <ul className="list-disc list-inside pl-4">
                <li>
                  <a href="https://github.com/scobru/baluni" className="text-blue-500 underline">
                    Main repository (CLI)
                  </a>
                </li>
                <li>
                  <a href="https://github.com/scobru/baluni-ui" className="text-blue-500 underline">
                    Web interface repository
                  </a>{" "}
                  (for those who prefer a graphical approach)
                </li>
                <li>
                  <a href="https://github.com/scobru/baluni-api" className="text-blue-500 underline">
                    API repository
                  </a>{" "}
                  (used by both of the above)
                </li>
                <li>
                  <a href="https://github.com/scobru/baluni-contracts" className="text-blue-500 underline">
                    Contracts repository
                  </a>{" "}
                  (our fee is in the Agent Contract, just 0.1%)
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
