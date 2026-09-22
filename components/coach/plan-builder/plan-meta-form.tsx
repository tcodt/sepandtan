"use client";

import { useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Wallet, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Goal, Equipment } from "@/lib/types/plan";

type Props = {
  title: string;
  goal: Goal;
  equipment: Equipment;
  level: "beginner" | "intermediate" | "advanced";
  durationWeeks: 4 | 6 | 8;
  priceToman: number | null;
  onChange: {
    setTitle: (v: string) => void;
    setGoal: (v: Goal) => void;
    setEquipment: (v: Equipment) => void;
    setLevel: (v: "beginner" | "intermediate" | "advanced") => void;
    setDurationWeeks: (v: 4 | 6 | 8) => void;
    setPriceToman: (v: number | null) => void;
  };
  onContinue: () => void;
};

/** Shared input/select surface — mode-aware. */
const FIELD_CLASS = cn(
  "h-11 transition-colors",
  // LIGHT: card surface, visible border, hover/focus warmth
  "bg-card border-border",
  "hover:border-foreground/20",
  "focus-visible:border-primary/50 focus-visible:ring-primary/20",
  // DARK: translucent glass
  "dark:bg-white/[0.03] dark:border-white/10",
  "dark:hover:border-white/20",
  "dark:focus-visible:border-primary/60 dark:focus-visible:ring-primary/20",
);

export function PlanMetaForm({
  title,
  goal,
  equipment,
  level,
  durationWeeks,
  priceToman,
  onChange,
  onContinue,
}: Props) {
  const titleId = useId();
  const priceId = useId();

  const hasTitle = title.trim().length > 0;
  const hasPrice = (priceToman ?? 0) > 0;
  const canContinue = hasTitle && hasPrice;

  const priceLabel =
    priceToman && priceToman > 0
      ? `${priceToman.toLocaleString("fa-IR")} تومان`
      : null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canContinue) onContinue();
      }}
      className="max-w-xl mx-auto space-y-6 px-1"
    >
      {/* ============ Hero header ============ */}
      <div className="text-center space-y-3 pt-2">
        <motion.div
          initial={{ scale: 0.85, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="relative mx-auto w-14 h-14"
        >
          {/* Pulsing halo — works in both modes */}
          <motion.span
            aria-hidden
            animate={{ opacity: [0.35, 0.75, 0.35], scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-2xl bg-primary/30 blur-lg"
          />
          <div
            className={cn(
              "relative w-14 h-14 rounded-2xl flex items-center justify-center",
              // LIGHT: warmer, deeper tint so it pops on white
              "bg-primary/15 ring-1 ring-primary/30",
              // DARK: original
              "dark:bg-primary/15 dark:ring-primary/20",
            )}
          >
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="space-y-1.5"
        >
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            ساخت برنامه جدید
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            مشخصات و قیمت را تنظیم کن؛ بعد الگوی هفتگی را می‌سازی
          </p>
        </motion.div>

        {/* Stepper */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex items-center justify-center gap-2"
        >
          <Badge className="bg-primary text-primary-foreground border-0 gap-1 pr-1.5 shadow-sm shadow-primary/25 dark:shadow-none">
            <Check className="w-3 h-3" />۱ · مشخصات
          </Badge>
          <span className="text-muted-foreground text-xs">→</span>
          <Badge
            variant="outline"
            className={cn(
              "text-muted-foreground",
              "bg-card border-border",
              "dark:bg-transparent dark:border-white/10",
            )}
          >
            ۲ · هفته
          </Badge>
        </motion.div>
      </div>

      {/* ============ Form card ============ */}
      <Card
        className={cn(
          "rounded-2xl overflow-hidden",
          // LIGHT: real card surface + soft elevation
          "bg-card border-border shadow-sm shadow-foreground/4",
          // DARK: glass
          "dark:bg-white/5 dark:border-white/10 dark:backdrop-blur-md dark:shadow-none",
        )}
      >
        <CardContent className="p-5 space-y-5">
          {/* ---- Title ---- */}
          <div className="space-y-2">
            <Label htmlFor={titleId} className="text-foreground">
              نام برنامه
            </Label>
            <Input
              id={titleId}
              value={title}
              onChange={(e) => onChange.setTitle(e.target.value)}
              placeholder="مثلاً: فول‌بادی چربی‌سوزی ۸ هفته"
              className={FIELD_CLASS}
              autoFocus
            />
            <AnimatePresence>
              {!hasTitle && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-muted-foreground"
                >
                  یک نام کوتاه و واضح انتخاب کن — هنرجو همین را می‌بیند.
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* ---- Price ---- */}
          <div className="space-y-2">
            <Label
              htmlFor={priceId}
              className="flex items-center gap-1.5 text-foreground"
            >
              <Wallet className="w-3.5 h-3.5 text-primary" />
              قیمت برنامه (تومان)
            </Label>
            <div className="relative">
              {/* Currency suffix — visible inside field */}
              <span
                className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium pointer-events-none",
                  "text-muted-foreground",
                )}
                aria-hidden
              >
                تومان
              </span>
              <Input
                id={priceId}
                type="number"
                min={0}
                inputMode="numeric"
                value={priceToman ?? ""}
                onChange={(e) =>
                  onChange.setPriceToman(
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
                placeholder="1500000"
                dir="ltr"
                className={cn(
                  FIELD_CLASS,
                  "pl-14 text-left",
                  // Kill spinner arrows for a cleaner look
                  "[appearance:textfield]",
                  "[&::-webkit-outer-spin-button]:appearance-none",
                  "[&::-webkit-inner-spin-button]:appearance-none",
                )}
              />
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={priceLabel ?? "empty"}
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 2 }}
                transition={{ duration: 0.18 }}
                className={cn(
                  "text-xs",
                  hasPrice
                    ? "text-emerald-600 dark:text-emerald-400 font-medium"
                    : "text-muted-foreground",
                )}
              >
                {priceLabel
                  ? `نمایش به هنرجو: ${priceLabel}`
                  : "این قیمت هنگام اختصاص برنامه به هنرجو نمایش داده می‌شود"}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* ---- Selects grid ---- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">هدف</Label>
              <Select
                value={goal}
                onValueChange={(v) => onChange.setGoal(v as Goal)}
              >
                <SelectTrigger className={FIELD_CLASS}>
                  <SelectValue placeholder="انتخاب هدف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lose_weight">کاهش وزن</SelectItem>
                  <SelectItem value="build_muscle">عضله‌سازی</SelectItem>
                  <SelectItem value="maintain">حفظ تناسب</SelectItem>
                  <SelectItem value="endurance">استقامت</SelectItem>
                  <SelectItem value="general_fitness">آمادگی عمومی</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">سطح</Label>
              <Select
                value={level}
                onValueChange={(v) =>
                  onChange.setLevel(
                    v as "beginner" | "intermediate" | "advanced",
                  )
                }
              >
                <SelectTrigger className={FIELD_CLASS}>
                  <SelectValue placeholder="انتخاب سطح" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">مبتدی</SelectItem>
                  <SelectItem value="intermediate">متوسط</SelectItem>
                  <SelectItem value="advanced">پیشرفته</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">تجهیزات</Label>
              <Select
                value={equipment}
                onValueChange={(v) => onChange.setEquipment(v as Equipment)}
              >
                <SelectTrigger className={FIELD_CLASS}>
                  <SelectValue placeholder="تجهیزات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">خانگی</SelectItem>
                  <SelectItem value="gym">باشگاه</SelectItem>
                  <SelectItem value="both">هر دو</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">مدت برنامه</Label>
              <Select
                value={String(durationWeeks)}
                onValueChange={(v) =>
                  onChange.setDurationWeeks(Number(v) as 4 | 6 | 8)
                }
              >
                <SelectTrigger className={FIELD_CLASS}>
                  <SelectValue placeholder="مدت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">۴ هفته</SelectItem>
                  <SelectItem value="6">۶ هفته</SelectItem>
                  <SelectItem value="8">۸ هفته</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============ CTA ============ */}
      <div className="space-y-2">
        <motion.div
          whileHover={canContinue ? { y: -2 } : undefined}
          whileTap={canContinue ? { scale: 0.98 } : undefined}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
        >
          <Button
            type="submit"
            className={cn(
              "w-full h-12 text-base font-semibold",
              // LIGHT: warm shadow under orange
              "shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/25",
              // DARK: glow
              "dark:shadow-none dark:hover:shadow-lg dark:hover:shadow-primary/30",
            )}
            size="lg"
            disabled={!canContinue}
          >
            شروع ساخت هفته
          </Button>
        </motion.div>

        <AnimatePresence>
          {!canContinue && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-center text-xs text-muted-foreground"
            >
              برای ادامه،{" "}
              {!hasTitle && !hasPrice
                ? "نام و قیمت برنامه"
                : !hasTitle
                  ? "نام برنامه"
                  : "قیمت برنامه"}{" "}
              لازم است
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}
