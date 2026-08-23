"use client";

import { useEffect, useRef } from "react";
import { useUserStore } from "@/lib/store/user-store";
import { addWeightLog, getWeightLogs } from "@/lib/api/logs";

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * اگر کاربر وزن اولیه دارد ولی هیچ weightLog ندارد،
 * یک log شروع برایش می‌سازد.
 */
export function useSeedStartWeight(onSeeded?: () => void) {
  const user = useUserStore((s) => s.user);
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    if (!user?.id || !user.bodyInfo?.weight) return;

    didRun.current = true;

    (async () => {
      try {
        const existing = await getWeightLogs(user.id);
        if (existing.length > 0) return;

        await addWeightLog({
          userId: user.id,
          weight: user.bodyInfo!.weight,
          date: todayKey(),
          note: "وزن شروع",
        });

        onSeeded?.();
      } catch (e) {
        console.error("seed start weight failed", e);
      }
    })();
  }, [user?.id, user?.bodyInfo?.weight, onSeeded]);
}
