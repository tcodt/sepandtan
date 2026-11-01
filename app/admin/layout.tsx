/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  Loader2,
  LayoutDashboard,
  Users,
  LogOut,
  UserCheck,
  Store,
  Menu,
  ShieldCheck,
  Sun,
  Moon,
  House,
  User,
} from "lucide-react";

import { useRequireAuth, useAuth } from "@/features/auth/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/* -------------------------------------------------------------------------- */
/*                                Nav config                                  */
/* -------------------------------------------------------------------------- */

const navItems = [
  { href: "/admin", label: "داشبورد", icon: LayoutDashboard },
  { href: "/", label: "صفحه اصلی", icon: House },
  { href: "/admin/users", label: "کاربران", icon: Users },
  { href: "/admin/coaches", label: "مربیان", icon: UserCheck },
  { href: "/admin/stores", label: "فروشندگان", icon: Store },
  { href: "/account", label: "حساب کاربری", icon: User },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/* -------------------------------------------------------------------------- */
/*                              Theme toggle                                  */
/* -------------------------------------------------------------------------- */

function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-9 w-9", className)}
        aria-label="تغییر تم"
        disabled
      >
        <Sun className="h-4 w-4 opacity-0" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";
  const next = isDark ? "light" : "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "h-9 w-9 text-muted-foreground hover:text-foreground",
        className,
      )}
      onClick={() => setTheme(next)}
      aria-label={isDark ? "حالت روشن" : "حالت تاریک"}
      title={isDark ? "حالت روشن" : "حالت تاریک"}
    >
      {isDark ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </Button>
  );
}

/* -------------------------------------------------------------------------- */
/*                             Theme-aware logo                               */
/* -------------------------------------------------------------------------- */

function ThemeLogo({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn("rounded-lg bg-muted", className)}
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    );
  }

  const src =
    resolvedTheme === "dark"
      ? "/images/logo-st-light.png" // light logo on dark backgrounds
      : "/images/logo-st-dark.png"; // dark logo on light backgrounds

  return (
    <Image
      src={src}
      alt="سپندتن"
      width={size}
      height={size}
      className={cn("rounded-lg object-cover", className)}
      priority
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                                Nav list                                    */
/* -------------------------------------------------------------------------- */

function NavList({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav
      className="flex-1 space-y-1 overflow-y-auto p-3"
      aria-label="منوی ادمین"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
              "transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0",
                active
                  ? "text-primary-foreground"
                  : "text-muted-foreground group-hover:text-foreground",
              )}
              aria-hidden="true"
            />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Brand / Sidebar header                          */
/* -------------------------------------------------------------------------- */

function BrandHeader() {
  return (
    <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border px-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/60 overflow-hidden">
        <ThemeLogo size={32} className="h-full w-full" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-bold text-foreground">
          پنل ادمین
        </div>
        <div className="truncate text-[10px] text-muted-foreground">سپندتن</div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Layout                                     */
/* -------------------------------------------------------------------------- */

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isReady, isAuthenticated } = useRequireAuth({
    roles: ["admin"],
    redirectTo: "/login",
  });
  const { logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            className="h-8 w-8 animate-spin text-primary"
            aria-hidden="true"
          />
          <p className="text-xs text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const currentLabel =
    navItems.find((i) => isActive(pathname, i.href))?.label ?? "پنل ادمین";

  return (
    <div className="flex min-h-screen bg-background">
      {/* --------------------------- Desktop sidebar -------------------------- */}
      <aside
        className="hidden w-60 shrink-0 flex-col border-e border-border bg-muted/30 md:flex"
        aria-label="نوار کناری ادمین"
      >
        <BrandHeader />
        <NavList pathname={pathname} />

        <div className="flex items-center gap-1 border-t border-border p-3">
          <Button
            variant="ghost"
            className="flex-1 justify-start gap-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => setLogoutOpen(true)}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            خروج
          </Button>
          <ThemeToggle />
        </div>
      </aside>

      {/* ------------------------------- Main -------------------------------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                aria-label="باز کردن منو"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-64 flex-col p-0">
              <SheetHeader className="border-b border-border px-4 py-3 text-start">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60">
                    <ThemeLogo size={28} className="h-7 w-7" />
                  </div>
                  <SheetTitle className="text-sm font-bold">
                    پنل ادمین
                  </SheetTitle>
                </div>
              </SheetHeader>
              <NavList
                pathname={pathname}
                onNavigate={() => setMobileOpen(false)}
              />
              <div className="flex items-center gap-1 border-t border-border p-3">
                <Button
                  variant="ghost"
                  className="flex-1 justify-start gap-2 text-muted-foreground"
                  onClick={() => {
                    setMobileOpen(false);
                    setLogoutOpen(true);
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  خروج
                </Button>
                <ThemeToggle />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <ShieldCheck
              className="h-4 w-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span className="truncate text-sm font-semibold text-foreground">
              {currentLabel}
            </span>
          </div>

          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
            {children}
          </div>
        </main>
      </div>

      {/* ----------------------- Logout confirmation ----------------------- */}
      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>خروج از حساب</AlertDialogTitle>
            <AlertDialogDescription>
              آیا می‌خواهید از پنل ادمین خارج شوید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel className="w-full sm:w-auto">
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:w-auto"
              onClick={() => logout()}
            >
              <LogOut className="me-2 h-4 w-4" />
              خروج
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
