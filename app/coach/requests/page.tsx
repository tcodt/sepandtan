"use client";

import { useEffect, useState, useCallback } from "react";
import { useUserStore } from "@/lib/store/user-store";
import { db } from "@/lib/api/db";
import { RequestCard } from "@/components/coach/request-card";
import { CoachEmptyState } from "@/components/coach/empty-states";
import type { CollaborationRequest } from "@/lib/types/coach";
import { cn } from "@/lib/utils";

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

  const loadRequests = useCallback(() => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const coach = db.coaches.find((c) => c.userId === user.id);
      if (!coach) {
        setRequests([]);
        setLoading(false);
        return;
      }

      let list = db.collaborationRequests.filter((r) => r.coachId === coach.id);

      if (filter !== "all") {
        list = list.filter((r) => r.status === filter);
      }

      // مرتب‌سازی: جدیدترین اول
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">درخواست‌های همکاری</h1>
        <p className="text-sm text-muted-foreground mt-1">
          درخواست‌های کاربران برای همکاری با شما
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors",
              filter === f.key
                ? "bg-primary text-primary-foreground font-medium"
                : "bg-white/5 text-muted-foreground hover:bg-white/10",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
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
