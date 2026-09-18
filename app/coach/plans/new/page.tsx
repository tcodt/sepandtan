/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlanBuilderShell } from "@/components/coach/plan-builder/plan-builder-shell";
import {
  createCoachPlanDraft,
  updateCoachPlanDraft,
  publishCoachPlan,
} from "@/lib/api/coach-plans";
import { useUserStore } from "@/lib/store/user-store";
import { db } from "@/lib/api/db";
import { toast } from "sonner";
import type { Plan } from "@/lib/types/plan";

export default function NewPlanPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const [saving, setSaving] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);

  const handleSaveDraft = async (data: Partial<Plan>) => {
    if (!user?.id) return;
    setSaving(true);

    try {
      const coach = db.coaches.find((c) => c.userId === user.id);
      if (!coach) throw new Error("مربی پیدا نشد");

      if (!planId) {
        const created = await createCoachPlanDraft(coach.id, data);
        setPlanId(created.id);
        toast.success("پیش‌نویس ساخته شد");
        router.replace(`/coach/plans/${created.id}/edit`);
      } else {
        await updateCoachPlanDraft(planId, data);
        toast.success("ذخیره شد");
      }
    } catch (err: any) {
      toast.error(err.message || "خطا در ذخیره");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!planId) {
      toast.error("ابتدا برنامه را ذخیره کنید");
      return;
    }
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

  return (
    <PlanBuilderShell
      onSaveDraft={handleSaveDraft}
      onPublish={handlePublish}
      saving={saving}
    />
  );
}
