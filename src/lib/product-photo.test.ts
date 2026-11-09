import { beforeEach, expect, it, vi } from "vitest";
const storage = vi.hoisted(() => ({ from: vi.fn(), upload: vi.fn(), createSignedUrl: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { storage } }));
import { uploadProductPhoto, resolveProductPhoto, validateProductPhoto } from "./product-photo";
beforeEach(() => {
  vi.clearAllMocks();
  storage.from.mockReturnValue(storage);
});
it("stores uploaded photos persistently, never saving a temporary preview", async () => {
  storage.upload.mockResolvedValue({ error: null });
  const file = new File(["photo"], "photo.png", { type: "image/png" });
  const ref = await uploadProductPhoto(file);
  expect(ref).toMatch(/^storage:\/\/product-photos\/[\w-]+\.png$/);
  expect(storage.from).toHaveBeenCalledWith("product-photos");
  expect(storage.upload).toHaveBeenCalledWith(expect.stringMatching(/\.png$/), file, { contentType: "image/png", upsert: false });
});
it("preserves existing product image URLs unchanged", async () => {
  await expect(resolveProductPhoto("/images/sandals.jpg")).resolves.toBe("/images/sandals.jpg");
  await expect(resolveProductPhoto("https://example.com/photo.jpg")).resolves.toBe("https://example.com/photo.jpg");
  expect(storage.from).not.toHaveBeenCalled();
});
it("resolves stored references into renewable display URLs", async () => {
  storage.createSignedUrl.mockResolvedValue({ data: { signedUrl: "https://example.com/signed" }, error: null });
  await expect(resolveProductPhoto("storage://product-photos/a.png")).resolves.toBe("https://example.com/signed");
  expect(storage.createSignedUrl).toHaveBeenCalledWith("a.png", 3600);
});
it("never reports an upload denied by storage permissions as successful", async () => {
  storage.upload.mockResolvedValue({ error: { message: "denied" } });
  await expect(uploadProductPhoto(new File(["x"], "a.png", { type: "image/png" }))).rejects.toThrow();
});
it("rejects non-image uploads", () => {
  expect(() => validateProductPhoto({ type: "text/html", size: 5 })).toThrow();
});
it("rejects images above the storage limit", () => {
  expect(() => validateProductPhoto({ type: "image/png", size: 10 * 1024 * 1024 + 1 })).toThrow();
});