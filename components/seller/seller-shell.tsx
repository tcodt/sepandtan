/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  LogOut,
  Menu,
  House,
  User,
  Store,
  Sun,
  Moon,
  X,
  ShieldCheck,
  Truck,
} from "lucide-react";

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
import { useAuth } from "@/features/auth/hooks/use-auth";

/* -------------------------------------------------------------------------- */
/*                                Nav config                                  */
/* -------------------------------------------------------------------------- */

const navItems = [
  { href: "/seller", label: "نمای کلی", icon: LayoutDashboard },
  { href: "/seller/products", label: "محصولات", icon: Package },
  { href: "/seller/orders", label: "سفارش‌ها", icon: ShoppingBag },
  { href: "/seller/shipping", label: "ارسال", icon: Truck },
  { href: "/", label: "صفحه اصلی", icon: House },
  { href: "/account", label: "حساب کاربری", icon: User },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/seller") return pathname === "/seller";
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
/*      Icon-first logo: image only after successful load                     */
/*      ALL hooks declared before the early return (Rules of Hooks)           */
/* -------------------------------------------------------------------------- */

function ThemeLogo({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [imageOk, setImageOk] = useState(false);
  const [primaryFailed, setPrimaryFailed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Derived on every render — recomputes when resolvedTheme changes.
  const themeFallback =
    resolvedTheme === "dark"
      ? "/images/logo-st-light.png"
      : "/images/logo-st-dark.png";

  const src = primaryFailed ? themeFallback : "/sepandtan.png";

  // Safe early return — all hooks declared above.
  if (!mounted) {
    return (
      <div
        className={cn("rounded-lg bg-muted", className)}
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-lg",
        imageOk ? "bg-transparent" : "bg-primary/10 text-primary",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {!imageOk && <Store className="h-1/2 w-1/2" aria-hidden="true" />}
      <Image
        // key forces React to remount the <img> when the source changes,
        // so onLoad fires again and imageOk tracks the new image.
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
        onError={() => {
          // Only fall back if the primary asset fails.
          if (!primaryFailed) {
            setPrimaryFailed(true);
            setImageOk(false);
          }
        }}
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
    <nav className="flex flex-col gap-1 p-2" aria-label="منوی فروشنده">
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
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150",
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
/*                                Shell                                       */
/* -------------------------------------------------------------------------- */

export function SellerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const sellerName =
    (user as { name?: string | null } | null | undefined)?.name?.trim() ||
    "پنل فروشنده";

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* --------------------------- Desktop sidebar -------------------------- */}
      <aside className="hidden h-screen w-64 shrink-0 flex-col border-e border-border bg-background md:sticky md:top-0 md:flex">
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md">
            <ThemeLogo size={32} className="h-full w-full" />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-bold text-foreground"
              title={sellerName}
            >
              {sellerName}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              پنل فروشنده
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <NavList pathname={pathname} />
        </div>

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
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/90 px-3 backdrop-blur md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
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
              {/* Header: title row with close X at end + brand row */}
              <div className="shrink-0 border-b border-border">
                <div className="flex items-start justify-between gap-2 px-4 pt-3">
                  <div className="min-w-0 flex-1">
                    <SheetTitle className="truncate text-sm font-bold text-foreground">
                      {sellerName}
                    </SheetTitle>
                    <SheetDescription className="truncate text-[10px] text-muted-foreground">
                      پنل فروشنده
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
                    <ThemeLogo size={36} className="h-full w-full" />
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

              {/* Scrollable nav with transparent scrollbar */}
              <div
                className={cn(
                  "min-h-0 flex-1 overflow-y-auto",
                  "scrollbar-thin [scrollbar-color:transparent_transparent]",
                  "hover:[scrollbar-color:rgba(148,163,184,0.35)_transparent]",
                  "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:bg-transparent",
                  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent",
                  "hover:[&::-webkit-scrollbar-thumb]:bg-zinc-400/30",
                )}
              >
                <NavList
                  pathname={pathname}
                  onNavigate={() => setOpen(false)}
                />
              </div>

              {/* Footer: ALWAYS visible */}
              <div className="shrink-0 border-t border-border bg-background/95 p-3 backdrop-blur supports-backdrop-filter:bg-background/80">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    className="flex-1 justify-start gap-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => {
                      setOpen(false);
                      setLogoutOpen(true);
                    }}
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    خروج
                  </Button>
                  <ThemeToggle />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <ShieldCheck
              className="h-4 w-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span
              className="truncate text-sm font-semibold text-foreground"
              title={sellerName}
            >
              {sellerName}
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
              آیا می‌خواهید از پنل فروشنده خارج شوید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel className="w-full sm:w-auto">
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:w-auto"
              onClick={() => {
                setLogoutOpen(false);
                logout();
              }}
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
