import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard, ShoppingBag, PlusCircle, ListOrdered, Wallet, User } from "lucide-react";
import { AppShell, type NavItem } from "@/components/AppShell";
import { pageHead } from "@/lib/page-head";

const items: NavItem[] = [
  { to: "/app", label: "لوحة التحكم", icon: LayoutDashboard, exact: true },
  { to: "/app/products", label: "المنتجات", icon: ShoppingBag },
  { to: "/app/new-order", label: "إضافة طلب", icon: PlusCircle },
  { to: "/app/orders", label: "طلباتي", icon: ListOrdered },
  { to: "/app/commissions", label: "العمولات", icon: Wallet },
  { to: "/app/profile", label: "حسابي والإعدادات", icon: User },
];

export const Route = createFileRoute("/_authenticated/app")({
  head: () => pageHead("منطقة الأفلييت", "حساب الأفلييت والطلبات والعمولات وإعدادات الحساب."),
  component: () => <AppShell items={items} badge="حساب الأفلييت" />,
});
