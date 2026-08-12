"use client";

import { Progress } from "@/components/ui/progress";

type ProgressHeaderProps = {
  currentStep: number;
  totalSteps?: number;
};

export function ProgressHeader({
  currentStep,
  totalSteps = 3,
}: ProgressHeaderProps) {
  const value = (currentStep / totalSteps) * 100;

  return (
    <header className="border-b border-border px-4 sm:px-6 py-4">
      <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-muted-foreground shrink-0">
          مرحله {currentStep} از {totalSteps}
        </span>
        <div className="w-full max-w-40 sm:max-w-50">
          <Progress value={value} className="h-1.5" />
        </div>
      </div>
    </header>
  );
}
