"use client";

import Link from "next/link";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/lib/types/plan";
import { LogoutDialog } from "@/components/common/logout-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

const mainNavItems = [
  { href: "/coach", label: "داشبورد", icon: LayoutDashboard },
  { href: "/coach/requests", label: "درخواست‌ها", icon: Inbox },
  { href: "/coach/clients", label: "هنرجویان", icon: Users },
  { href: "/coach/plans", label: "برنامه‌ها", icon: FileText },
];

/** Routes that own the whole viewport (no shell padding, no shell bottom nav). */
const FULL_BLEED_ROUTES = ["/coach/plans/new"];

type Props = {
  user: UserProfile;
  children: React.ReactNode;
};

function isNavActive(pathname: string, href: string) {
  if (href === "/coach") return pathname === "/coach";
  return pathname.startsWith(href);
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
    <div className="min-h-screen bg-background flex">
      {/* ============ Sidebar — Desktop ============ */}
      <aside
        className={cn(
          "hidden md:flex fixed top-0 right-0 bottom-0 z-40 flex-col",
          // LIGHT: warm card + visible border + soft shadow
          "bg-card border-l border-border shadow-sm shadow-foreground/3",
          // DARK: glass
          "dark:bg-card/80 dark:backdrop-blur-xl dark:shadow-none",
          "transition-[width] duration-300 ease-in-out",
          collapsed ? "w-19" : "w-64",
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "border-b border-border transition-all",
            collapsed ? "p-3" : "p-5",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-3",
              collapsed && "justify-center",
            )}
          >
            <div className="w-10 h-10 shrink-0 rounded-2xl bg-primary/15 flex items-center justify-center">
              <Image
                src="/images/main-logo.png"
                alt="سپندتن"
                width={48}
                height={48}
                className="rounded-full"
              />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-bold text-primary truncate">
                  پنل مربی سپندتن
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  مدیریت هنرجو و برنامه
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {mainNavItems.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl text-sm transition-all",
                  collapsed ? "justify-center px-2 py-2.5" : "px-3.5 py-2.5",
                  active
                    ? [
                        "bg-primary/10 text-primary font-semibold",
                        "ring-1 ring-inset ring-primary/30",
                        "dark:bg-primary/15 dark:ring-primary/20",
                      ]
                    : [
                        "text-muted-foreground",
                        "hover:bg-accent hover:text-accent-foreground",
                      ],
                )}
              >
                {active && !collapsed && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-l-full bg-primary" />
                )}
                <item.icon className="w-4.5 h-4.5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border space-y-1">
          <div
            className={cn(
              "flex items-center gap-3 mb-1",
              collapsed ? "justify-center px-1 py-2" : "px-3 py-2.5",
            )}
          >
            <Avatar className="h-9 w-9 shrink-0 border border-border">
              {user.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt={user.name} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-[11px] text-muted-foreground">مربی</p>
              </div>
            )}
          </div>

          {!collapsed && <Separator className="bg-border my-2" />}

          <Link
            href="/account"
            title={collapsed ? "حساب کاربری" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl text-sm transition-colors",
              collapsed ? "justify-center px-2 py-2.5" : "px-3.5 py-2.5",
              pathname.startsWith("/account")
                ? "bg-primary/10 text-primary font-medium ring-1 ring-inset ring-primary/30 dark:bg-primary/15 dark:ring-primary/20"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <UserRound className="w-4.5 h-4.5 shrink-0" />
            {!collapsed && <span className="truncate">حساب کاربری</span>}
          </Link>

          <Link
            href="/settings"
            title={collapsed ? "تنظیمات" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl text-sm transition-colors",
              collapsed ? "justify-center px-2 py-2.5" : "px-3.5 py-2.5",
              pathname.startsWith("/settings")
                ? "bg-primary/10 text-primary font-medium ring-1 ring-inset ring-primary/30 dark:bg-primary/15 dark:ring-primary/20"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Settings className="w-4.5 h-4.5 shrink-0" />
            {!collapsed && <span className="truncate">تنظیمات</span>}
          </Link>

          <LogoutDialog>
            <button
              type="button"
              title={collapsed ? "خروج" : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl text-sm text-destructive transition-colors",
                "hover:bg-destructive/10 dark:hover:bg-destructive/15",
                collapsed ? "justify-center px-2 py-2.5" : "px-3.5 py-2.5",
              )}
            >
              <LogOut className="w-4.5 h-4.5 shrink-0" />
              {!collapsed && <span className="truncate">خروج</span>}
            </button>
          </LogoutDialog>
        </div>

        {/* Toggle button */}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "باز کردن منو" : "بستن منو"}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 -left-3 z-50",
            "flex items-center justify-center w-6 h-6 rounded-full",
            "bg-card border border-border text-muted-foreground shadow-sm",
            "dark:bg-background dark:shadow-none dark:hover:shadow-md dark:hover:shadow-black/30",
            "hover:text-foreground hover:bg-accent",
            "hover:border-foreground/20 dark:hover:border-white/20",
            "transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
        >
          <ChevronRight
            className={cn(
              "w-3.5 h-3.5 transition-transform duration-300",
              collapsed && "rotate-180",
            )}
          />
        </button>
      </aside>

      {/* ============ Main ============ */}
      <main
        className={cn(
          "flex-1 flex flex-col min-h-screen min-w-0",
          // Only reserve space for the bottom mobile nav when NOT full-bleed
          isFullBleed ? "pb-0" : "pb-20 md:pb-0",
          "bg-muted/50 dark:bg-muted",
          "transition-[margin] duration-300 ease-in-out",
          collapsed ? "md:mr-19" : "md:mr-64",
        )}
      >
        {isFullBleed ? (
          // Full-bleed: hand the page the entire area, no wrapper
          children
        ) : (
          <div className="flex-1 w-full p-4 md:p-8 max-w-6xl mx-auto">
            {children}
          </div>
        )}
      </main>

      {/* ============ Bottom Nav — Mobile ============ */}
      {/* Hidden on full-bleed routes so the page owns its own bottom UI. */}
      {!isFullBleed && (
        <nav
          className={cn(
            "md:hidden fixed bottom-0 inset-x-0 z-50 safe-area-pb",
            // LIGHT: solid card + shadow
            "bg-card/95 border-t border-border",
            "shadow-[0_-4px_12px_-6px] shadow-foreground/10",
            // DARK: glass
            "dark:bg-background/80 dark:backdrop-blur-xl dark:shadow-none",
          )}
        >
          <div className="flex items-center justify-around h-16 px-1">
            {mainNavItems.map((item) => {
              const active = isNavActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center justify-center w-10 h-8 rounded-xl transition-colors",
                      active
                        ? "bg-primary/15 ring-1 ring-inset ring-primary/25 dark:bg-primary/15 dark:ring-primary/20"
                        : "group-hover:bg-accent",
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
