"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  ArrowLeft,
  Inbox,
  Users,
  FileText,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsCards } from "@/components/coach/stats-cards";
import { RequestCard } from "@/components/coach/request-card";
import { CoachEmptyState } from "@/components/coach/empty-states";
import { useUserStore } from "@/lib/store/user-store";
import {
  getClientRelationsForCoach,
  getCoachPlans,
  getCoachCollaborationRequests,
} from "@/lib/api/coach-plans";
import { getOrCreateCoachProfileForUser } from "@/lib/api/coaches";
import type { CollaborationRequest } from "@/lib/types/coach";
import { cn } from "@/lib/utils";

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
  const [coachMissing, setCoachMissing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      // 1) Coach profile — hard requirement
      let coach;
      try {
        coach = await getOrCreateCoachProfileForUser({
          userId: user.id,
          name: user.name,
          avatarUrl: user.avatarUrl,
        });
        setCoachMissing(false);
      } catch (err) {
        console.error("coach profile", err);
        setCoachMissing(true);
        setStats({
          pendingRequests: 0,
          activeClients: 0,
          draftPlans: 0,
          publishedPlans: 0,
        });
        setPendingRequests([]);
        return;
      }

      // 2) Parallel secondary data — soft failures
      const [relationsResult, plansResult, requestsResult] =
        await Promise.allSettled([
          getClientRelationsForCoach(coach.id),
          getCoachPlans(coach.id),
          getCoachCollaborationRequests(),
        ]);

      const relations =
        relationsResult.status === "fulfilled" ? relationsResult.value : [];
      const plans = plansResult.status === "fulfilled" ? plansResult.value : [];
      const requests =
        requestsResult.status === "fulfilled" ? requestsResult.value : [];

      if (relationsResult.status === "rejected") {
        console.warn("relations", relationsResult.reason);
      }
      if (plansResult.status === "rejected") {
        console.warn("plans (still local/fake)", plansResult.reason);
      }
      if (requestsResult.status === "rejected") {
        console.warn("plan-requests", requestsResult.reason);
      }

      const pending = requests.filter((r) => r.status === "pending");

      setStats({
        pendingRequests: pending.length,
        activeClients: relations.length,
        draftPlans: plans.filter((p) => p.status === "draft").length,
        publishedPlans: plans.filter((p) => p.status === "published").length,
      });
      setPendingRequests(pending.slice(0, 3));
    } finally {
      setLoading(false);
    }
  }, [user?.avatarUrl, user?.id, user?.name]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  const hasAnyData =
    stats.pendingRequests > 0 ||
    stats.activeClients > 0 ||
    stats.draftPlans > 0 ||
    stats.publishedPlans > 0;

  const firstName = user?.name?.split(" ")[0] ?? "مربی";

  const quickActions = [
    {
      href: "/coach/requests",
      label: "درخواست‌ها",
      desc:
        stats.pendingRequests > 0
          ? `${stats.pendingRequests.toLocaleString("fa-IR")} در انتظار پاسخ`
          : "مدیریت همکاری‌ها",
      icon: Inbox,
      badge: stats.pendingRequests > 0 ? stats.pendingRequests : undefined,
    },
    {
      href: "/coach/clients",
      label: "هنرجویان",
      desc:
        stats.activeClients > 0
          ? `${stats.activeClients.toLocaleString("fa-IR")} هنرجوی فعال`
          : "لیست هنرجویان",
      icon: Users,
    },
    {
      href: "/coach/plans",
      label: "برنامه‌ها",
      desc:
        stats.draftPlans + stats.publishedPlans > 0
          ? `${(stats.draftPlans + stats.publishedPlans).toLocaleString("fa-IR")} برنامه`
          : "پیش‌نویس و منتشرشده",
      icon: FileText,
    },
  ];

  const showEmpty = !loading && (coachMissing || !hasAnyData);

  return (
    <div className="space-y-6 sm:space-y-7 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              سلام، {firstName}
            </h1>
            <Sparkles className="w-5 h-5 text-primary hidden sm:block" />
          </div>
          <p className="text-sm text-muted-foreground">
            پنل مربی سپندتن — مرکز مدیریت هنرجو و برنامه
          </p>
        </div>

        <motion.div
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          className="shrink-0 w-full sm:w-auto"
        >
          <Button
            asChild
            className={cn(
              "gap-2 h-11 px-5 font-semibold w-full sm:w-auto",
              "shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25",
              "dark:shadow-none dark:hover:shadow-lg dark:hover:shadow-primary/30",
            )}
          >
            <Link href="/coach/plans/new">
              <Plus className="w-4 h-4" />
              ساخت برنامه جدید
            </Link>
          </Button>
        </motion.div>
      </div>

      {showEmpty ? (
        <CoachEmptyState type="dashboard" />
      ) : (
        <>
          <StatsCards stats={stats} loading={loading} />

          {!loading && (
            <section className="space-y-3">
              <SectionHeading>دسترسی سریع</SectionHeading>
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                {quickActions.map((action, index) => (
                  <motion.div
                    key={action.href}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                      delay: index * 0.05,
                    }}
                  >
                    <QuickActionCard action={action} />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {!loading && pendingRequests.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <SectionHeading className="mb-0">
                    نیاز به اقدام
                  </SectionHeading>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] h-5 border",
                      "bg-amber-500/10 text-amber-700 border-amber-500/25",
                      "dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25",
                    )}
                  >
                    {pendingRequests.length.toLocaleString("fa-IR")} درخواست
                  </Badge>
                </div>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="gap-1 hover:bg-accent text-muted-foreground hover:text-foreground"
                >
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
                    onChanged={loadData}
                  />
                ))}
              </div>
            </section>
          )}

          {!loading &&
            stats.activeClients > 0 &&
            stats.publishedPlans === 0 &&
            stats.draftPlans === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <Card
                  className={cn(
                    "rounded-2xl overflow-hidden",
                    "bg-primary/5 border-primary/20 shadow-sm shadow-primary/10",
                    "dark:bg-primary/5 dark:border-primary/20 dark:shadow-none",
                  )}
                >
                  <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm text-foreground">
                        هنرجو داری، برنامه نه
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        یک برنامه بساز و منتشر کن تا بتوانی از صفحه هنرجو اختصاص
                        بدهی.
                      </p>
                    </div>
                    <motion.div
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 22,
                      }}
                      className="shrink-0 w-full sm:w-auto"
                    >
                      <Button
                        asChild
                        size="sm"
                        className={cn(
                          "gap-1.5 w-full sm:w-auto",
                          "shadow-sm shadow-primary/20",
                          "dark:shadow-none",
                        )}
                      >
                        <Link href="/coach/plans/new">
                          <Plus className="w-4 h-4" />
                          ساخت برنامه
                        </Link>
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
        </>
      )}
    </div>
  );
}

function SectionHeading({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "text-sm font-semibold text-muted-foreground px-0.5",
        className,
      )}
    >
      {children}
    </h2>
  );
}

function QuickActionCard({
  action,
}: {
  action: {
    href: string;
    label: string;
    desc: string;
    icon: React.ElementType;
    badge?: number;
  };
}) {
  const Icon = action.icon;

  return (
    <Link href={action.href} className="group block h-full">
      <Card
        className={cn(
          "relative h-full rounded-2xl overflow-hidden transition-all duration-300",
          "bg-card border-border shadow-sm shadow-foreground/4",
          "hover:border-primary/40 hover:shadow-md hover:shadow-primary/10",
          "hover:-translate-y-0.5",
          "dark:bg-card/60 dark:border-white/10 dark:backdrop-blur-md",
          "dark:shadow-none dark:hover:border-primary/40",
          "dark:hover:bg-white/5",
        )}
      >
        <span
          className={cn(
            "absolute top-3 left-3",
            "opacity-0 -translate-x-1 transition-all duration-300",
            "group-hover:opacity-100 group-hover:translate-x-0",
            "text-primary",
          )}
          aria-hidden
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
        </span>

        <CardContent className="p-3.5 sm:p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
                "bg-primary/10 text-primary ring-1 ring-primary/20",
                "dark:bg-primary/15 dark:ring-primary/20",
              )}
            >
              <Icon className="w-4.5 h-4.5" />
            </div>

            {action.badge != null && (
              <Badge
                className={cn(
                  "h-5 min-w-5 px-1.5 text-[10px] border",
                  "bg-amber-500/10 text-amber-700 border-amber-500/25",
                  "dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/25",
                )}
              >
                {action.badge.toLocaleString("fa-IR")}
              </Badge>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {action.label}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-snug">
              {action.desc}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
