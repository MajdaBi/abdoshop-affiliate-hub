import { createFileRoute, redirect } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { AppShell, type NavItem } from "@/components/AppShell";
import { getRoleHome } from "@/lib/session";

const items: NavItem[] = [
  { to: "/admin", label: "لوحة التحكم", icon: LayoutDashboard, exact: true },
];

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    if ((await getRoleHome()) !== "/admin") throw redirect({ to: "/app" });
  },
  head: () => ({ meta: [{ title: "لوحة الإدارة — ABDO SHOP" }] }),
  component: () => <AppShell items={items} badge="لوحة الإدارة" />,
});
