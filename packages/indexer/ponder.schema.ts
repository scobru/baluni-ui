import { createSchema } from "@ponder/core";

export default createSchema((p) => ({
  byUSDCxDeposits: p.createTable({
    id: p.string(),
    from: p.string(),
    amount: p.bigint(),
    timestamp: p.bigint().optional(),
  }),
}));
