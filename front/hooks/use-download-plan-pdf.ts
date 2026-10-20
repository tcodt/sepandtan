"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { Plan } from "@/lib/types/plan";
import type { PlanAccess } from "@/lib/types/access";
import { downloadPlanPdf } from "@/lib/pdf/download-plan-pdf";
import { useUserStore } from "@/lib/store/user-store";

/**
 * فقط وقتی Access فعال است اجازه دانلود می‌دهد.
 * plan را از بیرون پاس بده (از plan-store یا fetch).
 */
export function useDownloadPlanPdf() {
  const user = useUserStore((s) => s.user);
  const [isDownloading, setIsDownloading] = useState(false);

  const download = useCallback(
    async (plan: Plan | null | undefined, access?: PlanAccess | null) => {
      if (!plan) {
        toast.error("برنامه برای دانلود آماده نیست");
        return;
      }

      if (access && access.status !== "active") {
        toast.error("دانلود PDF فقط برای برنامه فعال مجاز است");
        return;
      }

      setIsDownloading(true);
      try {
        await downloadPlanPdf({
          plan,
          access,
          userName: user?.name,
        });
        toast.success("دانلود PDF شروع شد");
      } catch (e) {
        console.error(e);
        toast.error(e instanceof Error ? e.message : "خطا در ساخت فایل PDF");
      } finally {
        setIsDownloading(false);
      }
    },
    [user?.name],
  );

  return { download, isDownloading };
}
