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
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUserStore } from "@/lib/store/user-store";

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

  useEffect(() => {
    if (!user?.id) return;

    try {
      const raw = localStorage.getItem(`coach-profile-${user.id}`);
      if (raw) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setProfile(JSON.parse(raw));
      }
    } catch {
      setProfile(null);
    }
  }, [user?.id]);

  // آمار موقتی (بعداً از API واقعی می‌آید)
  const stats = [
    { label: "هنرجویان فعال", value: "—", icon: Users },
    { label: "درخواست‌ها", value: "—", icon: Inbox },
    { label: "برنامه‌ها", value: "—", icon: FileText },
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
        {stats.map((item) => (
          <Card
            key={item.label}
            className="border-border/50 bg-card/80 dark:bg-card/60"
          >
            <CardContent className="p-3 text-center space-y-1">
              <item.icon className="w-4 h-4 mx-auto text-primary" />
              <p className="text-lg font-bold text-foreground">{item.value}</p>
              <p className="text-[11px] text-muted-foreground">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* پروفایل مربی */}
      {profile && (
        <Card className="border-border/50 bg-card/80 dark:bg-card/60">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                پروفایل مربی
              </h3>
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
