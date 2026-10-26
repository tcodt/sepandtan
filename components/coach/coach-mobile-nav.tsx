/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Inbox,
  Users,
  MoreHorizontal,
  Plus,
  FileText,
  UserRound,
  Settings,
  LogOut,
  X,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/lib/types/plan";
import { LogoutDialog } from "@/components/common/logout-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ------------------------------ config ------------------------------ */

const HIDDEN_ROUTES = ["/coach/plans/new"];

const mobileLeftTabs = [
  { href: "/coach", label: "داشبورد", icon: LayoutDashboard },
  { href: "/coach/requests", label: "درخواست‌ها", icon: Inbox },
] as const;

const mobileRightTabs = [
  { href: "/coach/clients", label: "هنرجویان", icon: Users },
] as const;

const secondaryNavItems = [
  { href: "/", label: "خانه", icon: LayoutDashboard },
  { href: "/coach/plans", label: "برنامه‌ها", icon: FileText },
  { href: "/coach/financial", label: "مالی", icon: Wallet },
  { href: "/account", label: "حساب کاربری", icon: UserRound },
  { href: "/settings", label: "تنظیمات", icon: Settings },
] as const;

const CENTER_ACTION = {
  href: "/coach/plans/new",
  label: "برنامه جدید",
  icon: Plus,
} as const;

const EXACT_MATCH_ROUTES = new Set<string>(["/", "/coach"]);

function isNavActive(pathname: string, href: string) {
  const normalized = (pathname || "/").replace(/\/+$/, "") || "/";
  const base = href.replace(/\/+$/, "");
  if (EXACT_MATCH_ROUTES.has(href)) return normalized === base;
  return normalized === base || normalized.startsWith(`${base}/`);
}

type NavItem = { href: string; label: string; icon: React.ElementType };

/* ------------------------------ main ------------------------------ */

export function CoachMobileNav({ user }: { user: UserProfile }) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);
  const lastScrollY = useRef(0);
  const hidden = HIDDEN_ROUTES.some((r) => pathname.startsWith(r));

  const initials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("") ?? "م";

  const isSecondaryActive = secondaryNavItems.some((i) =>
    isNavActive(pathname, i.href),
  );

  /* ---- scroll visibility ---- */

  const evaluate = useCallback(() => {
    if (typeof window === "undefined") return;

    const scrollingEl =
      document.scrollingElement ?? document.documentElement ?? document.body;
    const scrollHeight = Math.max(
      scrollingEl.scrollHeight,
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
    );
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;
    const scrollY = window.scrollY ?? window.pageYOffset ?? 0;

    const hasScroll = scrollHeight > viewportHeight + 50;
    if (!hasScroll) {
      setIsVisible(true);
      lastScrollY.current = scrollY;
      return;
    }

    const isNearBottom = scrollHeight - (scrollY + viewportHeight) < 300;
    if (scrollY > lastScrollY.current || isNearBottom) {
      setIsVisible(false);
    } else if (scrollY < lastScrollY.current && !isNearBottom) {
      setIsVisible(true);
    }
    lastScrollY.current = scrollY;
  }, []);

  useEffect(() => {
    evaluate();
    window.addEventListener("scroll", evaluate, { passive: true });
    window.addEventListener("resize", evaluate, { passive: true });
    return () => {
      window.removeEventListener("scroll", evaluate);
      window.removeEventListener("resize", evaluate);
    };
  }, [evaluate]);

  // Re-evaluate when content size changes (list loads, filter applies).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => evaluate());
    ro.observe(document.body);
    ro.observe(document.documentElement);
    if (document.scrollingElement) ro.observe(document.scrollingElement);
    return () => ro.disconnect();
  }, [evaluate]);

  // Reset state on route change.
  useEffect(() => {
    setMoreOpen(false);
    setIsVisible(true);
    lastScrollY.current = 0;
    const id = requestAnimationFrame(() => evaluate());
    return () => cancelAnimationFrame(id);
  }, [pathname, evaluate]);

  // Lock body scroll while sheet is open.
  useEffect(() => {
    if (!moreOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [moreOpen]);

  // Escape closes the sheet.
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  if (hidden) return null;

  const CenterIcon = CENTER_ACTION.icon;

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className={cn(
          "fixed bottom-4 left-1/2 z-90 w-[98%] max-w-lg -translate-x-1/2 md:hidden",
          "motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-in-out",
          isVisible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-32 opacity-0",
        )}
      >
        <div className="relative h-16 rounded-full border border-border bg-popover/80 shadow-lg backdrop-blur-md">
          {/* Center CTA */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={CENTER_ACTION.href}
                aria-label={CENTER_ACTION.label}
                className={cn(
                  "absolute -top-6 left-1/2 z-20 -translate-x-1/2",
                  "flex size-14 items-center justify-center rounded-full",
                  "bg-primary text-primary-foreground shadow-lg",
                  "ring-4 ring-background/60 transition-transform hover:scale-105 active:scale-95",
                  isNavActive(pathname, CENTER_ACTION.href) &&
                    "ring-primary/40",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                )}
              >
                <CenterIcon size={26} />
                <span className="sr-only">{CENTER_ACTION.label}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top">{CENTER_ACTION.label}</TooltipContent>
          </Tooltip>

          <div className="grid h-full grid-cols-5">
            {mobileLeftTabs.map((item) => (
              <MobileTab
                key={item.href}
                item={item}
                active={isNavActive(pathname, item.href)}
              />
            ))}

            <div aria-hidden className="pointer-events-none" />

            {mobileRightTabs.map((item) => (
              <MobileTab
                key={item.href}
                item={item}
                active={isNavActive(pathname, item.href)}
              />
            ))}

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setMoreOpen(true)}
                  aria-label="بیشتر"
                  aria-haspopup="dialog"
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-0.5 transition-colors",
                    isSecondaryActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="relative">
                    <MoreHorizontal
                      size={22}
                      strokeWidth={isSecondaryActive ? 2.4 : 2}
                      className={cn(
                        "motion-safe:transition-transform",
                        isSecondaryActive && "scale-110",
                      )}
                    />
                    {isSecondaryActive && (
                      <span className="absolute -right-1 -top-1 size-1.5 rounded-full bg-primary" />
                    )}
                  </span>
                  <span className="sr-only">بیشتر</span>
                  {isSecondaryActive && (
                    <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-primary" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">بیشتر</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* More Sheet */}
      {moreOpen && (
        <MoreSheet
          user={user}
          initials={initials}
          pathname={pathname}
          onClose={() => setMoreOpen(false)}
        />
      )}
    </TooltipProvider>
  );
}

/* ------------------------------ subcomponents ------------------------------ */

function MobileTab({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "relative flex flex-col items-center justify-center gap-0.5 transition-colors",
            active
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon
            size={22}
            strokeWidth={active ? 2.4 : 2}
            className={cn(
              "motion-safe:transition-transform",
              active && "scale-110",
            )}
          />
          <span className="sr-only">{item.label}</span>
          {active && (
            <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-primary" />
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="top">{item.label}</TooltipContent>
    </Tooltip>
  );
}

function MoreSheet({
  user,
  initials,
  pathname,
  onClose,
}: {
  user: UserProfile;
  initials: string;
  pathname: string;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="گزینه‌های بیشتر"
      className="fixed inset-0 z-50 md:hidden"
    >
      <button
        type="button"
        aria-label="بستن"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm dark:bg-black/60"
      />
      <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border border-border bg-card pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl">
        <div className="flex justify-center pt-3">
          <span className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-10 shrink-0 border border-border">
              {user.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt={user.name} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-xs text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="text-[11px] text-muted-foreground">مربی</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" />
          </button>
        </div>

        <Separator className="bg-border" />

        <nav className="space-y-1 p-3">
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm transition-colors",
                  active
                    ? "bg-primary/10 font-medium text-primary ring-1 ring-inset ring-primary/30 dark:bg-primary/15 dark:ring-primary/20"
                    : "text-foreground hover:bg-accent",
                )}
              >
                <Icon className="size-4.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}

          <LogoutDialog>
            <button
              type="button"
              onClick={onClose}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-destructive/15"
            >
              <LogOut className="size-4.5 shrink-0" />
              <span className="truncate">خروج</span>
            </button>
          </LogoutDialog>
        </nav>
      </div>
    </div>
  );
}
