"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";

export function GeneratingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6 max-w-sm"
      >
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <Flame className="absolute inset-0 m-auto w-8 h-8 text-primary" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">
            در حال ساخت برنامه شخصی‌ات...
          </h2>
          <p className="text-sm text-muted-foreground">
            هوش مصنوعی سپندتن داره برات بهترین برنامه رو طراحی می‌کنه
          </p>
        </div>
      </motion.div>
    </div>
  );
}
