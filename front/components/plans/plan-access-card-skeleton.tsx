"use client";

import { Card, CardContent } from "@/components/ui/card";

export function PlanAccessCardSkeleton() {
  return (
    <Card className="border-border bg-card/60 backdrop-blur-sm">
      <CardContent className="space-y-3.5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted/70" />
          </div>
          <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
        </div>

        <div className="h-3 w-2/3 animate-pulse rounded bg-muted/70" />

        <div className="h-1.5 w-full animate-pulse rounded-full bg-muted" />

        <div className="h-8 w-full animate-pulse rounded-md bg-muted" />
      </CardContent>
    </Card>
  );
}
