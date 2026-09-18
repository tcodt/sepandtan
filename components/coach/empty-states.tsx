"use client";

import { Inbox, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Props = {
  type: "requests" | "clients" | "plans" | "dashboard";
};

export function CoachEmptyState({ type }: Props) {
  const config = {
    requests: {
      icon: Inbox,
      title: "هنوز درخواستی ندارید",
      description:
        "وقتی کاربران درخواست همکاری بفرستند، اینجا نمایش داده می‌شود.",
    },
    clients: {
      icon: Users,
      title: "هنوز هنرجویی ندارید",
      description: "درخواست‌های همکاری را بپذیرید تا هنرجویان اینجا ظاهر شوند.",
      action: { label: "مشاهده درخواست‌ها", href: "/coach/requests" },
    },
    plans: {
      icon: FileText,
      title: "هنوز برنامه‌ای نساخته‌اید",
      description:
        "اولین برنامه تمرینی خود را بسازید و به هنرجویان اختصاص دهید.",
    },
    dashboard: {
      icon: Users,
      title: "به پنل مربی خوش آمدید",
      description:
        "هنوز هنرجو یا درخواستی ندارید. به محض دریافت درخواست، اینجا نمایش داده می‌شود.",
      action: { label: "مشاهده درخواست‌ها", href: "/coach/requests" },
    },
  }[type];

  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{config.title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        {config.description}
      </p>
      {"action" in config && config.action && (
        <Button asChild variant="outline">
          <Link href={config.action.href}>{config.action.label}</Link>
        </Button>
      )}
    </div>
  );
}
