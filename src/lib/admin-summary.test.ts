import { describe, expect, it } from "vitest";
import { adminSummary, affiliateSummary } from "./admin-summary";

const orders = [
  { affiliate_id: "a", status: "delivered" as const, commission: 60, selling_price: 200, quantity: 2 },
  { affiliate_id: "a", status: "cancelled" as const, commission: 30, selling_price: 200, quantity: 1 },
  { affiliate_id: "b", status: "pending" as const, commission: 40, selling_price: 300, quantity: 1 },
];
describe("Admin reporting", () => {
  it("counts revenue from delivered quantities only", () => { expect(adminSummary(orders).revenue).toBe(400); });
  it("excludes cancelled commissions", () => { expect(adminSummary(orders).commissions.total).toBe(100); });
  it("isolates each affiliate's commissions", () => { expect(affiliateSummary(orders, "a").commissions.total).toBe(60); });
});