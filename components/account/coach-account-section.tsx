"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Inbox,
  FileText,
  Instagram,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUserStore } from "@/lib/store/user-store";
import { getCoachByUserIdSync } from "@/lib/api/coaches";
import {
  getClientRelationsForCoach,
  getCoachPlans,
} from "@/lib/api/coach-plans";
import { db } from "@/lib/api/db";

type CoachProfile = {
  specialties: string[];
  experienceYears: number;
  bio: string;
  instagram?: string | null;
  website?: string | null;
  status: string;
  createdAt: string;
};

export function CoachAccountSection() {
  const user = useUserStore((s) => s.user);
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [stats, setStats] = useState({
    activeClients: "—",
    requests: "—",
    plans: "—",
  });

  useEffect(() => {
    if (!user?.id) return;

    // اولویت: db.coaches (منبع حقیقت) → بعد localStorage برای لینک‌های اختیاری
    const coach = getCoachByUserIdSync(user.id);
    let fromStorage: Partial<CoachProfile> | null = null;

    try {
      const raw = localStorage.getItem(`coach-profile-${user.id}`);
      if (raw) fromStorage = JSON.parse(raw);
    } catch {
      fromStorage = null;
    }

    if (coach) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfile({
        specialties: coach.specialties,
        experienceYears: coach.experienceYears,
        bio: coach.bio,
        instagram: fromStorage?.instagram ?? null,
        website: fromStorage?.website ?? null,
        status: "approved",
        createdAt: coach.createdAt,
      });

      // آمار واقعی از db
      void (async () => {
        try {
          const [relations, plans] = await Promise.all([
            getClientRelationsForCoach(coach.id),
            getCoachPlans(coach.id),
          ]);
          const pendingCount = db.collaborationRequests.filter(
            (r) => r.coachId === coach.id && r.status === "pending",
          ).length;

          setStats({
            activeClients: relations.length.toLocaleString("fa-IR"),
            requests: pendingCount.toLocaleString("fa-IR"),
            plans: plans.length.toLocaleString("fa-IR"),
          });
        } catch {
          // silent
        }
      })();
    } else if (fromStorage) {
      setProfile({
        specialties: fromStorage.specialties ?? [],
        experienceYears: fromStorage.experienceYears ?? 0,
        bio: fromStorage.bio ?? "",
        instagram: fromStorage.instagram,
        website: fromStorage.website,
        status: fromStorage.status ?? "approved",
        createdAt: fromStorage.createdAt ?? new Date().toISOString(),
      });
    } else {
      setProfile(null);
    }
  }, [user?.id]);

  const statsItems = [
    { label: "هنرجویان فعال", value: stats.activeClients, icon: Users },
    { label: "درخواست‌ها", value: stats.requests, icon: Inbox },
    { label: "برنامه‌ها", value: stats.plans, icon: FileText },
  ];

  return (
    <div className="space-y-4">
      {/* دکمه اصلی ورود به پنل */}
      <Card className="border-primary/25 bg-linear-to-br from-primary/10 via-background/30 to-emerald-500/5">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/15 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">پنل مربی سپندتن</h3>
              <p className="text-sm text-muted-foreground">
                مدیریت هنرجویان، درخواست‌ها و برنامه‌ها
              </p>
            </div>
          </div>

          <Button asChild className="w-full h-11 font-semibold gap-2">
            <Link href="/coach">
              ورود به پنل مربی
              <LayoutDashboard className="w-4 h-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* آمار مربی */}
      <div className="grid grid-cols-3 gap-3">
        {statsItems.map((item) => (
          <Card key={item.label} className="border-border/60 bg-card/50">
            <CardContent className="p-3 text-center space-y-1">
              <item.icon className="w-4 h-4 mx-auto text-muted-foreground" />
              <p className="text-lg font-bold tabular-nums">{item.value}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                {item.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* پروفایل مربی */}
      {profile && (
        <Card className="border-border/60">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">پروفایل مربی</h3>
              <Badge
                variant="outline"
                className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10"
              >
                فعال
              </Badge>
            </div>

            {/* تخصص‌ها */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">تخصص‌ها</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.specialties.map((item) => (
                  <span
                    key={item}
                    className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* سابقه */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">سابقه مربیگری</span>
              <span className="font-medium">
                {profile.experienceYears.toLocaleString("fa-IR")} سال
              </span>
            </div>

            {/* بیو */}
            {profile.bio && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">بیو</p>
                <p className="text-sm text-foreground leading-relaxed">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* لینک‌ها */}
            <div className="flex flex-wrap gap-2 pt-1">
              {profile.instagram && (
                <a
                  href={`https://instagram.com/${profile.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  {profile.instagram}
                </a>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  وب‌سایت
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
