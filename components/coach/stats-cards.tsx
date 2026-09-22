"use client";

import Link from "next/link";
import { Inbox, Users, FileText, Send } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Stats = {
  pendingRequests: number;
  activeClients: number;
  draftPlans: number;
  publishedPlans: number;
};

type Props = {
  stats: Stats;
  loading?: boolean;
};

/** Each accent comes with a light text + dark text + matching hover border. */
const ACCENTS = {
  amber: {
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10 dark:bg-amber-500/10",
    hover: "hover:border-amber-500/40 dark:hover:border-amber-400/30",
  },
  primary: {
    text: "text-primary",
    bg: "bg-primary/10 dark:bg-primary/10",
    hover: "hover:border-primary/40 dark:hover:border-primary/30",
  },
  sky: {
    text: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/10 dark:bg-sky-500/10",
    hover: "hover:border-sky-500/40 dark:hover:border-sky-400/30",
  },
  emerald: {
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/10",
    hover: "hover:border-emerald-500/40 dark:hover:border-emerald-400/30",
  },
} as const;

export function StatsCards({ stats, loading }: Props) {
  const items = [
    {
      label: "درخواست‌های جدید",
      value: stats.pendingRequests,
      icon: Inbox,
      href: "/coach/requests",
      accent: ACCENTS.amber,
      hint: "نیاز به پاسخ",
    },
    {
      label: "هنرجویان فعال",
      value: stats.activeClients,
      icon: Users,
      href: "/coach/clients",
      accent: ACCENTS.primary,
      hint: "لیست هنرجویان",
    },
    {
      label: "پیش‌نویس",
      value: stats.draftPlans,
      icon: FileText,
      href: "/coach/plans",
      accent: ACCENTS.sky,
      hint: "در حال ساخت",
    },
    {
      label: "منتشرشده",
      value: stats.publishedPlans,
      icon: Send,
      href: "/coach/plans",
      accent: ACCENTS.emerald,
      hint: "آماده اختصاص",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "h-22 rounded-2xl border animate-pulse",
              // LIGHT: visible skeleton on bg-muted
              "bg-card/60 border-border",
              // DARK
              "dark:bg-white/5 dark:border-white/10",
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
            delay: index * 0.04,
          }}
        >
          <Link href={item.href} className="group block">
            <Card
              className={cn(
                "rounded-2xl overflow-hidden transition-all duration-300",
                // LIGHT: real card + soft elevation
                "bg-card border-border shadow-sm shadow-foreground/4",
                "group-hover:shadow-md group-hover:-translate-y-0.5",
                item.accent.hover,
                // DARK: glass
                "dark:bg-card/60 dark:border-white/10 dark:backdrop-blur-md dark:shadow-none",
                "dark:group-hover:bg-white/5",
              )}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center",
                      item.accent.bg,
                      item.accent.text,
                    )}
                  >
                    <item.icon className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
                    {item.value.toLocaleString("fa-IR")}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">
                    {item.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {item.hint}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
