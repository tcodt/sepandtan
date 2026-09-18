"use client";

import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CollaborationRequest } from "@/lib/types/coach";
import { toast } from "sonner";
import {
  acceptCollaborationRequest,
  rejectCollaborationRequest,
} from "@/lib/api/coach-plans";

type Props = {
  request: CollaborationRequest;
  clientName?: string;
  onDone?: () => void;
};

export function RequestCard({ request, clientName, onDone }: Props) {
  const [loading, setLoading] = useState<"accept" | "reject" | null>(null);

  const handleAccept = async () => {
    setLoading("accept");
    try {
      await acceptCollaborationRequest(request.id);
      toast.success("درخواست پذیرفته شد");
      onDone?.();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message || "خطا در پذیرش درخواست");
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message || "خطا در رد درخواست");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-md">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium">{clientName || "کاربر"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              هدف: {request.goal}
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {new Date(request.createdAt).toLocaleDateString("fa-IR")}
          </span>
        </div>

        {request.message && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {request.message}
          </p>
        )}

        {request.status === "pending" && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="flex-1 gap-1.5"
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
              className="flex-1 gap-1.5"
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
