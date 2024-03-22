// pages/index.js o il file della tua landing page in Next.js
import Head from "next/head";

export default function Home() {
  return (
    <div className="bg-gray-100 min-h-screen">
      <Head>
        <title>Baluni - Home</title>
        <meta name="description" content="Benvenuto a Baluni" />
      </Head>

      {/* Hero Section */}
      <div className="hero min-h-screen bg-back">
        <div className="hero-overlay bg-opacity-50"></div>
        <div className="hero-content text-center text-neutral-content">
          <div className="max-w-xl">
            <h1 className="mb-5 text-5xl font-bold text-black">Rebalance your token with no effort.</h1>

            <button className="btn btn-primary">Rebalance</button>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="hero text-black">
        <div className="container mx-auto px-4  my-8">
          <p className="text-5xl text-center max-w-xl mx-auto justify-center font-bold">
            BALUNI is an innovative application designed for trading on dexs.
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
                <p>Dowload Baluni Command Line Interface from Github</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-primary">Download</button>
                </div>
              </div>
            </div>
            <div className="card bg-base-300 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">GUI</h2>
                <p>COMING SOON</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-primary" disabled={true}>
                    Download
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
