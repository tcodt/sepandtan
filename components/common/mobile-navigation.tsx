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

const items = [
  {
    id: "dashboard",
    icon: LayoutDashboardIcon,
    label: "داشبورد",
    href: "/dashboard",
  },
  { id: "explore", icon: SearchIcon, label: "اکسپلور", href: "/explore" },
  { id: "ai", icon: BotIcon, label: "هوش مصنوعی", center: true, href: "/ai" },
  { id: "store", icon: StoreIcon, label: "محصولات", href: "/store" },
  { id: "workouts", icon: DumbbellIcon, label: "حرکات", href: "/workouts" },
];

export default function MobileNavigation() {
  return (
    <TooltipProvider delayDuration={150}>
      <div className="fixed bottom-4 left-1/2 z-50 w-[98%] max-w-lg -translate-x-1/2 md:hidden">
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
