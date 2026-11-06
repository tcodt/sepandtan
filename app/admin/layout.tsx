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
  X,
  Tags,
  Package,
  Award,
  Palette,
} from "lucide-react";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
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
import { useRequireAuth } from "@/hooks/use-require-auth";

/* -------------------------------------------------------------------------- */
/*                                Nav config                                  */
/* -------------------------------------------------------------------------- */

const navItems = [
  { href: "/admin", label: "نمای کلی", icon: LayoutDashboard },
  { href: "/admin/users", label: "کاربران", icon: Users },
  { href: "/admin/coaches", label: "درخواست مربی", icon: UserCheck },
  { href: "/admin/stores", label: "درخواست فروشنده", icon: Store },
  { href: "/admin/products", label: "محصولات", icon: Package },
  { href: "/admin/categories", label: "دسته‌بندی‌ها", icon: Tags },
  { href: "/admin/brands", label: "برندها", icon: Award },
  { href: "/admin/colors", label: "رنگ‌ها", icon: Palette },
  { href: "/", label: "سایت", icon: House },
  { href: "/account", label: "حساب", icon: User },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  if (href === "/") return pathname === "/";
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
        className={cn("h-9 w-9 shrink-0", className)}
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
        "h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground",
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
/*                          Icon-first theme logo                             */
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
  const [imageOk, setImageOk] = useState(false);

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
      ? "/images/logo-st-light.png"
      : "/images/logo-st-dark.png";

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-lg",
        imageOk ? "bg-transparent" : "bg-primary/10 text-primary",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {!imageOk && <ShieldCheck className="h-1/2 w-1/2" aria-hidden="true" />}
      <Image
        key={src}
        src={src}
        alt="سپندتن"
        width={size}
        height={size}
        className={cn(
          "absolute inset-0 h-full w-full rounded-lg object-cover transition-opacity duration-200",
          imageOk ? "opacity-100" : "opacity-0",
        )}
        priority
        onLoad={() => setImageOk(true)}
      />
    </div>
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
      className={cn(
        "min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-3",
        "[scrollbar-width:thin] [scrollbar-color:transparent_transparent]",
        "hover:[scrollbar-color:rgba(148,163,184,0.35)_transparent]",
        "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:bg-transparent",
        "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent",
        "hover:[&::-webkit-scrollbar-thumb]:bg-zinc-400/30",
      )}
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
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg">
        <ThemeLogo size={40} className="h-full w-full" />
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
    allowedRoles: ["admin"],
    redirectToLogin: "/login",
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
    // h-screen + overflow-hidden → sidebar owns the viewport; main column scrolls
    <div className="flex h-screen overflow-hidden bg-background">
      {/* --------------------------- Desktop sidebar -------------------------- */}
      <aside
        className="hidden h-screen w-60 shrink-0 flex-col border-e border-border bg-muted/30 md:sticky md:top-0 md:flex"
        aria-label="نوار کناری ادمین"
      >
        <BrandHeader />
        <NavList pathname={pathname} />

        <div className="flex shrink-0 items-center gap-1 border-t border-border p-3">
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
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                aria-label="باز کردن منو"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="flex h-full w-[85vw] max-w-xs flex-col gap-0 p-0 sm:w-72"
              showCloseButton={false}
            >
              {/* Row 1: title + close at the end */}
              <div className="shrink-0 border-b border-border">
                <div className="flex items-start justify-between gap-2 px-4 pt-3">
                  <div className="min-w-0 flex-1">
                    <SheetTitle className="truncate text-sm font-bold text-foreground">
                      پنل ادمین
                    </SheetTitle>
                    <SheetDescription className="truncate text-[10px] text-muted-foreground">
                      سپندتن
                    </SheetDescription>
                  </div>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label="بستن منو"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </SheetClose>
                </div>

                <div className="flex items-center gap-2.5 px-4 pb-3 pt-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                    <ThemeLogo size={32} className="h-full w-full" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-foreground">
                      سپندتن
                    </div>
                    <div className="truncate text-[10px] text-muted-foreground">
                      مربی شخصی هوشمند شما
                    </div>
                  </div>
                </div>
              </div>

              <NavList
                pathname={pathname}
                onNavigate={() => setMobileOpen(false)}
              />

              <div className="flex shrink-0 items-center gap-1 border-t border-border bg-background/95 p-3 backdrop-blur supports-backdrop-filter:bg-background/80">
                <Button
                  variant="ghost"
                  className="flex-1 justify-start gap-2 text-muted-foreground"
                  onClick={() => {
                    setMobileOpen(false);
                    setLogoutOpen(true);
                  }}
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
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

        {/* ONLY main scrolls */}
        <main className="flex-1 overflow-y-auto bg-muted/30 dark:bg-background">
          <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
            {children}
          </div>
        </main>
      </div>

      {/* ----------------------- Logout confirmation ----------------------- */}
      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent
          dir="rtl"
          className="max-w-[calc(100vw-2rem)] sm:max-w-md"
        >
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
              <LogOut className="me-2 h-4 w-4" aria-hidden="true" />
              خروج
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
