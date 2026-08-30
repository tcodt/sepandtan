"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Pause, Play, SkipForward } from "lucide-react";

type RestTimerProps = {
  seconds: number;
  onComplete: () => void;
  onSkip: () => void;
};

export function RestTimer({ seconds, onComplete, onSkip }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!isRunning || remaining <= 0) {
      if (remaining <= 0) onComplete();
      return;
    }

    const timer = setInterval(() => {
      setRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, remaining, onComplete]);

  const minutes = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="rounded-2xl border border-border bg-muted/50 p-5 text-center space-y-4">
      <p className="text-sm text-muted-foreground">زمان استراحت</p>
      <p className="text-4xl font-bold tabular-nums text-foreground">
        {String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </p>

      <div className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={() => setIsRunning((v) => !v)}
        >
          {isRunning ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="gap-1.5"
          onClick={onSkip}
        >
          رد کردن
          <SkipForward className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
