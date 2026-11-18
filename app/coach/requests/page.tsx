"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Inbox, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RequestCard } from "@/components/coach/request-card";
import { EmptyState } from "@/components/common/empty-state";
import { useUserStore } from "@/lib/store/user-store";
import type { CollaborationRequest } from "@/lib/types/coach";
import { getCoachCollaborationRequests } from "@/lib/api/coach-plans";
import { getErrorMessage } from "@/lib/api/client";

type RequestWithName = CollaborationRequest & { clientName?: string };
type Filter = "all" | "pending" | "accepted" | "rejected";

export default function CoachRequestsPage() {
  const user = useUserStore((s) => s.user);
  const [items, setItems] = useState<RequestWithName[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("pending");

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const list = await getCoachCollaborationRequests();
      setItems(list.map((r) => ({ ...r })));
    } catch (e) {
      setError(getErrorMessage(e, "خطا در بارگذاری درخواست‌ها"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((r) => r.status === filter);
  }, [items, filter]);

  const pendingCount = items.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">درخواست‌های همکاری</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {pendingCount > 0
              ? `${pendingCount.toLocaleString("fa-IR")} درخواست در انتظار`
              : "صندوق درخواست‌ها"}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(
          [
            ["pending", "در انتظار"],
            ["accepted", "پذیرفته"],
            ["rejected", "رد شده"],
            ["all", "همه"],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            size="sm"
            variant={filter === id ? "default" : "outline"}
            className="h-8 text-xs"
            onClick={() => setFilter(id)}
          >
            {label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-6 h-6" />}
          title="درخواستی نیست"
          description={
            filter === "pending"
              ? "درخواست جدیدی در انتظار پاسخ ندارید."
              : "موردی با این فیلتر پیدا نشد."
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((req) => (
            <RequestCard key={req.id} request={req} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}
