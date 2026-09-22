import { cn } from "@/lib/utils";

export const FIELD_CLASS = cn(
  "transition-colors",
  "bg-card border-border",
  "hover:border-foreground/20",
  "focus-visible:border-primary/50 focus-visible:ring-primary/20",
  "dark:bg-white/[0.03] dark:border-white/10",
  "dark:hover:border-white/20",
  "dark:focus-visible:border-primary/60 dark:focus-visible:ring-primary/20",
);

export const NUMBER_CLASS = cn(
  "[appearance:textfield]",
  "[&::-webkit-outer-spin-button]:appearance-none",
  "[&::-webkit-inner-spin-button]:appearance-none",
);

export const SMOOTH_SCROLL = cn(
  "overflow-y-auto overscroll-contain scroll-smooth",
  "[-webkit-overflow-scrolling:touch]",
  "[scrollbar-width:none]",
  "[&::-webkit-scrollbar]:hidden",
  "[&::-webkit-scrollbar]:w-0",
  "[&::-webkit-scrollbar]:h-0",
  "[&::-webkit-scrollbar-thumb]:bg-transparent",
  "[&::-webkit-scrollbar-track]:bg-transparent",
);

/** Card on bg-muted context. */
export const CARD_CLASS = cn(
  "rounded-2xl overflow-hidden",
  "bg-card border-border shadow-sm shadow-foreground/[0.04]",
  "dark:bg-white/5 dark:border-white/10 dark:shadow-none",
);

/** Card on bg-background (page) context. */
export const SURFACE_CLASS = cn(
  "rounded-2xl overflow-hidden",
  "bg-card border-border shadow-sm shadow-foreground/[0.04]",
  "dark:bg-card/60 dark:border-white/10 dark:backdrop-blur-md dark:shadow-none",
);

export const PRIMARY_SHADOW = cn(
  "shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25",
  "dark:shadow-none dark:hover:shadow-lg dark:hover:shadow-primary/30",
);

export const DIALOG_SURFACE = cn(
  "bg-card border-border shadow-xl shadow-foreground/[0.08]",
  "dark:bg-background/95 dark:border-white/10 dark:backdrop-blur-xl",
  "dark:shadow-2xl dark:shadow-black/40",
);

export const OUTLINE_BUTTON = cn(
  "bg-card border-border hover:bg-accent hover:border-foreground/20",
  "dark:bg-transparent dark:border-white/15 dark:hover:bg-white/5 dark:hover:border-white/25",
);
