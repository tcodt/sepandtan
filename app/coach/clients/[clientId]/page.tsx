"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Scale, Activity, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUserStore } from "@/lib/store/user-store";
import { db } from "@/lib/api/db";
import { getClientProgressSummary } from "@/lib/api/coach-plans";
import type { ClientRelation } from "@/lib/types/client-relation";
import type { UserProfile } from "@/lib/types/plan";
import Image from "next/image";
import { AssignPlanSheet } from "@/components/coach/assign-plan-sheet";

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const clientId = params.clientId as string;

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<UserProfile | null>(null);
  const [relation, setRelation] = useState<ClientRelation | null>(null);
  const [progress, setProgress] = useState<{
    lastWeight: number | null;
    sessionsLast7Days: number;
    planStatus: string | null;
    currentPlanTitle?: string;
  } | null>(null);
  const [showAssign, setShowAssign] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id || !clientId) return;
    setLoading(true);

    try {
      const coach = db.coaches.find((c) => c.userId === user.id);
      if (!coach) {
        router.replace("/coach/clients");
        return;
      }

      const foundRelation = db.clientRelations.find(
        (r) =>
          r.clientId === clientId &&
          r.coachId === coach.id &&
          r.status === "active",
      );

      if (!foundRelation) {
        router.replace("/coach/clients");
        return;
      }

      const foundClient = db.users.find((u) => u.id === clientId) ?? null;
      const progressData = await getClientProgressSummary(clientId, coach.id);

      setRelation(foundRelation);
      setClient(foundClient);
      setProgress(progressData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, clientId, router]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 p-4">
        <div className="h-8 w-32 bg-white/5 rounded animate-pulse" />
        <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />
        <div className="h-32 bg-white/5 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!client || !relation || !user) return null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/coach/clients")}
        >
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">{client.name}</h1>
          <p className="text-sm text-muted-foreground">جزئیات هنرجو</p>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-md">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl">
              {client.avatarUrl ? (
                <Image
                  src={client.avatarUrl}
                  alt={client.name}
                  className="w-full h-full rounded-full object-cover"
                  width={46}
                  height={46}
                />
              ) : (
                client.name.charAt(0)
              )}
            </div>
            <div>
              <p className="font-semibold text-lg">{client.name}</p>
              {client.goal && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  هدف: {client.goal}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                همکاری از{" "}
                {new Date(relation.startedAt).toLocaleDateString("fa-IR")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 flex flex-col items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            <p className="text-2xl font-bold">{progress?.lastWeight ?? "—"}</p>
            <p className="text-xs text-muted-foreground">آخرین وزن (کیلو)</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 flex flex-col items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <p className="text-2xl font-bold">
              {progress?.sessionsLast7Days ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">جلسه در ۷ روز</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Plan */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">برنامه فعلی</h3>
          </div>

          {progress?.currentPlanTitle ? (
            <div>
              <p className="font-medium">{progress.currentPlanTitle}</p>
              <p className="text-sm text-muted-foreground mt-1">
                وضعیت: {progress.planStatus ?? "نامشخص"}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              هنوز برنامه‌ای فعال نشده است.
            </p>
          )}

          <Button
            className="w-full"
            variant={progress?.currentPlanTitle ? "outline" : "default"}
            onClick={() => setShowAssign(true)}
          >
            {progress?.currentPlanTitle ? "تغییر برنامه" : "اختصاص برنامه"}
          </Button>
        </CardContent>
      </Card>

      {/* Assign Sheet */}
      <AssignPlanSheet
        open={showAssign}
        onClose={() => setShowAssign(false)}
        clientId={clientId}
        clientRelationId={relation.id}
        coachUserId={user.id}
        onSuccess={load}
      />
    </div>
  );
}
