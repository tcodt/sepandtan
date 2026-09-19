"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Users,
  FileText,
  UserRound,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/lib/types/plan";
import { LogoutDialog } from "@/components/common/logout-dialog";

const mainNavItems = [
  { href: "/coach", label: "داشبورد", icon: LayoutDashboard },
  { href: "/coach/requests", label: "درخواست‌ها", icon: Inbox },
  { href: "/coach/clients", label: "هنرجویان", icon: Users },
  { href: "/coach/plans", label: "برنامه‌ها", icon: FileText },
];

type Props = {
  user: UserProfile;
  children: React.ReactNode;
};

export function CoachShell({ user, children }: Props) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-lg font-bold text-primary">پنل مربی سپندتن</h1>
          <p className="text-sm text-muted-foreground mt-1">{user.name}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {mainNavItems.map((item) => {
            const isActive =
              item.href === "/coach"
                ? pathname === "/coach"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors",
                  isActive
                    ? "bg-primary/20 text-primary font-medium"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* بخش پایین سایدبار */}
        <div className="p-4 border-t border-white/10 space-y-1">
          <Link
            href="/account"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors",
              pathname.startsWith("/account")
                ? "bg-primary/20 text-primary font-medium"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
            )}
          >
            <UserRound className="w-5 h-5" />
            حساب کاربری
          </Link>

          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors",
              pathname.startsWith("/settings")
                ? "bg-primary/20 text-primary font-medium"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
            )}
          >
            <Settings className="w-5 h-5" />
            تنظیمات
          </Link>

          <LogoutDialog>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              خروج
            </button>
          </LogoutDialog>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen pb-20 md:pb-0">
        <div className="flex-1 p-4 md:p-8">{children}</div>
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center justify-around h-16">
          {mainNavItems.map((item) => {
            const isActive =
              item.href === "/coach"
                ? pathname === "/coach"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-2 py-2 text-[11px]",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}

          {/* آیتم حساب در موبایل */}
          <Link
            href="/account"
            className={cn(
              "flex flex-col items-center gap-1 px-2 py-2 text-[11px]",
              pathname.startsWith("/account")
                ? "text-primary"
                : "text-muted-foreground",
            )}
          >
            <UserRound className="w-5 h-5" />
            حساب
          </Link>
        </div>
      </nav>
    </div>
  );
}
