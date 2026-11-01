import { describe, expect, it } from "vitest";
import { summarizeCommissions } from "./commission";

describe("summarizeCommissions", () => {
  const orders = [
    { status: "pending" as const, commission: 20 },
    { status: "confirmed" as const, commission: 30 },
    { status: "shipped" as const, commission: 10 },
    { status: "delivered" as const, commission: "25" },
    { status: "cancelled" as const, commission: 100 },
  ];
  it("does not count cancelled orders", () => {
    expect(summarizeCommissions(orders).total).toBe(85);
  });
  it("counts only delivered orders as earned", () => {
    expect(summarizeCommissions(orders).delivered).toBe(25);
  });
  it("groups confirmed and shipped together", () => {
    expect(summarizeCommissions(orders).confirmed).toBe(40);
    expect(summarizeCommissions(orders).pending).toBe(20);
  });
});
