"use client";

import { useState } from "react";
import { Scale, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserPlan } from "@/hooks/use-user-plan";
import { addWeightLog, getWeightLogs } from "@/lib/api/logs";
import { useUserStore } from "@/lib/store/user-store";
import { updateUser } from "@/lib/api/users";

type Props = {
  onLogged?: () => void;
};

export function WeightLogCard({ onLogged }: Props) {
  const { user } = useUserPlan();
  const updateProfile = useUserStore((s) => s.updateProfile);

  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error("ابتدا وارد شو");
      return;
    }

    const value = Number(String(weight).replace(",", "."));
    if (!value || value < 30 || value > 300) {
      toast.error("وزن معتبر وارد کن (مثلاً ۷۸.۵)");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        userId: user.id,
        weight: value,
        date: new Date().toISOString().split("T")[0],
      };

      console.log("ADD WEIGHT payload", payload);

      const saved = await addWeightLog(payload);
      console.log("ADD WEIGHT response", saved);

      // همگام‌سازی user روی API
      if (user.bodyInfo) {
        await updateUser(user.id, {
          bodyInfo: {
            ...user.bodyInfo,
            weight: value,
          },
        });

        updateProfile({
          bodyInfo: {
            ...user.bodyInfo,
            weight: value,
          },
        });
      }

      // خواندن دوباره برای اطمینان
      const all = await getWeightLogs(user.id);

      if (!all.length) {
        toast.error("وزن ذخیره شد ولی هنگام خواندن خالی برگشت");
      } else {
        toast.success("وزن ثبت شد");
      }

      setWeight("");
      onLogged?.();
    } catch (err) {
      console.error("ADD WEIGHT error", err);
      toast.error("ثبت وزن ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-border bg-muted/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Scale className="w-4 h-4 text-primary" />
          </div>
          <CardTitle className="text-base">ثبت وزن امروز</CardTitle>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="number"
            step="0.1"
            min={30}
            max={300}
            inputMode="decimal"
            placeholder="مثلاً ۷۸.۵"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={saving} className="shrink-0">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "ثبت"}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          بعد از ثبت، آمار و نمودار پیشرفت به‌روز می‌شود.
        </p>
      </CardContent>
    </Card>
  );
}
