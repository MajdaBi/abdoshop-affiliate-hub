import { describe, expect, it, vi } from "vitest";
import { profileSchema, emailSchema, passwordSchema, verifyThenChangePassword } from "./account-settings";

describe("Account settings security", () => {
  it("accepts valid profile fields but rejects targeting another account", () => {
    expect(profileSchema.parse({ full_name: "  Majda Ouboukni  ", phone: "+212600000000" })).toEqual({ full_name: "Majda Ouboukni", phone: "+212600000000" });
    expect(profileSchema.safeParse({ full_name: "Majda", phone: "+212600000000", id: "another-user" }).success).toBe(false);
  });
  it("rejects self-assigned roles and activation changes", () => {
    for (const field of [{ role: "admin" }, { active: true }]) expect(profileSchema.safeParse({ full_name: "Majda", phone: "+212600000000", ...field }).success).toBe(false);
  });
  it("validates name and phone instead of truncating invalid input", () => {
    expect(profileSchema.safeParse({ full_name: "a", phone: "invalid-phone" }).success).toBe(false);
    expect(profileSchema.safeParse({ full_name: "a".repeat(101), phone: "12345678" }).success).toBe(false);
  });
  it("validates email addresses", () => {
    expect(emailSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
    expect(emailSchema.parse({ email: " account@example.com " }).email).toBe("account@example.com");
  });
  it("requires current password and matching new password confirmation", () => {
    expect(passwordSchema.safeParse({ current_password: "", password: "new-password", confirmation: "new-password" }).success).toBe(false);
    expect(passwordSchema.safeParse({ current_password: "old-password", password: "new-password", confirmation: "different" }).success).toBe(false);
  });
  it("never changes a password when current-password verification fails", async () => {
    const change = vi.fn();
    await expect(verifyThenChangePassword({ current_password: "wrong-password", password: "new-password", confirmation: "new-password" }, async () => false, change)).rejects.toThrow();
    expect(change).not.toHaveBeenCalled();
  });
  it("updates only after current-password verification succeeds", async () => {
    const change = vi.fn().mockResolvedValue(undefined);
    await verifyThenChangePassword({ current_password: "old-password", password: "new-password", confirmation: "new-password" }, async () => true, change);
    expect(change).toHaveBeenCalledWith("new-password", "old-password");
  });
});
