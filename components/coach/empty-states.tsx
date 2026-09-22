"use client";

import Link from "next/link";
import { Inbox, Users, FileText, LayoutDashboard, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  type: "requests" | "clients" | "plans" | "dashboard";
};

const config = {
  requests: {
    icon: Inbox,
    title: "هنوز درخواستی نیست",
    description:
      "وقتی کاربران درخواست همکاری بفرستند، اینجا ظاهر می‌شود. می‌توانی از پروفایل عمومی‌ات لینک دعوت بفرستی.",
    primary: { label: "رفتن به داشبورد", href: "/coach" },
    secondary: null as { label: string; href: string } | null,
  },
  clients: {
    icon: Users,
    title: "هنرجویی نداری",
    description:
      "با پذیرش درخواست‌های همکاری، هنرجویان اینجا لیست می‌شوند و می‌توانی برنامه اختصاص بدهی.",
    primary: { label: "مشاهده درخواست‌ها", href: "/coach/requests" },
    secondary: { label: "داشبورد", href: "/coach" },
  },
  plans: {
    icon: FileText,
    title: "هنوز برنامه‌ای نساختی",
    description:
      "اولین برنامه تمرینی هفتگی‌ات را بساز، منتشر کن و به هنرجویان اختصاص بده.",
    primary: { label: "ساخت برنامه جدید", href: "/coach/plans/new" },
    secondary: { label: "هنرجویان", href: "/coach/clients" },
  },
  dashboard: {
    icon: LayoutDashboard,
    title: "به پنل مربی خوش آمدی",
    description:
      "از اینجا درخواست‌ها را مدیریت کن، برنامه بساز و به هنرجویان اختصاص بده. برای شروع یکی از کارهای زیر را انجام بده.",
    primary: { label: "ساخت اولین برنامه", href: "/coach/plans/new" },
    secondary: { label: "مشاهده درخواست‌ها", href: "/coach/requests" },
  },
} as const;

export function CoachEmptyState({ type }: Props) {
  const c = config[type];
  const Icon = c.icon;

  return (
    <Card className="border-dashed border-white/15 bg-card/60">
      <CardContent className="flex flex-col items-center justify-center py-14 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 ring-1 ring-primary/20">
          <Icon className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{c.title}</h3>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-7">
          {c.description}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button asChild className="gap-2 h-10 px-5">
            <Link href={c.primary.href}>
              {type === "plans" || type === "dashboard" ? (
                <Plus className="w-4 h-4" />
              ) : null}
              {c.primary.label}
            </Link>
          </Button>
          {c.secondary && (
            <Button asChild variant="outline" className="h-10 px-5">
              <Link href={c.secondary.href}>{c.secondary.label}</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
