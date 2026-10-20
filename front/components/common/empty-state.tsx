"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
  animated?: boolean;
  animationDelay?: number;
};

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
  animated = true,
  animationDelay = 0,
}: Props) {
  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center gap-3 py-10 px-4",
        className,
      )}
    >
      {icon ? (
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          {icon}
        </div>
      ) : null}

      <div className="space-y-1 max-w-sm">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>

      {actionLabel && actionHref ? (
        <Button asChild className="mt-1">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}

      {actionLabel && onAction && !actionHref ? (
        <Button className="mt-1" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );

  if (!animated) {
    return content;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay, duration: 0.3 }}
    >
      {content}
    </motion.div>
  );
}
