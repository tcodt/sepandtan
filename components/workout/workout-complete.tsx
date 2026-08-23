"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Apple, Scale, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  completedCount: number;
  totalCount: number;
  durationMinutes?: number;
  dayNumber?: number;
  onClose?: () => void;
};

export function WorkoutComplete({
  completedCount,
  totalCount,
  durationMinutes,
  dayNumber,
  onClose,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="w-full max-w-md"
      >
        <Card className="border-border bg-card shadow-xl overflow-hidden">
          <CardContent className="p-6 sm:p-8 text-center space-y-5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
              className="mx-auto w-16 h-16 rounded-full bg-primary/15 text-primary flex items-center justify-center"
            >
              <CheckCircle2 className="w-8 h-8" />
            </motion.div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                آفرین! تمرین تمام شد
              </h2>
              <p className="text-sm text-muted-foreground">
                {dayNumber ? `روز ${dayNumber.toLocaleString("fa-IR")} · ` : ""}
                {completedCount.toLocaleString("fa-IR")} از{" "}
                {totalCount.toLocaleString("fa-IR")} حرکت انجام شد
                {durationMinutes
                  ? ` · حدود ${durationMinutes.toLocaleString("fa-IR")} دقیقه`
                  : ""}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              <Button asChild className="h-11">
                <Link href="/nutrition">
                  <Apple className="w-4 h-4 ml-1" />
                  برو سراغ رژیم امروز
                </Link>
              </Button>

              <Button asChild variant="outline" className="h-11">
                <Link href="/dashboard#weight">
                  <Scale className="w-4 h-4 ml-1" />
                  ثبت وزن
                </Link>
              </Button>

              <Button
                asChild
                variant="ghost"
                className="h-11"
                onClick={onClose}
              >
                <Link href="/dashboard">
                  <LayoutDashboard className="w-4 h-4 ml-1" />
                  بازگشت به داشبورد
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
