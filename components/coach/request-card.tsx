"use client";

import { useState } from "react";
import { Check, X, Loader2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CollaborationRequest } from "@/lib/types/coach";
import { toast } from "sonner";
import {
  acceptCollaborationRequest,
  rejectCollaborationRequest,
} from "@/lib/api/coach-plans";
import { cn } from "@/lib/utils";

const GOAL_FA: Record<string, string> = {
  lose_weight: "کاهش وزن",
  build_muscle: "عضله‌سازی",
  general_fitness: "آمادگی عمومی",
  maintain: "حفظ تناسب",
  endurance: "استقامت",
};

/** Mode-aware status pill styles. */
const STATUS_FA: Record<
  CollaborationRequest["status"],
  { label: string; className: string }
> = {
  pending: {
    label: "در انتظار",
    className: cn(
      "bg-amber-500/10 text-amber-700 border-amber-500/25",
      "dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/25",
    ),
  },
  accepted: {
    label: "پذیرفته‌شده",
    className: cn(
      "bg-emerald-500/10 text-emerald-700 border-emerald-500/25",
      "dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/25",
    ),
  },
  rejected: {
    label: "ردشده",
    className: cn(
      "bg-destructive/10 text-destructive border-destructive/25",
      "dark:bg-destructive/15 dark:border-destructive/25",
    ),
  },
  cancelled: {
    label: "لغوشده",
    className: cn(
      "bg-muted text-muted-foreground border-border",
      "dark:bg-white/5 dark:text-muted-foreground dark:border-white/10",
    ),
  },
};

type Props = {
  request: CollaborationRequest;
  clientName?: string;
  onDone?: () => void;
};

export function RequestCard({ request, clientName, onDone }: Props) {
  const [loading, setLoading] = useState<"accept" | "reject" | null>(null);
  const statusMeta = STATUS_FA[request.status];

  const handleAccept = async () => {
    setLoading("accept");
    try {
      await acceptCollaborationRequest(request.id);
      toast.success("درخواست پذیرفته شد", {
        description: "هنرجو به لیست هنرجویان اضافه شد.",
      });
      onDone?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "خطا در پذیرش درخواست";
      toast.error(message);
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    setLoading("reject");
    try {
      await rejectCollaborationRequest(request.id);
      toast.success("درخواست رد شد");
      onDone?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "خطا در رد درخواست";
      toast.error(message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card
      className={cn(
        "rounded-2xl overflow-hidden transition-shadow",
        // LIGHT: real card + soft elevation
        "bg-card border-border shadow-sm shadow-foreground/4",
        "hover:shadow-md hover:shadow-foreground/6",
        // DARK: glass
        "dark:bg-card/60 dark:border-white/10 dark:backdrop-blur-md dark:shadow-none",
        "dark:hover:border-white/20",
      )}
    >
      <CardContent className="p-4 sm:p-5 space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm sm:text-base truncate text-foreground">
                {clientName || "کاربر"}
              </p>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] h-5 px-2 border",
                  statusMeta.className,
                )}
              >
                {statusMeta.label}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Target className="w-3.5 h-3.5 shrink-0" />
              <span>{GOAL_FA[request.goal] ?? request.goal}</span>
              <span className="text-border">•</span>
              <span>
                {new Date(request.createdAt).toLocaleDateString("fa-IR")}
              </span>
            </div>
          </div>
        </div>

        {request.message && (
          <p
            className={cn(
              "text-sm text-muted-foreground leading-relaxed line-clamp-3 rounded-xl px-3 py-2.5 border",
              // LIGHT: subtle tinted panel
              "bg-muted/50 border-border",
              // DARK: glass
              "dark:bg-white/3 dark:border-white/5",
            )}
          >
            {request.message}
          </p>
        )}

        {request.status === "pending" && (
          <div className="flex gap-2 pt-0.5">
            <Button
              size="sm"
              className={cn(
                "flex-1 h-9 gap-1.5 font-medium",
                // LIGHT: warm shadow under orange
                "shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25",
                // DARK: glow only
                "dark:shadow-none dark:hover:shadow-lg dark:hover:shadow-primary/30",
              )}
              onClick={handleAccept}
              disabled={!!loading}
            >
              {loading === "accept" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              پذیرش
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={cn(
                "flex-1 h-9 gap-1.5",
                // LIGHT: visible outline
                "bg-card border-border hover:bg-accent hover:border-foreground/20",
                // DARK
                "dark:bg-transparent dark:border-white/15 dark:hover:bg-white/5 dark:hover:border-white/25",
              )}
              onClick={handleReject}
              disabled={!!loading}
            >
              {loading === "reject" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
              رد
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
