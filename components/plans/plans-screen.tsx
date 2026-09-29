"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useActivePlan } from "@/hooks/use-active-plan";
import { useUserPlanAccesses } from "@/hooks/use-user-plan-accesses";
import { activatePlanAccess } from "@/lib/api/access";
import { useUserStore } from "@/lib/store/user-store";
import type { PlanAccess } from "@/lib/types/access";
import { cn } from "@/lib/utils";

import { ActivePlanCard } from "./active-plan-card";
import { PlanAccessCard } from "./plan-access-card";
import { PlansTabs, type PlansTab } from "./plans-tabs";
import { PlansEmptyState } from "./plans-empty-state";
import { ConfirmSwitchSheet } from "./confirm-switch-sheet";
import { PlanAccessCardSkeleton } from "./plan-access-card-skeleton";

type Props = {
  className?: string;
  /**
   * When true, shows the inline refresh button above the tabs
   * (useful if the parent page has no header action).
   */
  showRefresh?: boolean;
};

export function PlansScreen({ className, showRefresh = false }: Props) {
  const userId = useUserStore((s) => s.user?.id);
  const updateProfile = useUserStore((s) => s.updateProfile);

  const {
    activeAccess,
    isLoading: activeLoading,
    refetch: refetchActive,
  } = useActivePlan();

  const {
    accesses,
    activeAccesses,
    expiredAccesses,
    pendingAccesses,
    isLoading,
    error,
    refetch,
    isEmpty,
  } = useUserPlanAccesses();

  const [tab, setTab] = useState<PlansTab>("active");
  const [switchTarget, setSwitchTarget] = useState<PlanAccess | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const list = useMemo(() => {
    if (tab === "active") return [...activeAccesses, ...pendingAccesses];
    if (tab === "expired") return expiredAccesses;
    return accesses;
  }, [tab, activeAccesses, pendingAccesses, expiredAccesses, accesses]);

  const counts = useMemo(
    () => ({
      active: activeAccesses.length + pendingAccesses.length,
      all: accesses.length,
      expired: expiredAccesses.length,
    }),
    [
      activeAccesses.length,
      pendingAccesses.length,
      accesses.length,
      expiredAccesses.length,
    ],
  );

  const loading = isLoading || activeLoading;

  // Graceful tab fallback if the current tab empties out after an action
  useEffect(() => {
    if (loading || error || isEmpty) return;
    if (list.length === 0 && tab !== "all") {
      const fallback: PlansTab | null =
        counts.active > 0 ? "active" : counts.all > 0 ? "all" : null;
      if (fallback && fallback !== tab) setTab(fallback);
    }
  }, [loading, error, isEmpty, list.length, tab, counts]);

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await Promise.all([refetch(), refetchActive()]);
    } finally {
      setIsRefreshing(false);
    }
  }

  async function activateAccess(access: PlanAccess) {
    if (!userId) return;
    setActivatingId(access.id);
    try {
      const updated = await activatePlanAccess(access.id, userId);
      updateProfile({ currentPlanId: updated.planId });
      toast.success("برنامه با موفقیت فعال شد");
      await Promise.all([refetch(), refetchActive()]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در فعال‌سازی");
    } finally {
      setActivatingId(null);
    }
  }

  function handleActivate(access: PlanAccess) {
    if (activeAccess && activeAccess.id !== access.id) {
      setSwitchTarget(access);
      return;
    }
    void activateAccess(access);
  }

  function handleSwitch(access: PlanAccess) {
    setSwitchTarget(access);
  }

  async function confirmSwitch() {
    if (!userId || !switchTarget) return;
    setIsSwitching(true);
    try {
      const updated = await activatePlanAccess(switchTarget.id, userId);
      updateProfile({ currentPlanId: updated.planId });
      toast.success("برنامه فعال تغییر کرد");
      setSwitchTarget(null);
      await Promise.all([refetch(), refetchActive()]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در تغییر برنامه");
    } finally {
      setIsSwitching(false);
    }
  }

  return (
    <div className={cn("space-y-5", className)}>
      {/* Optional inline refresh (only if parent has no header action) */}
      {showRefresh && (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            aria-label="به‌روزرسانی"
          >
            <RefreshCw
              className={cn("size-4", isRefreshing && "animate-spin")}
            />
            به‌روزرسانی
          </Button>
        </div>
      )}

      {/* Active highlight */}
      {activeAccess && !activeLoading && (
        <section aria-label="برنامه فعال">
          <ActivePlanCard access={activeAccess} />
        </section>
      )}

      {/* Tabs */}
      <PlansTabs value={tab} onChange={setTab} counts={counts} />

      {/* Error */}
      {!loading && error && (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-center"
        >
          <AlertCircle className="size-5 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            تلاش مجدد
          </Button>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          aria-busy="true"
          aria-live="polite"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <PlanAccessCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Global empty */}
      {!loading && !error && isEmpty && <PlansEmptyState />}

      {/* Tab-specific empty */}
      {!loading && !error && !isEmpty && list.length === 0 && (
        <PlansEmptyState
          title={
            tab === "expired"
              ? "برنامه منقضی‌شده‌ای نداری"
              : tab === "active"
                ? "برنامه فعالی نداری"
                : "موردی یافت نشد"
          }
          description={
            tab === "active"
              ? "برای شروع، یک برنامه انتخاب کن یا منتظر فعال‌سازی بمان."
              : tab === "expired"
                ? "برنامه‌های منقضی‌شده‌ات اینجا نمایش داده می‌شوند."
                : "در این بخش چیزی برای نمایش نیست."
          }
          showCta={tab !== "expired"}
        />
      )}

      {/* List */}
      {!loading && !error && list.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((access) => (
            <PlanAccessCard
              key={access.id}
              access={access}
              onActivate={handleActivate}
              onSwitch={handleSwitch}
              isActivating={activatingId === access.id}
            />
          ))}
        </div>
      )}

      <ConfirmSwitchSheet
        open={!!switchTarget}
        onOpenChange={(open) => {
          if (!open) setSwitchTarget(null);
        }}
        currentAccess={activeAccess}
        nextAccess={switchTarget}
        onConfirm={confirmSwitch}
        isLoading={isSwitching}
      />
    </div>
  );
}
