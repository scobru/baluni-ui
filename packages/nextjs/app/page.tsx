/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";
import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <div>
      <div className="flex items-center flex-col flex-grow pt-10 mx-4">
        <div className="px-5">
          <h1 className="text-center mb-8 text-black">
            <span className="block text-2xl mb-2">Welcome to the Web Interface for</span>
            <span className="block text-5xl font-bold">Baluni CLI</span>
          </h1>
          <pre className="text-lg bg-gray-100 p-2 rounded-md text-black shadow-secondary shadow-md">
            <code>npm install baluni</code>
          </pre>
        </div>

        <div className="flex-grow bg-base-300 bg-opacity-50 xl:w-1/2 lg:w-1/2 md:w-1/2 w-full mt-16 px-8 py-12 rounded-xl">
          <p className="text-center text-xl mx-auto ">
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
          <div className="my-8">
            <div className="container mx-auto px-4 py-8">
              <div className="shadow rounded-lg p-10 bg-base-100 border border-secondary shadow-neutral ">
                <h1 className="text-6xl font-bold  mb-4">Pool</h1>
                <p className="text-xl ">
                  The Baluni Pool is not your average prediction market. Here, the emphasis is on participation,
                  enabling users to engage with the DeFi ecosystem in a unique and inclusive manner.
                </p>

                <h2 className="text-5xl  mt-6 mb-4">How It Works</h2>
                <ul className="list-disc list-inside text-lg ">
                  <li>
                    <strong>Participation Over Accuracy:</strong> Unlike traditional prediction pools, rewards in the
                    Baluni Pool are distributed based on participation. This model encourages active involvement and
                    continuous engagement with the platform.
                  </li>
                  <li>
                    <strong>Staking MATIC:</strong> Users stake MATIC tokens to participate. A registration fee is
                    required, contributing to the total prize pool. This fee is a fixed amount, ensuring fairness and
                    accessibility for all participants.
                  </li>
                  <li>
                    <strong>Reward Mechanism:</strong> Rewards are calculated based on the proportion of an individual's
                    participation relative to the total number of participants. This ensures a fair distribution where
                    every participant gets a share of the prize pool, emphasizing the community aspect of the platform.
                  </li>
                  <li>
                    <strong>Prediction Submission:</strong> Participants can still submit their price predictions for
                    MATIC. While the accuracy of these predictions does not directly influence reward distribution, it
                    adds an element of strategy and engagement, fostering a more vibrant community interaction.
                  </li>
                  <li>
                    <strong>Exit Strategy:</strong> Participants can choose to exit the pool, with rewards distributed
                    after a 30-day cooldown period. This system is designed to promote longer-term engagement while
                    allowing flexibility for users.
                  </li>
                  <li>
                    <strong>Yearn Finance Integration:</strong> The Baluni Pool now utilizes the wMATIC vault from Yearn
                    Finance to generate interest. This integration allows the pool to earn passive income, further
                    increasing the rewards for participants.
                  </li>
                  <Link
                    href="https://yearn.fi/v3/137/0x28F53bA70E5c8ce8D03b1FaD41E9dF11Bb646c36"
                    target="_blank"
                    rel="noopener noreferrer"
                    className=" link italic bg-base-300 text-lg font-bold"
                  >
                    Yearn Vault{" "}
                  </Link>
                </ul>
                <Link
                  href="/pool"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-hover mt-4 mx-auto text-lg"
                >
                  Pool
                </Link>
              </div>
            </div>
          </div>
          <div className="container mx-auto px-4 py-8">
            <div className="shadow rounded-lg p-10 bg-base-100 border border-secondary shadow-neutral">
              <h2 className="text-6xl font-bold  mb-4">Tournament</h2>
              <p className="text-xl  mb-6">
                For those seeking a competitive edge, the Baluni Tournament offers a dynamic prediction market where
                accuracy is key.
              </p>

              <div className="md:flex md:justify-center md:space-x-8">
                <div className="mb-6 md:mb-0">
                  <h2 className="text-5xl  mt-6 mb-4">Tournament Highlights</h2>
                  <ul className="list-disc pl-5 space-y-2 text-lg">
                    <li>
                      <strong>Competitive Predictions:</strong> Submit your best guess on the future price of MATIC. The
                      closer your prediction is to the actual price, the higher your chances of winning.
                    </li>
                    <li>
                      <strong>Prize Pool:</strong> A collective prize pool is formed from the entry fees. After each
                      tournament round concludes, the prize pool is distributed among the winners based on the accuracy
                      of their predictions.
                    </li>
                    <li>
                      <strong>Entry and Resolution:</strong> Participants enter by paying an entry fee and submit their
                      predictions within a specified timeframe. The tournament is resolved after the verification time,
                      and rewards are allocated to the top predictors.
                    </li>
                  </ul>
                </div>
              </div>
              <Link
                href="/tournament"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-hover mt-4 mx-auto text-lg"
              >
                Tournament
              </Link>
            </div>
          </div>
          <div className="container mx-auto px-4 py-8">
            <div className="shadow rounded-lg p-10 bg-base-100 border border-secondary shadow-neutral">
              <h2 className="text-6xl font-bold mb-4 ">Forecasting on Baluni</h2>
              <p className="text-xl mb-6">
                Dive into the future of DeFi predictions with our advanced forecasting tool. Whether you're a seasoned
                trader or just starting out, our platform provides the insights you need to make informed decisions.
              </p>
              <div className="md:flex md:justify-center md:space-x-8">
                <div className="mb-6 md:mb-0">
                  <h2 className="text-5xl  mt-6 mb-4">Forecasting Features</h2>
                  <ul className="list-disc pl-5 space-y-2 text-lg">
                    <li>
                      <strong>Algorithm Selection:</strong> Choose from a variety of prediction algorithms including
                      REGR, 1CONV, LSTM, RNN, and GRU to tailor your forecasting strategy.
                    </li>
                    <li>
                      <strong>Flexible Periods:</strong> Set your prediction period from a range of options to best
                      match your trading strategy, whether short-term gains or long-term investments.
                    </li>
                    <li>
                      <strong>Real-Time Data:</strong> Leverage up-to-date market data for accurate forecasts and stay
                      ahead in the competitive DeFi space.
                    </li>
                    <li>
                      <strong>Community Participation:</strong> Publish your forecast and engage with the Baluni
                      community. Participate in the community pool to win rewards based on your forecasting accuracy.
                    </li>
                  </ul>
                  <div className="mt-4">
                    <h4 className="text-xl font-semibold mb-2">Getting Started:</h4>
                    <p className="text-lg">
                      Ready to make your mark? Start by selecting your preferred algorithm and period, then make your
                      prediction and watch as the market unfolds. Don't forget to stake your forcast into the pool and
                      to participate in the tournament for a chance to win!
                    </p>
                  </div>
                </div>
              </div>
              <Link
                href="/forecast"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-hover mt-4 mx-auto text-lg"
              >
                Forecast
              </Link>
            </div>
          </div>
          <div className="container mx-auto px-4 py-8">
            <div className="shadow rounded-lg p-10 bg-base-100 border border-secondary shadow-neutral">
              <h2 className="text-6xl font-bold  mb-4">Rebalance Your Portfolio</h2>
              <p className="text-xl mb-6">
                Optimize your investments with our Rebalance feature. Ensure your portfolio aligns with your strategic
                goals by adjusting the distribution of your assets.
              </p>

              <div className="md:flex md:justify-center md:space-x-8">
                <div className="mb-6 md:mb-0">
                  <h3 className="text-5xl  mb-2 my-2">Rebalance Process</h3>
                  <ul className="list-disc pl-5 space-y-2 text-lg">
                    <li>
                      <strong>Token Selection:</strong> Choose from a wide range of tokens to include in your portfolio.
                      Customize the percentage allocation for each token based on your investment strategy.
                    </li>
                    <li>
                      <strong>Automatic Balancing:</strong> Our platform analyzes your portfolio and suggests
                      adjustments to match your target allocation, enhancing your portfolio's performance over time.
                    </li>
                    <li>
                      <strong>Execution:</strong> With a simple click, execute the suggested rebalance. Our smart
                      contracts will adjust your holdings to reflect your desired portfolio composition.
                    </li>
                  </ul>
                  <div className="mt-4">
                    <h4 className="text-xl font-semibold mb-2">Benefits:</h4>
                    <p className="text-lg">
                      Rebalancing helps manage risk, take advantage of market cycles, and maintain a well-diversified
                      portfolio. Stay aligned with your investment goals without the hassle of manual adjustments.
                    </p>
                  </div>
                </div>
              </div>
              <Link
                href="/rebalance"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-hover mt-4 mx-auto text-lg"
              >
                Rebalance
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
