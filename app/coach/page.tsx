"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsCards } from "@/components/coach/stats-cards";
import { RequestCard } from "@/components/coach/request-card";
import { CoachEmptyState } from "@/components/coach/empty-states";
import { useUserStore } from "@/lib/store/user-store";
import { db } from "@/lib/api/db";
import {
  getClientRelationsForCoach,
  getCoachPlans,
} from "@/lib/api/coach-plans";
import type { CollaborationRequest } from "@/lib/types/coach";

export default function CoachDashboardPage() {
  const user = useUserStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingRequests: 0,
    activeClients: 0,
    draftPlans: 0,
    publishedPlans: 0,
  });
  const [pendingRequests, setPendingRequests] = useState<
    (CollaborationRequest & { clientName?: string })[]
  >([]);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      // پیدا کردن coachId از روی userId
      const coach = db.coaches.find((c) => c.userId === user.id);
      if (!coach) {
        setLoading(false);
        return;
      }

      const [relations, plans] = await Promise.all([
        getClientRelationsForCoach(coach.id),
        getCoachPlans(coach.id),
      ]);

      const pending = db.collaborationRequests.filter(
        (r) => r.coachId === coach.id && r.status === "pending"
      );

      // اضافه کردن نام کاربر به درخواست‌ها
      const pendingWithName = pending.map((r) => {
        const client = db.users.find((u) => u.id === r.userId);
        return { ...r, clientName: client?.name };
      });

      setStats({
        pendingRequests: pending.length,
        activeClients: relations.length,
        draftPlans: plans.filter((p) => p.status === "draft").length,
        publishedPlans: plans.filter((p) => p.status === "published").length,
      });
      setPendingRequests(pendingWithName.slice(0, 3)); // حداکثر ۳ تا در داشبورد
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const hasAnyData =
    stats.pendingRequests > 0 ||
    stats.activeClients > 0 ||
    stats.draftPlans > 0 ||
    stats.publishedPlans > 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">سلام، {user?.name?.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            پنل مربی سپندتن
          </p>
        </div>

        <Button asChild className="gap-2">
          <Link href="/coach/plans">
            <Plus className="w-4 h-4" />
            ساخت برنامه جدید
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} loading={loading} />

      {/* نیاز به اقدام */}
      {!loading && pendingRequests.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">نیاز به اقدام</h2>
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link href="/coach/requests">
                مشاهده همه
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pendingRequests.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                clientName={req.clientName}
                onDone={loadData}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {!loading && !hasAnyData && <CoachEmptyState type="dashboard" />}
    </div>
  );
}