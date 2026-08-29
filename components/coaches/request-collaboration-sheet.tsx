"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/lib/store/user-store";
import { createCollaborationRequest } from "@/lib/api/coaches";
import type { Coach } from "@/lib/types/coach";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coach: Coach;
};

const GOALS = [
  { id: "lose_weight", label: "کاهش وزن" },
  { id: "build_muscle", label: "عضله‌سازی" },
  { id: "general_fitness", label: "آمادگی عمومی" },
  { id: "endurance", label: "استقامت / دویدن" },
  { id: "nutrition", label: "تغذیه و رژیم" },
  { id: "other", label: "سایر" },
] as const;

const MAX_MESSAGE = 400;

export function RequestCollaborationSheet({
  open,
  onOpenChange,
  coach,
}: Props) {
  const user = useUserStore((s) => s.user);

  const [goal, setGoal] = useState<string>("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit =
    !!user?.id && goal.length > 0 && message.trim().length >= 10 && !submitting;

  const reset = () => {
    setGoal("");
    setMessage("");
    setSubmitting(false);
    setSubmitted(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      // کمی تأخیر تا انیمیشن بسته شدن تمام شود
      setTimeout(reset, 200);
    }
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    if (!canSubmit || !user?.id) return;

    setSubmitting(true);
    try {
      await createCollaborationRequest({
        userId: user.id,
        coachId: coach.id,
        goal,
        message: message.trim(),
      });

      setSubmitted(true);
      toast.success("درخواستت ثبت شد", {
        description: `${coach.name} به‌زودی پاسخ می‌دهد.`,
      });

      // بعد از نمایش موفقیت، Sheet را ببند
      setTimeout(() => {
        handleOpenChange(false);
      }, 1200);
    } catch (e) {
      console.error(e);
      toast.error("ثبت درخواست ناموفق بود", {
        description: "json-server را چک کن یا دوباره تلاش کن.",
      });
      setSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="max-w-lg mx-auto max-h-[92vh]">
        <DrawerHeader className="text-right pb-2">
          <DrawerTitle className="text-lg">
            درخواست همکاری با {coach.name}
          </DrawerTitle>
          <DrawerDescription className="text-sm">
            هدفت را مشخص کن و یک پیام کوتاه بنویس. مربی درخواستت را می‌بیند.
          </DrawerDescription>
        </DrawerHeader>

        {submitted ? (
          <div className="px-4 py-10 text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/15 text-primary flex items-center justify-center">
              <Send className="w-6 h-6" />
            </div>
            <p className="text-base font-semibold text-foreground">
              درخواستت ثبت شد
            </p>
            <p className="text-sm text-muted-foreground">
              {coach.name} به‌زودی بررسی می‌کند.
            </p>
          </div>
        ) : (
          <div className="px-4 space-y-5 overflow-y-auto pb-2">
            {/* Goal */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">هدف اصلی‌ات چیه؟</Label>
              <div className="flex flex-wrap gap-2">
                {GOALS.map((g) => {
                  const active = goal === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGoal(g.id)}
                      className={cn(
                        "rounded-full px-3.5 py-2 text-xs sm:text-sm border transition-all min-h-[40px]",
                        active
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-card/80 border-border text-foreground hover:bg-muted/80",
                      )}
                    >
                      {g.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="collab-message" className="text-sm font-medium">
                  پیامت به مربی
                </Label>
                <span
                  className={cn(
                    "text-[11px] tabular-nums",
                    message.length > MAX_MESSAGE
                      ? "text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  {message.length.toLocaleString("fa-IR")} /{" "}
                  {MAX_MESSAGE.toLocaleString("fa-IR")}
                </span>
              </div>
              <textarea
                id="collab-message"
                value={message}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_MESSAGE) {
                    setMessage(e.target.value);
                  }
                }}
                placeholder="مثلاً: می‌خوام در ۸ هفته حدود ۵ کیلو کم کنم و برنامه‌ام خانگی باشه..."
                rows={4}
                className={cn(
                  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm",
                  "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                  "resize-none min-h-[100px]",
                )}
                maxLength={MAX_MESSAGE}
              />
              <p className="text-[11px] text-muted-foreground">
                حداقل ۱۰ کاراکتر بنویس تا مربی بهتر راهنمایی‌ات کند.
              </p>
            </div>
          </div>
        )}

        {!submitted && (
          <DrawerFooter className="gap-2 pt-2">
            <Button
              type="button"
              size="lg"
              className="w-full h-12 text-base font-semibold gap-2"
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  در حال ارسال...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  ارسال درخواست
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full h-10"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              انصراف
            </Button>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
