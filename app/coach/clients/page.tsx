"use client";

import { useEffect, useState, useCallback } from "react";
import { useUserStore } from "@/lib/store/user-store";
import { db } from "@/lib/api/db";
import {
  getClientRelationsForCoach,
  getClientProgressSummary,
} from "@/lib/api/coach-plans";
import { ClientCard } from "@/components/coach/client-card";
import { CoachEmptyState } from "@/components/coach/empty-states";
import type { ClientRelation } from "@/lib/types/client-relation";

type ClientItem = {
  relation: ClientRelation;
  clientName: string;
  clientAvatar?: string;
  progress: {
    lastWeight: number | null;
    sessionsLast7Days: number;
    planStatus: string | null;
    currentPlanTitle?: string;
  };
};

export default function CoachClientsPage() {
  const user = useUserStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientItem[]>([]);

  const loadClients = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const coach = db.coaches.find((c) => c.userId === user.id);
      if (!coach) {
        setClients([]);
        setLoading(false);
        return;
      }

      const relations = await getClientRelationsForCoach(coach.id);

      const items: ClientItem[] = await Promise.all(
        relations.map(async (relation) => {
          const client = db.users.find((u) => u.id === relation.clientId);
          const progress = await getClientProgressSummary(
            relation.clientId,
            coach.id,
          );

          return {
            relation,
            clientName: client?.name ?? "کاربر",
            clientAvatar: client?.avatarUrl,
            progress,
          };
        }),
      );

      items.sort(
        (a, b) =>
          new Date(b.relation.startedAt).getTime() -
          new Date(a.relation.startedAt).getTime(),
      );

      setClients(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">هنرجویان من</h1>
        <p className="text-sm text-muted-foreground">
          {loading
            ? "در حال بارگذاری..."
            : clients.length === 0
              ? "هنرجوی فعالی نداری"
              : `${clients.length.toLocaleString("fa-IR")} هنرجوی فعال`}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 rounded-2xl bg-white/5 animate-pulse"
            />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <CoachEmptyState type="clients" />
      ) : (
        <div className="space-y-3">
          {clients.map((item) => (
            <ClientCard
              key={item.relation.id}
              clientId={item.relation.clientId}
              clientName={item.clientName}
              clientAvatar={item.clientAvatar}
              startedAt={item.relation.startedAt}
              progress={item.progress}
            />
          ))}
        </div>
      )}
    </div>
  );
}
