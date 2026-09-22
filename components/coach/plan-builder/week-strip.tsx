"use client";

import { useEffect, useRef, useState } from "react";
import { Moon, Dumbbell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Keyboard, FreeMode } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import "swiper/css";
import { cn } from "@/lib/utils";
import type { PlanDay } from "@/lib/types/plan";

type Props = {
  week?: PlanDay[] | null;
  selectedDay: number;
  onSelect: (dayNumber: number) => void;
};

const DAY_SHORT = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

function ensureWeek(week?: PlanDay[] | null): PlanDay[] {
  if (Array.isArray(week) && week.length === 7) {
    return week.map((d, i) => ({
      ...d,
      dayNumber: d?.dayNumber ?? i + 1,
      title: d?.title ?? `روز ${i + 1}`,
      focus: d?.focus ?? "",
      isRestDay: Boolean(d?.isRestDay),
      estimatedMinutes: d?.estimatedMinutes ?? 0,
      exercises: Array.isArray(d?.exercises) ? d.exercises : [],
      meals: Array.isArray(d?.meals) ? d.meals : [],
    }));
  }

  return Array.from({ length: 7 }, (_, i) => ({
    dayNumber: i + 1,
    title: `روز ${i + 1}`,
    focus: "",
    isRestDay: false,
    estimatedMinutes: 0,
    exercises: [],
    meals: [],
  }));
}

export function WeekStrip({ week, selectedDay, onSelect }: Props) {
  const days = ensureWeek(week);
  const swiperRef = useRef<SwiperClass | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const idx = days.findIndex((d) => d.dayNumber === selectedDay);
    if (idx >= 0 && swiperRef.current) {
      swiperRef.current.slideTo(idx, 300);
    }
  }, [selectedDay, days, isMobile]);

  return (
    <div className="relative w-full" dir="rtl">
      {isMobile ? (
        // ==================== MOBILE — Swiper ====================
        <Swiper
          modules={[A11y, Keyboard, FreeMode]}
          onSwiper={(s) => (swiperRef.current = s)}
          slidesPerView="auto"
          spaceBetween={8}
          freeMode={{
            enabled: true,
            sticky: true,
            momentumBounce: true,
            momentumBounceRatio: 0.4,
          }}
          slideToClickedSlide
          watchSlidesProgress
          keyboard={{ enabled: true, onlyInViewport: true }}
          a11y={{
            containerMessage: "انتخاب روز هفته",
            slideRole: "tab",
          }}
          resistanceRatio={0.65}
          className="py-1! px-1! rounded-2xl"
        >
          {days.map((day, index) => (
            <SwiperSlide key={day.dayNumber} className="w-auto!">
              <DayButton
                day={day}
                index={index}
                active={day.dayNumber === selectedDay}
                onClick={() => onSelect(day.dayNumber)}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        // ==================== DESKTOP — Grid ====================
        <div
          role="tablist"
          aria-label="انتخاب روز هفته"
          className="grid grid-cols-7 gap-2.5"
        >
          {days.map((day, index) => (
            <DayButton
              key={day.dayNumber}
              day={day}
              index={index}
              active={day.dayNumber === selectedDay}
              onClick={() => onSelect(day.dayNumber)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Shared day chip — one implementation, both layouts. */
function DayButton({
  day,
  index,
  active,
  onClick,
}: {
  day: PlanDay;
  index: number;
  active: boolean;
  onClick: () => void;
}) {
  const count = day.exercises?.length ?? 0;
  const isRest = day.isRestDay;
  const isEmpty = !isRest && count === 0;

  return (
    <motion.button
      type="button"
      role="tab"
      aria-selected={active}
      aria-label={`روز ${day.dayNumber.toLocaleString("fa-IR")}${
        isRest ? " - استراحت" : ` - ${count} تمرین`
      }`}
      onClick={onClick}
      initial={false}
      animate={{
        scale: active ? 1.03 : 1,
        y: active ? -2 : 0,
      }}
      whileHover={{ y: -3, scale: active ? 1.03 : 1.015 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={cn(
        "group relative flex flex-col items-center gap-1.5 rounded-2xl px-3 py-3",
        "min-w-18 select-none border",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active
          ? [
              // LIGHT: warm orange card + soft shadow
              "bg-linear-to-b from-primary/15 to-primary/5",
              "border-primary/40 text-primary",
              "shadow-sm shadow-primary/20",
              // DARK: stronger glow + border
              "dark:from-primary/20 dark:to-primary/5",
              "dark:border-primary/50 dark:shadow-lg dark:shadow-primary/25",
            ]
          : [
              // LIGHT: real card surface + visible hover
              "bg-card border-border text-muted-foreground",
              "shadow-sm shadow-foreground/3",
              "hover:bg-card hover:border-foreground/20 hover:text-foreground",
              "hover:shadow-md hover:shadow-foreground/5",
              // DARK: glass
              "dark:bg-white/3 dark:border-white/10",
              "dark:shadow-none",
              "dark:hover:bg-white/[0.07] dark:hover:border-white/20 dark:hover:text-foreground",
            ],
      )}
    >
      {/* Active glow pulse */}
      <AnimatePresence>
        {active && (
          <motion.span
            aria-hidden
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: [0.35, 0.7, 0.35], scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{
              opacity: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
              scale: { duration: 0.3 },
            }}
            className="absolute inset-0 rounded-2xl bg-primary/20 dark:bg-primary/25 blur-xl -z-10"
          />
        )}
      </AnimatePresence>

      <span
        className={cn(
          "text-[10px] font-semibold uppercase tracking-wider transition-colors",
          active ? "text-primary/90" : "opacity-70 group-hover:opacity-100",
        )}
      >
        {DAY_SHORT[index] ?? day.dayNumber}
      </span>

      <motion.span
        animate={{ scale: active ? 1.1 : 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 22 }}
        className={cn(
          "text-base font-bold tabular-nums leading-none",
          active
            ? "text-primary"
            : "text-foreground/80 group-hover:text-foreground",
        )}
      >
        {day.dayNumber.toLocaleString("fa-IR")}
      </motion.span>

      <span
        className={cn(
          "flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full transition-all duration-300",
          isRest
            ? // LIGHT: readable sky
              "text-sky-600 bg-sky-500/10 dark:text-sky-300 dark:bg-sky-500/15"
            : isEmpty
              ? // LIGHT: muted but visible
                "text-muted-foreground bg-muted/70 dark:bg-white/4"
              : active
                ? "text-primary bg-primary/15 dark:bg-primary/20"
                : // LIGHT: readable emerald
                  "text-emerald-600 bg-emerald-500/10 group-hover:bg-emerald-500/15 dark:text-emerald-300 dark:bg-emerald-500/15 dark:group-hover:bg-emerald-500/20",
        )}
      >
        {isRest ? (
          <>
            <Moon className="w-3 h-3" />
            <span>استراحت</span>
          </>
        ) : isEmpty ? (
          <span>خالی</span>
        ) : (
          <>
            <Dumbbell className="w-3 h-3" />
            <span className="tabular-nums">
              {count.toLocaleString("fa-IR")}
            </span>
          </>
        )}
      </span>

      <AnimatePresence>
        {active && (
          <motion.span
            aria-hidden
            layoutId="weekstrip-indicator"
            initial={{ opacity: 0, scaleX: 0.4 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0.4 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute -bottom-px inset-x-4 h-0.75 rounded-full bg-linear-to-r from-transparent via-primary to-transparent"
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}
