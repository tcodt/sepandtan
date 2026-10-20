"use client";

import { Copy, Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type Props = {
  onApply: () => void | Promise<void>;
  disabled?: boolean;
  durationWeeks: number;
};

export function ApplyWeekButton({ onApply, disabled, durationWeeks }: Props) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <motion.div
          whileHover={disabled ? undefined : { y: -2 }}
          whileTap={disabled ? undefined : { scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="inline-block"
        >
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className={cn(
              "group relative gap-1.5 h-9 overflow-hidden",
              // LIGHT: real card surface + visible border
              "bg-card border-border text-foreground",
              "hover:border-primary/50 hover:text-primary hover:bg-primary/5",
              "shadow-sm hover:shadow-md hover:shadow-primary/15",
              // DARK: translucent glass + glow on hover
              "dark:bg-white/2 dark:border-white/15 dark:text-foreground",
              "dark:hover:border-primary/40 dark:hover:bg-white/6",
              "dark:shadow-none dark:hover:shadow-md dark:hover:shadow-primary/10",
              "transition-colors duration-300",
            )}
          >
            <motion.span
              className="inline-flex"
              whileHover={{ rotate: -10, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
            >
              <Copy className="w-4 h-4" />
            </motion.span>
            <span className="hidden sm:inline">اعمال روی کل برنامه</span>
            <span className="sm:hidden">اعمال هفته</span>

            {/* Shine sweep — dark streak in light, white streak in dark */}
            <motion.span
              aria-hidden
              initial={{ x: "-120%" }}
              whileHover={{ x: "120%" }}
              transition={{ duration: 0.9, ease: "easeInOut" }}
              className={cn(
                "pointer-events-none absolute inset-0",
                "bg-linear-to-tr from-transparent to-transparent",
                // LIGHT: subtle dark shine
                "via-foreground/6",
                // DARK: subtle white shine
                "dark:via-white/10",
              )}
            />
          </Button>
        </motion.div>
      </AlertDialogTrigger>

      {/* ============ Dialog ============ */}
      <AlertDialogContent
        className={cn(
          "rounded-2xl max-w-sm overflow-hidden",
          // LIGHT: real card + soft warm shadow
          "bg-card border-border shadow-xl shadow-foreground/8",
          // DARK: glass + deep black shadow
          "dark:bg-background/95 dark:border-white/10 dark:backdrop-blur-xl dark:shadow-2xl dark:shadow-black/40",
        )}
      >
        {/* Decorative top gradient */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-transparent via-primary to-transparent"
        />

        <AlertDialogHeader className="text-right space-y-3 pt-2">
          {/* Icon badge */}
          <div className="flex justify-end">
            <div className="relative">
              <motion.div
                aria-hidden
                animate={{
                  opacity: [0.35, 0.7, 0.35],
                  scale: [1, 1.08, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 rounded-2xl bg-primary/25 blur-lg"
              />
              <motion.div
                initial={{ scale: 0.8, opacity: 0, rotate: -8 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  delay: 0.05,
                }}
                className={cn(
                  "relative flex items-center justify-center w-11 h-11 rounded-2xl",
                  "bg-linear-to-br from-primary/25 to-primary/5",
                  // LIGHT: stronger ring so it pops on white
                  "border border-primary/35",
                  // DARK
                  "dark:border-primary/30",
                )}
              >
                <Copy className="w-5 h-5 text-primary" />
              </motion.div>
            </div>
          </div>

          <AlertDialogTitle asChild>
            <motion.h2
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="text-lg font-bold text-right text-foreground"
            >
              اعمال الگوی هفته؟
            </motion.h2>
          </AlertDialogTitle>

          <AlertDialogDescription asChild>
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="text-right leading-relaxed text-sm text-muted-foreground"
            >
              همین ۷ روز روی تمام{" "}
              <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                {durationWeeks.toLocaleString("fa-IR")} هفته
              </span>{" "}
              برنامه تکرار و ذخیره می‌شود.
            </motion.p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-row-reverse gap-2 mt-2">
          <AlertDialogCancel
            className={cn(
              "flex-1 sm:flex-none rounded-xl h-10",
              // LIGHT: card surface + visible border
              "bg-card border-border text-foreground",
              "hover:bg-muted/70 hover:border-foreground/20",
              // DARK: transparent glass
              "dark:bg-transparent dark:border-white/15",
              "dark:hover:bg-white/5 dark:hover:border-white/25",
              "transition-colors",
            )}
          >
            انصراف
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={() => {
              void onApply();
            }}
            className={cn(
              "group flex-1 sm:flex-none rounded-xl h-10 gap-1.5",
              "inline-flex items-center justify-center px-4",
              "bg-primary text-primary-foreground text-sm font-medium",
              // LIGHT: warm shadow under orange (not a glow)
              "shadow-sm shadow-primary/25",
              "hover:bg-primary/90 hover:shadow-md hover:shadow-primary/30",
              // DARK: flat → glow on hover
              "dark:shadow-none dark:hover:shadow-lg dark:hover:shadow-primary/30",
              "transition-colors",
            )}
          >
            <Check className="w-4 h-4" />
            اعمال کن
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
