/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import React from "react";
import { Button, buttonVariants } from "../ui/button";
import { ModeToggle } from "../common/mode-toggle";
import {
  CircleUserRound,
  Flame,
  LogOut,
  Settings,
  ShoppingCart,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import MobileNavigation from "../common/mobile-navigation";

export default function Navbar() {
  return (
    <header className="w-full bg-popover p-4 border-b border-border">
      <nav className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DropdownMenu dir="rtl">
            <DropdownMenuTrigger asChild>
              <Button
                variant={"default"}
                className="rounded-full md:hidden sm:block"
              >
                <UserRound />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>
                <Link href="/account" className="flex items-center gap-1">
                  <CircleUserRound />
                  حساب کاربری
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/cart" className="flex items-center gap-1">
                  <ShoppingCart />
                  سبد خرید
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/setting" className="flex items-center gap-1">
                  <Settings />
                  تنظیمات
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/logout" className="flex items-center gap-1">
                  <LogOut />
                  خروج
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant={"default"}
            className="rounded-full hidden md:flex items-center gap-1"
          >
            شروع کنید <Flame />
          </Button>

          <ModeToggle />

          <DropdownMenu dir="rtl">
            <DropdownMenuTrigger asChild>
              <Button variant={"ghost"} className="rounded-full">
                <Image src="/images/ir.png" alt="flag" width={20} height={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>
                <Image src="/images/en.png" alt="flag" width={20} height={20} />
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Image src="/images/de.png" alt="flag" width={20} height={20} />
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Image src="/images/ir.png" alt="flag" width={20} height={20} />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <ul className="hidden md:flex items-center gap-2 md:gap-4">
          <li>
            <Link href="/" className={buttonVariants({ variant: "ghost" })}>
              خانه
            </Link>
          </li>
          <li>
            <Link
              href="/store"
              className={buttonVariants({ variant: "ghost" })}
            >
              فروشگاه
            </Link>
          </li>
          <li>
            <Link
              href="/workouts"
              className={buttonVariants({ variant: "ghost" })}
            >
              حرکات
            </Link>
          </li>
          <li>
            <Link href="/ai" className={buttonVariants({ variant: "ghost" })}>
              هوش مصنوعی
            </Link>
          </li>
          <li>
            <Link
              href="/about"
              className={buttonVariants({ variant: "ghost" })}
            >
              درباره ما
            </Link>
          </li>
        </ul>

        <Link href="/">
          <img
            src="/images/main-logo.png"
            alt="Logo"
            className="rounded-full object-cover h-20"
          />
        </Link>
      </nav>

      {/* Mobile Menu */}
      <MobileNavigation />
    </header>
  );
}
