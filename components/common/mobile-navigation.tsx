"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  BotIcon,
  StoreIcon,
  DumbbellIcon,
  User2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

const items = [
  {
    id: "dashboard",
    icon: LayoutDashboardIcon,
    label: "داشبورد",
    href: "/dashboard",
  },
  {
    id: "workouts",
    icon: DumbbellIcon,
    label: "تمرین",
    href: "/workouts",
  },
  {
    id: "ai",
    icon: BotIcon,
    label: "هوش مصنوعی",
    center: true,
    href: "/ai",
  },
  {
    id: "store",
    icon: StoreIcon,
    label: "فروشگاه",
    href: "/store",
  },
  {
    id: "account",
    icon: User2,
    label: "حساب",
    href: "/account",
  },
];

export default function MobileNavigation() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const navRef = useRef<HTMLDivElement>(null);

  const controlNavbar = useCallback(() => {
    if (typeof window === "undefined") return;

    const currentScrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollPosition = window.scrollY + windowHeight;
    const isNearBottom = documentHeight - scrollPosition < 300;

    if (currentScrollY > lastScrollY || isNearBottom) {
      setIsVisible(false);
    } else if (currentScrollY < lastScrollY && !isNearBottom) {
      setIsVisible(true);
    }

    setLastScrollY(currentScrollY);
  }, [lastScrollY]);

  useEffect(() => {
    window.addEventListener("scroll", controlNavbar, { passive: true });
    return () => window.removeEventListener("scroll", controlNavbar);
  }, [controlNavbar]);

  useEffect(() => {
    const checkInitialPosition = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollPosition = window.scrollY + windowHeight;
      const isAtBottom = documentHeight - scrollPosition < 400;
      if (isAtBottom) setIsVisible(false);
    };

    const timer = setTimeout(checkInitialPosition, 100);
    return () => clearTimeout(timer);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div
        ref={navRef}
        className={cn(
          "fixed bottom-4 left-1/2 z-50 w-[98%] max-w-lg -translate-x-1/2 md:hidden",
          "transition-all duration-300 ease-in-out",
          isVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-32 opacity-0 pointer-events-none",
        )}
      >
        <div className="relative h-16 rounded-full border border-border bg-popover/80 backdrop-blur-md shadow-lg">
          {/* Center floating AI button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/ai"
                className={cn(
                  "absolute -top-6 left-1/2 -translate-x-1/2 z-10",
                  "flex h-14 w-14 items-center justify-center rounded-full",
                  "bg-primary text-primary-foreground shadow-lg",
                  "ring-4 ring-background/60 transition-transform hover:scale-105",
                  isActive("/ai") && "ring-primary/40",
                )}
              >
                <BotIcon size={26} />
                <span className="sr-only">هوش مصنوعی</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top">هوش مصنوعی</TooltipContent>
          </Tooltip>

          {/* Nav items */}
          <div className="grid h-full grid-cols-5">
            {items.map((item) => {
              if (item.center) {
                return <div key={item.id} />;
              }

              const active = isActive(item.href);
              const Icon = item.icon;

              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex flex-col items-center justify-center gap-0.5 transition-colors",
                        active
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Icon
                        size={22}
                        className={cn(active && "scale-110")}
                        strokeWidth={active ? 2.4 : 2}
                      />
                      <span className="sr-only">{item.label}</span>

                      {/* Active indicator */}
                      {active && (
                        <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-primary" />
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="top">{item.label}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
