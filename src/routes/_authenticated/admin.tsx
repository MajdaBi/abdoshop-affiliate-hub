import { createFileRoute, redirect } from "@tanstack/react-router";
import { LayoutDashboard, Users, Package, ShoppingBag, Wallet, Settings } from "lucide-react";
import { AppShell, type NavItem } from "@/components/AppShell";
import { getRoleHome } from "@/lib/session";
import { pageHead } from "@/lib/page-head";

const items: NavItem[] = [
  { to: "/admin", label: "لوحة التحكم", icon: LayoutDashboard, exact: true },
  { to: "/admin/affiliates", label: "الأفلييتات", icon: Users },
  { to: "/admin/products", label: "المنتجات", icon: Package },
  { to: "/admin/orders", label: "الطلبات", icon: ShoppingBag },
  { to: "/admin/commissions", label: "العمولات", icon: Wallet },
  { to: "/admin/settings", label: "الإعدادات", icon: Settings },
];

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    if ((await getRoleHome()) !== "/admin") throw redirect({ to: "/app" });
  },
  head: () => pageHead("منطقة الإدارة", "إدارة حسابات الأفلييت والمنتجات والطلبات وإعدادات الإدارة."),
  component: () => <AppShell items={items} badge="لوحة الإدارة" />,
});
