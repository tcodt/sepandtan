"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Scale,
  Activity,
  Calendar,
  FileText,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserStore } from "@/lib/store/user-store";
import { db } from "@/lib/api/db";
import { getClientProgressSummary } from "@/lib/api/coach-plans";
import { AssignPlanSheet } from "@/components/coach/assign-plan-sheet";
import type { ClientRelation } from "@/lib/types/client-relation";
import type { UserProfile } from "@/lib/types/plan";

const PLAN_STATUS_FA: Record<string, string> = {
  active: "فعال",
  assigned: "اختصاص‌یافته",
  archived: "آرشیو",
  published: "منتشرشده",
  draft: "پیش‌نویس",
};

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
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);

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
      setCurrentPlanId(foundClient?.currentPlanId ?? null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, clientId, router]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !relation) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-8 w-32 bg-white/5 rounded-lg animate-pulse" />
        <div className="h-36 bg-white/5 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 bg-white/5 rounded-2xl animate-pulse" />
          <div className="h-24 bg-white/5 rounded-2xl animate-pulse" />
        </div>
        <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const initials =
    client?.name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("") ?? "ه";

  const hasPlan = Boolean(progress?.currentPlanTitle);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 -mr-2 text-muted-foreground"
        onClick={() => router.push("/coach/clients")}
      >
        <ArrowRight className="w-4 h-4" />
        بازگشت به هنرجویان
      </Button>

      <Card className="bg-card/60 border-white/10 backdrop-blur-md overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border border-white/10">
              {client?.avatarUrl ? (
                <AvatarImage src={client.avatarUrl} alt={client.name} />
              ) : null}
              <AvatarFallback className="bg-primary/15 text-primary text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-1.5">
              <h1 className="text-xl font-bold truncate">
                {client?.name ?? "هنرجو"}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  همکاری از{" "}
                  {new Date(relation.startedAt).toLocaleDateString("fa-IR")}
                </span>
                {client?.goal && (
                  <Badge variant="secondary" className="text-[10px] h-5">
                    {client.goal}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-card/60 border-white/10">
          <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Scale className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold tabular-nums">
              {progress?.lastWeight != null
                ? progress.lastWeight.toLocaleString("fa-IR")
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground">آخرین وزن (کیلو)</p>
          </CardContent>
        </Card>

        <Card className="bg-card/60 border-white/10">
          <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold tabular-nums">
              {(progress?.sessionsLast7Days ?? 0).toLocaleString("fa-IR")}
            </p>
            <p className="text-xs text-muted-foreground">جلسه در ۷ روز</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/60 border-white/10">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">برنامه فعلی</h3>
          </div>

          {hasPlan ? (
            <div className="rounded-xl bg-card/60 border border-white/5 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="font-medium">{progress?.currentPlanTitle}</p>
                  <Badge
                    variant="outline"
                    className="text-[10px] border-emerald-500/25 text-emerald-400 bg-emerald-500/10"
                  >
                    {PLAN_STATUS_FA[progress?.planStatus ?? ""] ??
                      progress?.planStatus}
                  </Badge>
                </div>
                {currentPlanId && (
                  <Button
                    asChild
                    size="sm"
                    variant="ghost"
                    className="gap-1 shrink-0"
                  >
                    <Link href={`/plans/${currentPlanId}`}>
                      مشاهده
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">
              هنوز برنامه‌ای برای این هنرجو فعال نشده. یک برنامه منتشرشده انتخاب
              و فعال کن.
            </p>
          )}

          <Button
            className="w-full h-11 font-semibold"
            variant={hasPlan ? "outline" : "default"}
            onClick={() => setShowAssign(true)}
          >
            {hasPlan ? "تغییر / اختصاص برنامه جدید" : "اختصاص برنامه"}
          </Button>
        </CardContent>
      </Card>

      <AssignPlanSheet
        open={showAssign}
        onClose={() => setShowAssign(false)}
        clientId={clientId}
        clientRelationId={relation.id}
        coachUserId={user!.id}
        onSuccess={load}
      />
    </div>
  );
}
