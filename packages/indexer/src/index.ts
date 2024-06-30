import { ponder } from "@/generated";

ponder.on("byUSDCx.deposit()", async ({ event, context }) => {
  // Fetch All Vaults from Vault Registry
  try {
    const fromAddress = event.args[1] ? String(event.args[1]) : null;
    const amount = event.args[0] || null;
    const timestamp = BigInt(event.block.timestamp.toString());
    if (event && fromAddress && amount && timestamp && event.transaction.hash) {
      await context.db.byUSDCxDeposits.create({
        id: event.transaction.hash,
        data: {
          amount: amount,
          from: fromAddress,
          timestamp: timestamp,
        },
      });
    } else {
      console.warn("Missing or invalid event arguments:", event.args);
    }
  } catch (error) {
    console.error("Error processing byUSDCx.deposit() event:", error);
  }
});
