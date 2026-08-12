"use client";

import Link from "next/link";
import { Play, Bot, Store, Dumbbell, Home, User } from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  {
    href: "/workout/today",
    label: "شروع تمرین امروز",
    description: "اجرای برنامه روزانه",
    icon: Play,
    primary: true,
  },
  {
    href: "/ai",
    label: "مربی هوش مصنوعی",
    description: "چت و راهنمایی",
    icon: Bot,
  },
  {
    href: "/workouts",
    label: "کتابخانه حرکات",
    description: "همه حرکات",
    icon: Dumbbell,
  },
  {
    href: "/store",
    label: "فروشگاه",
    description: "مکمل و تجهیزات",
    icon: Store,
  },
  {
    href: "/",
    label: "صفحه اصلی",
    description: "بازگشت به لندینگ",
    icon: Home,
  },
  {
    href: "/account",
    label: "پروفایل",
    description: "اطلاعات حساب",
    icon: User,
  },
];

export function QuickActions() {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground px-1">
        دسترسی سریع
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                "group flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all",
                "hover:shadow-md hover:-translate-y-0.5",
                action.primary
                  ? "border-primary/40 bg-primary/10 hover:bg-primary/15"
                  : "border-border bg-card/80 dark:bg-card/60 hover:bg-muted/60",
              )}
            >
              <div
                className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center transition-colors",
                  action.primary
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground group-hover:text-foreground",
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p
                  className={cn(
                    "text-sm font-medium",
                    action.primary ? "text-primary" : "text-foreground",
                  )}
                >
                  {action.label}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block">
                  {action.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
