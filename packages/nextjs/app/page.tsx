// pages/index.js o il file della tua landing page in Next.js
import Head from "next/head";
import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-gray-100 min-h-screen">
      <Head>
        <title>Baluni - Home</title>
        <meta name="description" content="Welcome to Baluni" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Reddit+Sans:ital,wght@0,200..900;1,200..900&display=swap"
          rel="stylesheet"
        ></link>
      </Head>

      {/* Hero Section */}
      <div className="hero min-h-screen bg-back font-sans">
        <div className="hero-overlay bg-opacity-30"></div>
        <div className="hero-content text-center text-neutral-content">
          <div className="max-w-xl">
            <h1 className="mb-5 text-5xl font-bold text-black">Rebalance your tokens with no effort.</h1>
            <Link href="/rebalance" passHref className="btn btn-primary">
              Rebalance
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-base-100 text-base-content">
        <div className="container mx-auto p-4 ">
          <p className="text-5xl text-center max-w-xl mx-auto justify-center font-bold">
            An innovative application designed for trading on dexs.
          </p>
          <p className="text-2xl text-center max-w-xl mx-auto justify-start font-semibold my-10">
            Make your portfolio balanced with a signle click.
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="hero bg-back2 ">
        <div className="container  mx-auto p-4 my-10 max-w-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card bg-base-300 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">CLI</h2>
                <p>Explore the Baluni core, learn to use baluni locally</p>
                <div className="card-actions justify-end">
                  <a
                    href="https://github.com/plancia/baluni"
                    className="btn btn-primary"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Explore
                  </a>
                </div>
              </div>
            </div>
            <div className="card bg-base-300 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">CONTRACTS</h2>
                <p>Smart contract for baluni ecosystem.</p>
                <div className="card-actions justify-end">
                  <a
                    href="https://github.com/plancia/baluni-contracts"
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                  >
                    Explore
                  </a>
                </div>
              </div>
            </div>
            <div className="card bg-primary shadow-xl text-primary-content">
              <div className="card-body">
                <h2 className="card-title">GUI</h2>
                <p>COMING SOON</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-primary" disabled={true}>
                    Explore
                  </button>
                </div>
              </div>
            </div>
            {/* Altre caratteristiche qui */}
          </div>
        </div>
      </div>
    </div>
  );
}
