import { expect } from "chai";
import { ethers } from "hardhat";
import { BaluniPoolV1, Oracle } from "../typechain-types";

describe("BaluniPoolV1", function () {
  let baluniPool: BaluniPoolV1;
  let oracle: Oracle;
  let accounts;
  let registrationFee: bigint;

  before(async function () {
    accounts = await ethers.getSigners();
    oracle = await ethers.deployContract("Oracle", ["0xAB594600376Ec9fD91F8e885dADF0CE036862dE0"], {
      value: 0,
    });
    await oracle.waitForDeployment();

    baluniPool = await ethers.deployContract("BaluniPoolV1", [oracle.address]);
    await baluniPool.waitForDeployment();
  });

  describe("submit", function () {
    it("should allow users to submit predictions with the correct fee", async function () {
      const submissionFee = await baluniPool.getSubmissionFee();
      const tx = await baluniPool.submit(0, parseUnits("1000", "wei"), { value: submissionFee });
      await tx.wait();

      const predictionCount = await baluniPool.getPredictionCount();
      expect(predictionCount).to.equal(1);
    });

    it("should allow submission of predictions with required fee", async function () {
      const predictedPrice = parseUnits("1000", "wei");
      await expect(baluniPool.submit(0, predictedPrice, { value: registrationFee }))
        .to.emit(baluniPool, "PredictionRegistered")
        .withArgs(
          accounts[0].address,
          0,
          predictedPrice,
          "expected actual price",
          "expected timestamp",
          "expected endTime",
        );

      const totalPredictions = await baluniPool.getTotalPredictions();
      expect(totalPredictions).to.be.equal(1);
    });

    it("should correctly calculate rewards for a user", async function () {
      // Supponendo che l'utente abbia sottomesso previsioni e sia passato il tempo necessario per il calcolo delle ricompense
      const reward = await baluniPool.calculateReward(accounts[0].address);
      expect(reward).to.be.gt(0); // Verifica che la ricompensa sia maggiore di 0
    });

    it("should allow withdrawal of rewards after the waiting period", async function () {
      // Simula il passaggio del tempo necessario qui
      await expect(baluniPool.exit())
        .to.emit(baluniPool, "RewardWithdrawn")
        .withArgs(accounts[0].address, "expected amount");
    });

    it("should resolve predictions correctly after endTime", async function () {
      // Simula il passaggio del tempo oltre endTime delle previsioni
      await baluniPool.resolve();
      // Verifica che le previsioni siano state marcate come risolte
      const prediction = await baluniPool.getPrediction(0);
      expect(prediction.resolved).to.be.true;
    });

    it("should correctly identify if there are any unresolved predictions past their endTime", async function () {
      // Supponendo che ci siano previsioni non risolte oltre il loro endTime
      const hasUnresolved = await baluniPool.hasAnyUnresolvedPastEndTime();
      expect(hasUnresolved).to.be.true;
    });
  });
});
