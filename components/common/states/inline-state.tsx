"use client";

import Link from "next/link";
import {
  CalendarOff,
  Moon,
  AlertCircle,
  Dumbbell,
  Apple,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StateType = "empty-workout" | "empty-nutrition" | "rest-day" | "error";

type Props = {
  type: StateType;
  onRetry?: () => void;
  className?: string;
};

const CONFIG: Record<
  StateType,
  {
    icon: React.ElementType;
    title: string;
    description: string;
    primaryLabel: string;
    primaryHref?: string;
    secondaryLabel?: string;
    secondaryHref?: string;
    iconClass?: string;
  }
> = {
  "empty-workout": {
    icon: CalendarOff,
    title: "امروز تمرینی برات برنامه‌ریزی نشده",
    description: "ممکنه روز استراحت باشه یا برنامه هنوز کامل نشده.",
    primaryLabel: "مشاهده کتابخانه حرکات",
    primaryHref: "/workouts",
    secondaryLabel: "بازگشت به داشبورد",
    secondaryHref: "/dashboard",
    iconClass: "text-muted-foreground",
  },
  "empty-nutrition": {
    icon: Apple,
    title: "امروز وعده‌ای برات ثبت نشده",
    description: "می‌تونی از بخش تغذیه کلی ایده‌بگیری.",
    primaryLabel: "مشاهده برنامه امروز",
    primaryHref: "/dashboard",
    secondaryLabel: "بازگشت به داشبورد",
    secondaryHref: "/dashboard",
    iconClass: "text-muted-foreground",
  },
  "rest-day": {
    icon: Moon,
    title: "امروز روز ریکاوریته!",
    description:
      "بدنت داره قوی‌تر می‌شه. استراحت فعال هم یه بخش مهم از پیشرفته. ۱۰ دقیقه کشش یا پیاده‌روی سبک پیشنهاد می‌شه.",
    primaryLabel: "مشاهده حرکات سبک و ریکاوری",
    primaryHref: "/workouts",
    secondaryLabel: "بازگشت به داشبورد",
    secondaryHref: "/dashboard",
    iconClass: "text-primary",
  },
  error: {
    icon: AlertCircle,
    title: "یه مشکلی پیش اومد",
    description: "نتونستیم اطلاعات امروز رو بیاریم.",
    primaryLabel: "دوباره تلاش کن",
    secondaryLabel: "بازگشت به داشبورد",
    secondaryHref: "/dashboard",
    iconClass: "text-destructive",
  },
};

export function InlineState({ type, onRetry, className }: Props) {
  const config = CONFIG[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-4 py-12 min-h-[50vh]",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          "w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-5",
          type === "rest-day" && "bg-primary/10",
          type === "error" && "bg-destructive/10",
        )}
      >
        <Icon className={cn("w-8 h-8", config.iconClass)} aria-hidden />
      </div>

      <h2 className="text-lg font-bold text-foreground mb-2">{config.title}</h2>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-6">
        {config.description}
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {type === "error" && onRetry ? (
          <Button
            type="button"
            size="lg"
            className="w-full h-12"
            onClick={onRetry}
            autoFocus
          >
            <RefreshCw className="w-4 h-4" />
            {config.primaryLabel}
          </Button>
        ) : config.primaryHref ? (
          <Button asChild size="lg" className="w-full h-12">
            <Link href={config.primaryHref}>
              {type === "empty-workout" && <Dumbbell className="w-4 h-4" />}
              {type === "empty-nutrition" && <Apple className="w-4 h-4" />}
              {type === "rest-day" && <Dumbbell className="w-4 h-4" />}
              {config.primaryLabel}
            </Link>
          </Button>
        ) : null}

        {config.secondaryHref && (
          <Button asChild variant="ghost" size="lg" className="w-full h-11">
            <Link href={config.secondaryHref}>{config.secondaryLabel}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
