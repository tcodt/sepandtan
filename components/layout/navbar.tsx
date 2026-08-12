"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Flame,
  UserRound,
  CircleUserRound,
  ShoppingCart,
  Settings,
  LogOut,
  LayoutDashboard,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { ModeToggle } from "@/components/common/mode-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserStore } from "@/lib/store/user-store";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "خانه" },
  { href: "/store", label: "فروشگاه" },
  { href: "/workouts", label: "حرکات" },
  { href: "/ai", label: "هوش مصنوعی" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس با ما" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useUserStore();

  const handleLogout = () => {
    logout();
    // بعداً می‌تونی router.push("/login") هم اضافه کنی
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/70">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 overflow-hidden">
        {/* Right side (RTL): Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/images/main-logo-removebg-preview.png"
            alt="سپندتن"
            width={55}
            height={55}
            className="rounded-full object-cover h-14 w-14 dark:bg-white/50"
            priority
          />
          <span className="hidden sm:block font-bold text-lg text-foreground">
            سپندتن
          </span>
        </Link>

        {/* Center: Desktop Links */}
        <ul className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "relative text-sm font-medium",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-primary" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Left side (RTL): Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Language (اختیاری – فعلاً ساده نگه داشتم) */}
          <DropdownMenu dir="rtl">
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hidden sm:flex"
              >
                <Image
                  src="/images/ir.png"
                  alt="زبان"
                  width={18}
                  height={18}
                  className="rounded-sm"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-30">
              <DropdownMenuItem className="gap-2">
                <Image
                  src="/images/ir.png"
                  alt="فارسی"
                  width={16}
                  height={16}
                />
                فارسی
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Image
                  src="/images/en.png"
                  alt="English"
                  width={16}
                  height={16}
                />
                English
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Image
                  src="/images/de.png"
                  alt="Deutsch"
                  width={16}
                  height={16}
                />
                Deutsch
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ModeToggle />

          {/* Auth state */}
          {isAuthenticated && user ? (
            <DropdownMenu dir="rtl">
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-2 hidden md:flex"
                >
                  <UserRound className="w-4 h-4" />
                  <span className="max-w-25 truncate">
                    {user.name.split(" ")[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    داشبورد
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account" className="flex items-center gap-2">
                    <CircleUserRound className="w-4 h-4" />
                    حساب کاربری
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/cart" className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    سبد خرید
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    تنظیمات
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                  خروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="rounded-full hidden md:flex"
              >
                <Link href="/login">ورود</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="rounded-full gap-1.5 shadow-sm hidden md:flex"
              >
                <Link href="/register">
                  شروع رایگان
                  <Flame className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </>
          )}

          {/* Mobile user menu */}
          <DropdownMenu dir="rtl">
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full md:hidden"
              >
                <UserRound className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {isAuthenticated && user ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      داشبورد
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="flex items-center gap-2">
                      <CircleUserRound className="w-4 h-4" />
                      حساب کاربری
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      تنظیمات
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                    خروج
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/login">ورود</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/register">ثبت‌نام</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/about">درباره ما</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/contact">تماس با ما</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </header>
  );
}
