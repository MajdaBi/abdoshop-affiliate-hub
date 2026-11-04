import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ from: vi.fn(), delete: vi.fn(), eq: vi.fn(), select: vi.fn(), single: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: db.from } }));
import { deleteAdminOrder } from "./order-delete";

const id = "c7d4e38c-a7fa-4e7c-b0cd-53595c68ad88";
beforeEach(() => {
  vi.clearAllMocks();
  db.from.mockReturnValue({ delete: db.delete });
  db.delete.mockReturnValue({ eq: db.eq });
  db.eq.mockReturnValue({ select: db.select });
  db.select.mockReturnValue({ single: db.single });
});
describe("Admin order deletion", () => {
  it("deletes only the selected order UUID, never related records", async () => {
    db.single.mockResolvedValue({ data: { id }, error: null });
    await expect(deleteAdminOrder(id)).resolves.toBe(id);
    expect(db.from.mock.calls).toEqual([["orders"]]);
    expect(db.delete).toHaveBeenCalledOnce();
    expect(db.eq.mock.calls).toEqual([["id", id]]);
    expect(db.select).toHaveBeenCalledWith("id");
  });
  it("does not report success when affiliate RLS denies deletion", async () => {
    db.single.mockResolvedValue({ data: null, error: { code: "PGRST116" } });
    await expect(deleteAdminOrder(id)).rejects.toThrow();
  });
  it("reports a database failure", async () => {
    db.single.mockResolvedValue({ data: null, error: { message: "Network failed" } });
    await expect(deleteAdminOrder(id)).rejects.toThrow();
  });
  it("rejects non-UUID order numbers before making a deletion request", async () => {
    await expect(deleteAdminOrder("ABDO-00001")).rejects.toThrow();
    expect(db.from).not.toHaveBeenCalled();
  });
});