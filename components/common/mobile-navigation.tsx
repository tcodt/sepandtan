"use client";

import Link from "next/link";
import {
  LayoutDashboardIcon,
  BotIcon,
  StoreIcon,
  DumbbellIcon,
  SearchIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useState, useRef, useCallback } from "react";

const items = [
  {
    id: "dashboard",
    icon: LayoutDashboardIcon,
    label: "داشبورد",
    href: "/dashboard",
  },
  { id: "explore", icon: SearchIcon, label: "اکسپلور", href: "/explore" },
  { id: "ai", icon: BotIcon, label: "هوش مصنوعی", center: true, href: "/ai" },
  { id: "store", icon: StoreIcon, label: "فروشگاه", href: "/store" },
  { id: "workouts", icon: DumbbellIcon, label: "حرکات", href: "/workouts" },
];

export default function MobileNavigation() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const navRef = useRef<HTMLDivElement>(null);

  const controlNavbar = useCallback(() => {
    if (typeof window !== "undefined") {
      const currentScrollY = window.scrollY;

      // Calculate how close we are to the bottom
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollPosition = window.scrollY + windowHeight;

      // If we're within 300px of the bottom (footer area), hide the nav
      const isNearBottom = documentHeight - scrollPosition < 300;

      // If scrolling down OR near bottom, hide navbar
      if (currentScrollY > lastScrollY || isNearBottom) {
        setIsVisible(false);
      }
      // If scrolling up AND not near bottom, show navbar
      else if (currentScrollY < lastScrollY && !isNearBottom) {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    }
  }, [lastScrollY]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("scroll", controlNavbar, { passive: true });

      return () => {
        window.removeEventListener("scroll", controlNavbar);
      };
    }
  }, [controlNavbar]);

  // Also hide nav on page load if user is at bottom
  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkInitialPosition = () => {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollPosition = window.scrollY + windowHeight;

        const isAtBottom = documentHeight - scrollPosition < 400;
        if (isAtBottom) {
          setIsVisible(false);
        }
      };

      // Check after a short delay to ensure DOM is fully loaded
      setTimeout(checkInitialPosition, 100);
    }
  }, []);

  return (
    <TooltipProvider delayDuration={150}>
      <div
        ref={navRef}
        className={`fixed bottom-4 left-1/2 z-50 w-[98%] max-w-lg -translate-x-1/2 md:hidden transition-all duration-300 ease-in-out ${
          isVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-32 opacity-0 pointer-events-none"
        }`}
      >
        <div className="relative h-16 bg-popover/60 backdrop-blur-xs border border-default rounded-full shadow-lg">
          {/* Floating center button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/ai"
                id="nav-ai"
                className="absolute -top-6 left-1/2 -translate-x-1/2 z-10
                           flex h-14 w-14 items-center justify-center
                           rounded-full bg-primary text-primary-foreground
                           shadow-lg ring-4 ring-popover/40"
              >
                <BotIcon size={28} />
                <span className="sr-only">هوش مصنوعی</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top">هوش مصنوعی</TooltipContent>
          </Tooltip>

          {/* Normal nav items */}
          <div className="grid h-full grid-cols-5">
            {items.map((item) => {
              if (item.center) {
                // Empty slot to keep spacing
                return <div key={item.id} />;
              }

              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      id={`nav-${item.id}`}
                      className="flex flex-col items-center justify-center hover:bg-neutral-secondary-medium transition"
                    >
                      <item.icon size={24} />
                      <span className="sr-only">{item.label}</span>
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
