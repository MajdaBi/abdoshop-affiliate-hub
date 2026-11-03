import { createFileRoute } from "@tanstack/react-router";
import { AccountSettings } from "@/components/AccountSettings";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/app/profile")({
  head: () => pageHead("حسابي والإعدادات", "تحديث معلومات حساب الأفلييت والبريد الإلكتروني وكلمة السر بأمان."),
  component: AccountSettings,
});
