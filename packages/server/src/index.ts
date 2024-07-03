import { fetchUnitPrices } from "./fetchUnitPrices";
import { fetchTotalValuation } from "./fetchTotalValuation";
import { fetchInterestEarned } from "./fetchInterestEarned";
import { dcaExecutor } from "./dcaExecutor";
import { reinvestEarnings } from "./reinvestEarnings";
import { rebalancePools } from "./rebalancePools";
import { fetchHyperPools } from "./fetchHyperPools";
import { deleteOldRecords } from "./deleteOldRecords";
import "./server";

var Table = require("cli-table");

async function main() {
  console.log("✔️ Starting main execution...");

  const tasks = [
    { name: "Fetching unit prices", func: fetchUnitPrices },
    { name: "Fetching total valuation", func: fetchTotalValuation },
    { name: "Fetching total interest earned", func: fetchInterestEarned },
    { name: "Executing DCA", func: dcaExecutor },
    { name: "Reinvesting earnings", func: reinvestEarnings },
    { name: "Rebalancing pools", func: rebalancePools },
    { name: "Fetching hyper pools data", func: fetchHyperPools },
    { name: "Deleting old records", func: deleteOldRecords },
  ];

  const table = new Table({
    head: ["Task", "Status"],
    colWidths: [50, 10],
  });

  for (const task of tasks) {
    try {
      console.log(`🚀 ${task.name}...`);
      await task.func();
      table.push([task.name, "✅"]);
    } catch (error) {
      console.error(`❌ Error in ${task.name}:`, error);
      table.push([task.name, "❌"]);
    }
    console.log("🎉 Done");
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  console.log(table.toString());
}

(async () => {
  const interval = Number(process.env.INTERVAL) || 3600000; // Default to 1 hour if INTERVAL is not defined
  setInterval(() => {
    main().catch(error => console.error("❌ Error in main execution:", error));
  }, interval);
  main().catch(error => console.error("❌ Error in main execution:", error));
})();
