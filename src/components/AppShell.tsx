import { Link, Outlet, useNavigate, type LinkProps } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export interface NavItem {
  to: NonNullable<LinkProps["to"]>;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  mobile?: boolean;
}

export function AppShell({ items, badge }: { items: NavItem[]; badge: string }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
  return (
    <div dir="rtl" className="min-h-screen bg-background md:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar p-5 text-sidebar-foreground md:flex">
        <div className="mb-8">
          <p className="font-display text-2xl font-bold tracking-wide">ABDO SHOP</p>
          <p className="text-xs text-sidebar-primary">{badge}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {items.map((i) => (
            <Link
              key={i.to}
              to={i.to}
              activeOptions={{ exact: i.exact ?? false }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-primary font-bold" }}
            >
              <i.icon className="size-4" /> {i.label}
            </Link>
          ))}
        </nav>
        <Button variant="ghost" onClick={signOut} className="justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground">
          <LogOut className="size-4" /> تسجيل الخروج
        </Button>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between bg-sidebar px-4 py-3 text-sidebar-foreground md:hidden">
        <p className="font-display text-lg font-bold">ABDO SHOP</p>
        <Button variant="ghost" size="sm" onClick={signOut} aria-label="تسجيل الخروج" className="gap-1 text-xs text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground">
          <LogOut className="size-4" /> خروج
        </Button>
      </header>

      <main className="min-w-0 flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-10 md:pt-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t bg-card py-2 md:hidden">
        {items.filter((i) => i.mobile !== false).map((i) => (
          <Link
            key={i.to}
            to={i.to}
            activeOptions={{ exact: i.exact ?? false }}
            className="flex flex-1 flex-col items-center gap-0.5 text-[10px] text-muted-foreground"
            activeProps={{ className: "text-primary font-bold" }}
          >
            <i.icon className="size-5" />
            {i.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
