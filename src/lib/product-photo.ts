import { supabase } from "@/integrations/supabase/client";

export const PHOTO_BUCKET = "product-photos";
const prefix = `storage://${PHOTO_BUCKET}/`;
const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

export function validateProductPhoto(file: Pick<File, "type" | "size">) {
  if (!extensions[file.type]) throw new Error("اختار صورة JPG أو PNG أو WebP أو GIF");
  if (!file.size || file.size > 10 * 1024 * 1024) throw new Error("حجم الصورة خاصو يكون أقل من 10 MB");
}

export async function uploadProductPhoto(file: File): Promise<string> {
  validateProductPhoto(file);
  const path = `${crypto.randomUUID()}.${extensions[file.type]}`;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error("تعذر رفع الصورة. حاول مرة أخرى.");
  return prefix + path;
}

export async function resolveProductPhoto(reference: string): Promise<string> {
  if (!reference.startsWith(prefix)) return reference;
  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(reference.slice(prefix.length), 3600);
  if (error || !data?.signedUrl) throw new Error("تعذر تحميل الصورة");
  return data.signedUrl;
}

export async function removeUnusedProductPhoto(reference: string) {
  if (reference.startsWith(prefix)) await supabase.storage.from(PHOTO_BUCKET).remove([reference.slice(prefix.length)]);
}