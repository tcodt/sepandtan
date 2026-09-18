"use client";

import Link from "next/link";
import { ChevronLeft, Activity, Scale } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ClientRelation } from "@/lib/types/client-relation";
import Image from "next/image";

type Progress = {
  lastWeight: number | null;
  sessionsLast7Days: number;
  planStatus: string | null;
  currentPlanTitle?: string;
};

type Props = {
  relation: ClientRelation;
  clientName: string;
  clientAvatar?: string;
  progress?: Progress;
};

export function ClientCard({
  relation,
  clientName,
  clientAvatar,
  progress,
}: Props) {
  return (
    <Link href={`/coach/clients/${relation.clientId}`}>
      <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/8 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg shrink-0">
              {clientAvatar ? (
                <Image
                  src={clientAvatar}
                  alt={clientName}
                  className="w-full h-full rounded-full object-cover"
                  width={48}
                  height={48}
                />
              ) : (
                clientName.charAt(0)
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium truncate">{clientName}</p>
                <ChevronLeft className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>

              <p className="text-xs text-muted-foreground mt-0.5">
                از {new Date(relation.startedAt).toLocaleDateString("fa-IR")}
              </p>

              {/* Progress summary */}
              {progress && (
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  {progress.lastWeight !== null && (
                    <span className="flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5" />
                      {progress.lastWeight} کیلو
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" />
                    {progress.sessionsLast7Days} جلسه / ۷ روز
                  </span>
                </div>
              )}

              {progress?.currentPlanTitle && (
                <p className="text-xs text-primary mt-1 truncate">
                  {progress.currentPlanTitle}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
