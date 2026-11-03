import { createFileRoute } from "@tanstack/react-router";
import { AccountSettings } from "@/components/AccountSettings";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => pageHead("إعدادات الإدارة", "تحديث معلومات حساب الإدارة والبريد الإلكتروني وكلمة السر بأمان."),
  component: AccountSettings,
});