import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/StatusBadge";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: () => <PageTitle title="لوحة الإدارة" sub="صفحات الإدارة قيد الإنجاز" />,
});
