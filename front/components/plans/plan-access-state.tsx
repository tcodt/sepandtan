"use client";

import Link from "next/link";
import { Sparkles, Lock, MessageCircle, Hourglass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Variant = "no-plan" | "free-expired" | "feature-locked" | "chat-limit";

type Props = {
  variant: Variant;
  requiredTierLabel?: string; // مثلاً «حرفه‌ای»
  className?: string;
};

const CONFIG: Record<
  Variant,
  {
    icon: React.ElementType;
    title: string;
    description: (required?: string) => string;
    primaryLabel: string;
    primaryHref: string;
  }
> = {
  "no-plan": {
    icon: Sparkles,
    title: "هنوز برنامه‌ای نداری",
    description: () =>
      "اول یک برنامه بساز تا بتونی تمرین و تغذیه امروز رو ببینی.",
    primaryLabel: "ساخت برنامه",
    primaryHref: "/onboarding",
  },
  "free-expired": {
    icon: Hourglass,
    title: "دوره آزمایشی تموم شده",
    description: () =>
      "برای ادامه دسترسی به تمرین و تغذیه امروز، اشتراکت رو ارتقا بده.",
    primaryLabel: "مشاهده طرح‌های اشتراک",
    primaryHref: "/#plans",
  },
  "feature-locked": {
    icon: Lock,
    title: "این قابلیت در اشتراک فعلی در دسترس نیست",
    description: (required) =>
      required
        ? `با ارتقا به ${required} می‌تونی از این بخش استفاده کنی.`
        : "با ارتقا اشتراک می‌تونی از این بخش استفاده کنی.",
    primaryLabel: "ارتقا اشتراک",
    primaryHref: "/#plans",
  },
  "chat-limit": {
    icon: MessageCircle,
    title: "به سقف پیام‌های رایگان رسیدی",
    description: () => "در طرح رایگان روزانه ۵ پیام داری.",
    primaryLabel: "ارتقا اشتراک",
    primaryHref: "/#plans",
  },
};

export function PlanAccessState({
  variant,
  requiredTierLabel,
  className,
}: Props) {
  const cfg = CONFIG[variant];
  const Icon = cfg.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-4 py-10 min-h-[40vh]",
        className,
      )}
      role="status"
    >
      <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
        <Icon className="w-7 h-7" aria-hidden />
      </div>
      <h2 className="text-base sm:text-lg font-bold text-foreground mb-2">
        {cfg.title}
      </h2>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-6">
        {cfg.description(requiredTierLabel)}
      </p>
      <Button asChild size="lg" className="w-full max-w-xs h-12 font-semibold">
        <Link href={cfg.primaryHref}>{cfg.primaryLabel}</Link>
      </Button>
    </div>
  );
}
