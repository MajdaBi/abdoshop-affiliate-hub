import { z } from "zod";

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, "الاسم قصير").max(100, "الاسم طويل جداً"),
  phone: z.string().trim().min(8, "رقم الهاتف غير صحيح").max(20, "رقم الهاتف طويل جداً").regex(/^[+0-9 ()-]+$/, "رقم الهاتف غير صحيح"),
}).strict();
export const emailSchema = z.object({ email: z.string().trim().email("البريد الإلكتروني غير صحيح").max(255) }).strict();
export const passwordSchema = z.object({
  current_password: z.string().min(1, "أدخل كلمة السر الحالية").max(100),
  password: z.string().min(8, "كلمة السر الجديدة خاصها 8 حروف على الأقل").max(100),
  confirmation: z.string().min(1, "أكد كلمة السر الجديدة").max(100),
}).strict().refine((p) => p.password === p.confirmation, { message: "كلمتا السر غير متطابقتين", path: ["confirmation"] })
  .refine((p) => p.password !== p.current_password, { message: "اختَر كلمة سر مختلفة عن الحالية", path: ["password"] });

// Verify before updating; never use the browser's existing session as proof of a password.
export async function verifyThenChangePassword(
  input: z.infer<typeof passwordSchema>,
  verify: (password: string) => Promise<boolean>,
  change: (password: string, currentPassword: string) => Promise<void>,
) {
  const data = passwordSchema.parse(input);
  if (!(await verify(data.current_password))) throw new Error("كلمة السر الحالية غير صحيحة");
  await change(data.password, data.current_password);
}