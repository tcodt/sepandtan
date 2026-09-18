/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PlanBuilderShell } from "@/components/coach/plan-builder/plan-builder-shell";
import {
  updateCoachPlanDraft,
  publishCoachPlan,
  getCoachPlans,
} from "@/lib/api/coach-plans";
import { useUserStore } from "@/lib/store/user-store";
import { db } from "@/lib/api/db";
import { toast } from "sonner";
import type { Plan } from "@/lib/types/plan";

export default function EditPlanPage() {
  const params = useParams();
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const planId = params.planId as string;

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user?.id) return;

      const coach = db.coaches.find((c) => c.userId === user.id);
      if (!coach) {
        router.replace("/coach/plans");
        return;
      }

      const plans = await getCoachPlans(coach.id);
      const found = plans.find((p) => p.id === planId) ?? null;

      if (!found) {
        toast.error("برنامه پیدا نشد");
        router.replace("/coach/plans");
        return;
      }

      if (found.status !== "draft") {
        toast.error("فقط پیش‌نویس قابل ویرایش است");
        router.replace("/coach/plans");
        return;
      }

      setPlan(found);
      setLoading(false);
    }

    load();
  }, [user?.id, planId, router]);

  const handleSaveDraft = async (data: Partial<Plan>) => {
    setSaving(true);
    try {
      await updateCoachPlanDraft(planId, data);
      toast.success("ذخیره شد");
    } catch (err: any) {
      toast.error(err.message || "خطا در ذخیره");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setSaving(true);
    try {
      await publishCoachPlan(planId);
      toast.success("برنامه منتشر شد");
      router.push("/coach/plans");
    } catch (err: any) {
      toast.error(err.message || "خطا در انتشار");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <PlanBuilderShell
      initialPlan={plan}
      onSaveDraft={handleSaveDraft}
      onPublish={handlePublish}
      saving={saving}
    />
  );
}
