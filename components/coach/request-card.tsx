"use client";

import { useState } from "react";
import { Check, X, Loader2, MessageSquare, Clock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { CollaborationRequest } from "@/lib/types/coach";
import {
  acceptCollaborationRequest,
  rejectCollaborationRequest,
} from "@/lib/api/coach-plans";
import { getErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const STATUS_META: Record<
  CollaborationRequest["status"],
  { label: string; className: string }
> = {
  pending: {
    label: "در انتظار",
    className: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  },
  accepted: {
    label: "پذیرفته‌شده",
    className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  },
  rejected: {
    label: "رد شده",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  cancelled: {
    label: "لغو شده",
    className: "bg-muted text-muted-foreground border-border",
  },
};

type Props = {
  request: CollaborationRequest & { clientName?: string };
  onChanged?: () => void;
};

export function RequestCard({ request, onChanged }: Props) {
  const [busy, setBusy] = useState<"accept" | "reject" | null>(null);
  const meta = STATUS_META[request.status] ?? STATUS_META.pending;
  const isPending = request.status === "pending";

  const handleAccept = async () => {
    setBusy("accept");
    try {
      await acceptCollaborationRequest(request.id);
      toast.success("درخواست پذیرفته شد");
      onChanged?.();
    } catch (e) {
      toast.error(getErrorMessage(e, "خطا در تأیید درخواست"));
    } finally {
      setBusy(null);
    }
  };

  const handleReject = async () => {
    setBusy("reject");
    try {
      await rejectCollaborationRequest(request.id);
      toast.success("درخواست رد شد");
      onChanged?.();
    } catch (e) {
      toast.error(getErrorMessage(e, "خطا در رد درخواست"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="border-border/60 bg-card/80">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">
              {request.clientName || "هنرجو"}
            </p>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />
              {request.createdAt
                ? new Date(request.createdAt).toLocaleDateString("fa-IR")
                : "—"}
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn("text-[10px] shrink-0", meta.className)}
          >
            {meta.label}
          </Badge>
        </div>

        {(request.message || request.goal) && (
          <div className="rounded-lg bg-muted/50 p-3 text-xs text-foreground/90 leading-relaxed flex gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <span className="whitespace-pre-wrap wrap-break-word">
              {[request.goal, request.message].filter(Boolean).join("\n")}
            </span>
          </div>
        )}

        {request.rejectionReason && (
          <p className="text-[11px] text-destructive">
            دلیل رد: {request.rejectionReason}
          </p>
        )}

        {isPending && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="flex-1 h-9"
              onClick={handleAccept}
              disabled={busy !== null}
            >
              {busy === "accept" ? (
                <Loader2 className="w-4 h-4 animate-spin ml-1" />
              ) : (
                <Check className="w-4 h-4 ml-1" />
              )}
              پذیرش
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-9"
              onClick={handleReject}
              disabled={busy !== null}
            >
              {busy === "reject" ? (
                <Loader2 className="w-4 h-4 animate-spin ml-1" />
              ) : (
                <X className="w-4 h-4 ml-1" />
              )}
              رد
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
