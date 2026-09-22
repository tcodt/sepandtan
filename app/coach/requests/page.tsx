"use client";

import { useEffect, useState, useCallback } from "react";
import { useUserStore } from "@/lib/store/user-store";
import { db } from "@/lib/api/db";
import { RequestCard } from "@/components/coach/request-card";
import { CoachEmptyState } from "@/components/coach/empty-states";
import type { CollaborationRequest } from "@/lib/types/coach";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Filter = "all" | "pending" | "accepted" | "rejected";

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "همه" },
  { key: "pending", label: "در انتظار" },
  { key: "accepted", label: "پذیرفته‌شده" },
  { key: "rejected", label: "ردشده" },
];

export default function CoachRequestsPage() {
  const user = useUserStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("pending");
  const [requests, setRequests] = useState<
    (CollaborationRequest & { clientName?: string })[]
  >([]);
  const [pendingCount, setPendingCount] = useState(0);

  const loadRequests = useCallback(() => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const coach = db.coaches.find((c) => c.userId === user.id);
      if (!coach) {
        setRequests([]);
        setPendingCount(0);
        setLoading(false);
        return;
      }

      const allForCoach = db.collaborationRequests.filter(
        (r) => r.coachId === coach.id,
      );
      setPendingCount(allForCoach.filter((r) => r.status === "pending").length);

      let list = [...allForCoach];
      if (filter !== "all") {
        list = list.filter((r) => r.status === filter);
      }

      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      const withNames = list.map((r) => {
        const client = db.users.find((u) => u.id === r.userId);
        return { ...r, clientName: client?.name };
      });

      setRequests(withNames);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, filter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight">
            درخواست‌های همکاری
          </h1>
          {pendingCount > 0 && (
            <Badge className="bg-amber-500/15 text-amber-400 border-0 text-[10px]">
              {pendingCount.toLocaleString("fa-IR")} در انتظار
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          درخواست‌های کاربران برای همکاری با شما
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all border",
              filter === f.key
                ? "bg-primary text-primary-foreground font-medium border-primary shadow-sm"
                : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-white/5 animate-pulse"
            />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <CoachEmptyState type="requests" />
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              clientName={req.clientName}
              onDone={loadRequests}
            />
          ))}
        </div>
      )}
    </div>
  );
}
