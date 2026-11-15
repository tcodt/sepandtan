"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Flame,
  UserRound,
  ShoppingCart,
  Heart,
  LogOut,
  Menu,
  X,
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
import { LogoutDialog } from "@/components/common/logout-dialog";
import { useUserStore } from "@/lib/store/user-store";
import { useCart } from "@/features/cart/hooks";
import { useWishlistIds } from "@/features/wishlist/hooks";
import {
  getAccountMenuLinks,
  getMobileNavLinks,
  getNavbarLinks,
  showCartAction,
  showWishlistAction,
  type NavContext,
  type ResolvedNavItem,
} from "@/features/auth/nav-config";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function isLinkActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function useNavContext(): NavContext {
  const hasHydrated = useUserStore((s) => s._hasHydrated);
  const user = useUserStore((s) => s.user);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const loggedIn = hasHydrated && isAuthenticated && !!user;

  return {
    user: loggedIn ? user : null,
    isAuthenticated: loggedIn,
  };
}

/* -------------------------------------------------------------------------- */
/* Account menu                                                               */
/* -------------------------------------------------------------------------- */

function AccountMenuItems({
  items,
  cartCount,
  wishlistCount,
  onNavigate,
}: {
  items: ResolvedNavItem[];
  cartCount: number;
  wishlistCount: number;
  onNavigate?: () => void;
}) {
  return (
    <>
      {items.map((item) => {
        const Icon = item.icon;
        let badge: number | null = null;
        if (item.badge === "cart" && cartCount > 0) badge = cartCount;
        if (item.badge === "wishlist" && wishlistCount > 0)
          badge = wishlistCount;

        return (
          <DropdownMenuItem key={item.id} asChild>
            <Link
              href={item.href}
              className="flex items-center gap-2"
              onClick={onNavigate}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="flex-1">{item.label}</span>
              {badge != null && (
                <Badge
                  variant="secondary"
                  className="ms-auto h-5 px-1.5 text-[10px] tabular-nums"
                >
                  {badge.toLocaleString("fa-IR")}
                </Badge>
              )}
            </Link>
          </DropdownMenuItem>
        );
      })}
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

  const ctx = useNavContext();
  const navbarLinks = getNavbarLinks(ctx);
  const mobileLinks = getMobileNavLinks(ctx);
  const accountLinks = getAccountMenuLinks(ctx);
  const canShowCart = showCartAction(ctx);
  const canShowWishlist = showWishlistAction(ctx);

  const { data: cart } = useCart(loggedIn && canShowCart);
  const cartCount = cart?.totalItems ?? 0;

  const { data: wishlistIds } = useWishlistIds(loggedIn && canShowWishlist);
  const wishlistCount = wishlistIds?.length ?? 0;

  return (
    <header className="sticky top-0 isolate z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
        {/* --------------------------- Mobile menu --------------------------- */}
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

            <nav className="min-h-0 flex-1 overflow-y-auto p-2">
              <ul className="space-y-1">
                {mobileLinks.map((link) => {
                  const Icon = link.icon;
                  const active = isLinkActive(pathname, link.href);
                  return (
                    <li key={link.id}>
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
                          <span className="flex-1">{link.label}</span>
                          {link.badge === "cart" && cartCount > 0 && (
                            <Badge
                              variant={active ? "secondary" : "secondary"}
                              className="h-5 px-1.5 text-[10px] tabular-nums"
                            >
                              {cartCount.toLocaleString("fa-IR")}
                            </Badge>
                          )}
                          {link.badge === "wishlist" && wishlistCount > 0 && (
                            <Badge className="h-5 px-1.5 text-[10px] tabular-nums">
                              {wishlistCount.toLocaleString("fa-IR")}
                            </Badge>
                          )}
                        </Link>
                      </SheetClose>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="shrink-0 border-t border-border p-3">
              {!hasHydrated ? (
                <div className="h-10 animate-pulse rounded-lg bg-muted" />
              ) : loggedIn ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
                    <UserRound
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="truncate text-sm font-medium">
                      {user.name}
                    </span>
                  </div>
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

        {/* --------------------------- Desktop nav ---------------------------- */}
        <ul className="hidden flex-1 items-center gap-0.5 lg:flex">
          {navbarLinks.map((link) => {
            const active = isLinkActive(pathname, link.href);
            return (
              <li key={link.id}>
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

        {/* ----------------------------- Actions ------------------------------ */}
        <div className="ms-auto flex items-center gap-1 sm:gap-2">
          <ModeToggle />

          {canShowWishlist && (
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-full"
            >
              <Link
                href="/wishlist"
                aria-label={`علاقه‌مندی‌ها (${wishlistCount})`}
              >
                <Heart className="h-4 w-4" />
                {wishlistCount > 0 && (
                  <span className="absolute -inset-e-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular-nums">
                    {wishlistCount > 99
                      ? "۹۹+"
                      : wishlistCount.toLocaleString("fa-IR")}
                  </span>
                )}
              </Link>
            </Button>
          )}

          {canShowCart && (
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
              <DropdownMenuContent align="end" className="w-56">
                <AccountMenuItems
                  items={accountLinks}
                  cartCount={cartCount}
                  wishlistCount={wishlistCount}
                />
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
              <DropdownMenuContent align="end" className="w-56">
                <AccountMenuItems
                  items={accountLinks}
                  cartCount={cartCount}
                  wishlistCount={wishlistCount}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </nav>
    </header>
  );
}
