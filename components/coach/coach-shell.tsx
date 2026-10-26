"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Inbox,
  Users,
  FileText,
  UserRound,
  Settings,
  LogOut,
  ChevronRight,
  Home,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/lib/types/plan";
import { LogoutDialog } from "@/components/common/logout-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

/* ------------------------------ nav config ------------------------------ */

const HOME_ROUTE = "/coach";

const mainNavItems = [
  { href: "/coach", label: "داشبورد", icon: LayoutDashboard },
  { href: "/coach/requests", label: "درخواست‌ها", icon: Inbox },
  { href: "/coach/clients", label: "هنرجویان", icon: Users },
  { href: "/coach/plans", label: "برنامه‌ها", icon: FileText },
  { href: "/coach/financial", label: "مالی", icon: Wallet },
] as const;

const secondaryNavItems = [
  { href: "/", label: "خانه", icon: Home },
  { href: "/coach/plans", label: "برنامه‌ها", icon: FileText },
  { href: "/account", label: "حساب کاربری", icon: UserRound },
  { href: "/settings", label: "تنظیمات", icon: Settings },
] as const;

const EXACT_MATCH_ROUTES = new Set<string>(["/", HOME_ROUTE]);
const FULL_BLEED_ROUTES = ["/coach/plans/new"];

type Props = {
  user: UserProfile;
  children: React.ReactNode;
};

function isNavActive(pathname: string, href: string) {
  const normalized = (pathname || "/").replace(/\/+$/, "") || "/";
  const base = href.replace(/\/+$/, "");
  if (EXACT_MATCH_ROUTES.has(href)) return normalized === base;
  return normalized === base || normalized.startsWith(`${base}/`);
}

export function CoachShell({ user, children }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const isFullBleed = FULL_BLEED_ROUTES.some((r) => pathname.startsWith(r));

  const initials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("") ?? "م";

  return (
    <>
      {/* ================= Sidebar — Desktop ================= */}
      <aside
        aria-label="ناوبری اصلی"
        className={cn(
          "fixed inset-y-0 right-0 z-40 hidden flex-col md:flex",
          "border-l border-border bg-card shadow-sm shadow-foreground/3",
          "dark:bg-card/80 dark:shadow-none dark:backdrop-blur-xl",
          "motion-safe:transition-[width] motion-safe:duration-300 motion-safe:ease-in-out",
          collapsed ? "w-19" : "w-64",
        )}
      >
        {/* Brand */}
        <div
          className={cn("border-b border-border", collapsed ? "p-3" : "p-5")}
        >
          <div
            className={cn(
              "flex items-center gap-3",
              collapsed && "justify-center",
            )}
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15">
              <Image
                src="/images/logo-light.jpg"
                alt="سپندتن"
                width={40}
                height={40}
                className="rounded-full"
                priority
              />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-primary">
                  پنل مربی سپندتن
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  مدیریت هنرجو و برنامه
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Primary nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto overscroll-contain p-3">
          {mainNavItems.map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              collapsed={collapsed}
              active={isNavActive(pathname, item.href)}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="space-y-1 border-t border-border p-3">
          <div
            className={cn(
              "mb-1 flex items-center gap-3",
              collapsed ? "justify-center px-1 py-2" : "px-3 py-2.5",
            )}
          >
            <Avatar className="size-9 shrink-0 border border-border">
              {user.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt={user.name} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-xs text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="text-[11px] text-muted-foreground">مربی</p>
              </div>
            )}
          </div>

          {!collapsed && <Separator className="my-2 bg-border" />}

          {secondaryNavItems.map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              collapsed={collapsed}
              active={isNavActive(pathname, item.href)}
            />
          ))}

          <LogoutDialog>
            <button
              type="button"
              title={collapsed ? "خروج" : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl text-sm text-destructive transition-colors",
                "hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "dark:hover:bg-destructive/15",
                collapsed ? "justify-center px-2 py-2.5" : "px-3.5 py-2.5",
              )}
            >
              <LogOut className="size-4.5 shrink-0" />
              {!collapsed && <span className="truncate">خروج</span>}
            </button>
          </LogoutDialog>
        </div>

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "باز کردن منو" : "بستن منو"}
          aria-pressed={collapsed}
          className={cn(
            "absolute -left-3 top-1/2 z-50 flex size-6 -translate-y-1/2 items-center justify-center rounded-full",
            "border border-border bg-card text-muted-foreground shadow-sm",
            "hover:border-foreground/20 hover:bg-accent hover:text-foreground",
            "dark:bg-background dark:shadow-none dark:hover:border-white/20 dark:hover:shadow-md dark:hover:shadow-black/30",
            "motion-safe:transition-all motion-safe:duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
        >
          <ChevronRight
            className={cn(
              "size-3.5 motion-safe:transition-transform motion-safe:duration-300",
              collapsed && "rotate-180",
            )}
          />
        </button>
      </aside>

      {/* ================= Main ================= */}
      <main
        className={cn(
          "flex min-h-dvh min-w-0 flex-1 flex-col bg-muted/50 dark:bg-muted",
          isFullBleed
            ? "pb-0"
            : "pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-0",
          "motion-safe:transition-[margin] motion-safe:duration-300 motion-safe:ease-in-out",
          collapsed ? "md:mr-19" : "md:mr-64",
        )}
      >
        {isFullBleed ? (
          children
        ) : (
          <div className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 md:p-8">
            {children}
          </div>
        )}
      </main>
    </>
  );
}

type NavItem = { href: string; label: string; icon: React.ElementType };

function SidebarLink({
  item,
  collapsed,
  active,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-3 rounded-xl text-sm transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        collapsed ? "justify-center px-2 py-2.5" : "px-3.5 py-2.5",
        active
          ? "bg-primary/10 font-semibold text-primary ring-1 ring-inset ring-primary/30 dark:bg-primary/15 dark:ring-primary/20"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {active && !collapsed && (
        <span className="absolute right-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-l-full bg-primary" />
      )}
      <Icon className="size-4.5 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}
