"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Flame, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type WorkoutCompleteProps = {
  completedCount: number;
  onReset: () => void;
};

export function WorkoutComplete({
  completedCount,
  onReset,
}: WorkoutCompleteProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6 p-6"
    >
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-primary" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          آفرین! تمرین تموم شد
        </h2>
        <p className="text-muted-foreground">
          امروز {completedCount} حرکت را کامل کردی
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Button asChild className="flex-1 gap-2">
          <Link href="/dashboard">
            <Home className="w-4 h-4" />
            برو به داشبورد
          </Link>
        </Button>
        <Button variant="outline" className="flex-1 gap-2" onClick={onReset}>
          <Flame className="w-4 h-4" />
          تمرین دوباره
        </Button>
      </div>
    </motion.div>
  );
}
