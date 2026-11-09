"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Flame,
  UserRound,
  CircleUserRound,
  ShoppingCart,
  Settings,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  Home,
  Store,
  Dumbbell,
  Sparkles,
  Info,
  Mail,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/common/mode-toggle";
import { LogoutDialog } from "../common/logout-dialog";
import { useUserStore } from "@/lib/store/user-store";
import { useCart } from "@/features/cart/hooks";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Config                                                                     */
/* -------------------------------------------------------------------------- */

const navLinks = [
  { href: "/", label: "خانه", icon: Home },
  { href: "/store", label: "فروشگاه", icon: Store },
  { href: "/workouts", label: "حرکات", icon: Dumbbell },
  { href: "/ai", label: "هوش مصنوعی", icon: Sparkles },
  { href: "/about", label: "درباره ما", icon: Info },
  { href: "/contact", label: "تماس با ما", icon: Mail },
];

function getDashboardHref(role?: string) {
  if (role === "admin") return "/admin";
  if (role === "coach") return "/coach";
  if (role === "seller") return "/seller";
  return "/dashboard";
}

function isLinkActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/* -------------------------------------------------------------------------- */
/* Shared account menu items                                                  */
/* -------------------------------------------------------------------------- */

function AccountMenuItems({
  cartCount,
  userRole,
  onNavigate,
}: {
  cartCount: number;
  userRole?: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <DropdownMenuItem asChild>
        <Link
          href={getDashboardHref(userRole)}
          className="flex items-center gap-2"
          onClick={onNavigate}
        >
          <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
          داشبورد
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link
          href="/account"
          className="flex items-center gap-2"
          onClick={onNavigate}
        >
          <CircleUserRound className="h-4 w-4" aria-hidden="true" />
          حساب کاربری
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link
          href="/cart"
          className="flex items-center gap-2"
          onClick={onNavigate}
        >
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
          سبد خرید
          {cartCount > 0 && (
            <Badge
              variant="secondary"
              className="ms-auto h-5 px-1.5 text-[10px] tabular-nums"
            >
              {cartCount.toLocaleString("fa-IR")}
            </Badge>
          )}
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link
          href="/settings"
          className="flex items-center gap-2"
          onClick={onNavigate}
        >
          <Settings className="h-4 w-4" aria-hidden="true" />
          تنظیمات
        </Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <LogoutDialog>
        <button
          type="button"
          className="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 focus:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          خروج
        </button>
      </LogoutDialog>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Navbar                                                                     */
/* -------------------------------------------------------------------------- */

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const hasHydrated = useUserStore((s) => s._hasHydrated);
  const user = useUserStore((s) => s.user);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);

  const loggedIn = hasHydrated && isAuthenticated && !!user;

  const { data: cart } = useCart(loggedIn);
  const cartCount = cart?.totalItems ?? 0;

  return (
    // `isolate` creates a stacking context so the header's z-40 can't be
    // pierced by children with z-index, and `backdrop-blur` doesn't break
    // paint ordering in Safari.
    <header className="sticky top-0 isolate z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
        {/* --------------------------- Mobile menu trigger ------------------- */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full lg:hidden"
              aria-label="باز کردن منو"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>

          <SheetContent
            side="right"
            dir="rtl"
            className="flex w-[85vw] max-w-xs flex-col gap-0 p-0 sm:w-72"
            showCloseButton={false}
          >
            {/* Header */}
            <SheetHeader className="shrink-0 border-b border-border px-4 py-3 text-start">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                  <Image
                    src="/images/logo-light.jpg"
                    alt="سپندتن"
                    width={36}
                    height={36}
                    className="h-full w-full object-cover"
                  />
                </div>
                <SheetTitle className="min-w-0 flex-1 truncate text-sm font-bold">
                  سپندتن
                </SheetTitle>
                <SheetClose asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    aria-label="بستن منو"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </SheetClose>
              </div>
            </SheetHeader>

            {/* Nav links */}
            <nav className="min-h-0 flex-1 overflow-y-auto p-2">
              <ul className="space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const active = isLinkActive(pathname, link.href);
                  return (
                    <li key={link.href}>
                      <SheetClose asChild>
                        <Link
                          href={link.href}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                            active
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground hover:bg-muted",
                          )}
                        >
                          <Icon
                            className="h-4 w-4 shrink-0"
                            aria-hidden="true"
                          />
                          {link.label}
                        </Link>
                      </SheetClose>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Auth footer */}
            <div className="shrink-0 border-t border-border p-3">
              {!hasHydrated ? (
                <div className="h-10 animate-pulse rounded-lg bg-muted" />
              ) : loggedIn ? (
                <div className="space-y-1">
                  <div className="mb-2 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
                    <UserRound
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="truncate text-sm font-medium">
                      {user.name}
                    </span>
                  </div>
                  <SheetClose asChild>
                    <Link
                      href={getDashboardHref(user?.role)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted"
                    >
                      <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                      داشبورد
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href="/account"
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted"
                    >
                      <CircleUserRound className="h-4 w-4" aria-hidden="true" />
                      حساب کاربری
                    </Link>
                  </SheetClose>
                  <LogoutDialog>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      خروج
                    </button>
                  </LogoutDialog>
                </div>
              ) : (
                <div className="space-y-2">
                  <SheetClose asChild>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/login">ورود</Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button asChild className="w-full gap-1.5">
                      <Link href="/register">
                        شروع رایگان
                        <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </Button>
                  </SheetClose>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* ------------------------------ Logo -------------------------------- */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label="سپندتن — خانه"
        >
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-muted ring-1 ring-border">
            <Image
              src="/images/logo-light.jpg"
              alt=""
              width={36}
              height={36}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <span className="hidden text-base font-bold text-foreground sm:block">
            سپندتن
          </span>
        </Link>

        {/* ------------------------------ Desktop nav ------------------------- */}
        <ul className="hidden flex-1 items-center gap-0.5 lg:flex">
          {navLinks.map((link) => {
            const active = isLinkActive(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "relative h-9 px-3 text-sm font-medium",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {link.label}
                  {active && (
                    <span
                      className="absolute inset-x-3 bottom-0.5 h-0.5 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* ------------------------------ Actions ----------------------------- */}
        <div className="ms-auto flex items-center gap-1 sm:gap-2">
          <ModeToggle />

          {/* Cart */}
          {loggedIn && (
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-full"
            >
              <Link href="/cart" aria-label={`سبد خرید (${cartCount} کالا)`}>
                <ShoppingCart className="h-4 w-4" />
                {cartCount > 0 && (
                  <span className="absolute -inset-e-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular-nums">
                    {cartCount > 99 ? "۹۹+" : cartCount.toLocaleString("fa-IR")}
                  </span>
                )}
              </Link>
            </Button>
          )}

          {/* Auth — desktop */}
          {!hasHydrated ? (
            <div className="hidden h-8 w-24 animate-pulse rounded-full bg-muted md:block" />
          ) : loggedIn ? (
            <DropdownMenu dir="rtl">
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden h-9 gap-2 rounded-full md:flex"
                >
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <UserRound className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span className="max-w-24 truncate text-sm">
                    {user.name.split(" ")[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <AccountMenuItems cartCount={cartCount} userRole={user.role} />
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden h-9 rounded-full md:inline-flex"
              >
                <Link href="/login">ورود</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="hidden h-9 gap-1.5 rounded-full shadow-sm md:inline-flex"
              >
                <Link href="/register">
                  شروع رایگان
                  <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </Button>
            </>
          )}

          {/* Account — mobile-only compact button */}
          {hasHydrated && loggedIn && (
            <DropdownMenu dir="rtl">
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full md:hidden"
                  aria-label="حساب کاربری"
                >
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <UserRound className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <AccountMenuItems cartCount={cartCount} userRole={user.role} />
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </nav>
    </header>
  );
}
