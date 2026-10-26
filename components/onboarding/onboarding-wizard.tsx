"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { GeneratingState } from "./generating-state";
import { BodyStep } from "./steps/body-step";
import { EquipmentStep } from "./steps/equipment-step";
import { GoalStep } from "./steps/goal-step";
import { ProgressHeader } from "./progress-header";
import {
  useUserStore,
  type BodyInfo,
  type Equipment,
  type Goal,
} from "@/lib/store/user-store";
import { generateAndSavePlan } from "@/lib/api/plans";
import { usePlanStore } from "@/lib/store/plan-store";
import { addWeightLog } from "@/lib/api/logs";
import { updateOnboardingProgress } from "@/lib/api/users";

export function OnboardingWizard() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);
  const updateOnboardingStep = useUserStore((s) => s.updateOnboardingStep);
  const setPlan = usePlanStore((s) => s.setPlan);

  // شروع از مرحله ذخیره‌شده کاربر
  const initialStep = Math.min(
    Math.max(user?.currentOnboardingStep ?? 1, 1),
    3,
  );

  const [step, setStep] = useState(initialStep);
  const [isGenerating, setIsGenerating] = useState(false);
  const [bodyInfo, setBodyInfo] = useState<BodyInfo | null>(
    user?.bodyInfo ?? null,
  );
  const [equipment, setEquipment] = useState<Equipment | null>(
    user?.equipment ?? null,
  );

  // همگام‌سازی step با store و API هر بار که تغییر می‌کند
  useEffect(() => {
    if (!user?.id) return;

    // فقط اگر step واقعاً تغییر کرده باشد
    if (user.currentOnboardingStep !== step) {
      updateOnboardingStep(step);
      // ذخیره در Fake API (برای آمادگی بک‌اند واقعی)
      updateOnboardingProgress(user.id, step).catch(console.error);
    }
  }, [step, user?.id, user?.currentOnboardingStep, updateOnboardingStep]);

  const handleBodyNext = (data: BodyInfo) => {
    setBodyInfo(data);
    setStep(2);
  };

  const handleEquipmentNext = (data: Equipment) => {
    setEquipment(data);
    setStep(3);
  };

  const handleGoalNext = async (goal: Goal) => {
    if (!bodyInfo || !equipment || !user?.id) {
      toast.error("اطلاعات کاربر ناقص است. دوباره وارد شو.");
      return;
    }

    setIsGenerating(true);

    try {
      const { plan } = await generateAndSavePlan({
        userId: user.id,
        bodyInfo,
        equipment,
        goal,
        targetWeight:
          goal === "lose_weight" && bodyInfo.weight > 0
            ? Math.round(bodyInfo.weight * 0.92)
            : undefined,
      });

      completeOnboarding({
        bodyInfo,
        equipment,
        goal,
        currentPlanId: plan.id,
        targetWeight:
          goal === "lose_weight" && bodyInfo.weight > 0
            ? Math.round(bodyInfo.weight * 0.92)
            : undefined,
      });

      setPlan(plan);

      toast.success("برنامه شخصی‌ات آماده شد!");

      if (bodyInfo?.weight) {
        try {
          await addWeightLog({
            userId: user.id,
            weight: bodyInfo.weight,
            date: plan.startDate ?? new Date().toISOString().slice(0, 10),
            note: "وزن شروع برنامه",
          });
          localStorage.setItem("sepandtan-welcome-seen", "0");
        } catch (e) {
          console.error("seed weight log failed", e);
        }
      }

      router.push("/welcome");
    } catch (err) {
      console.error(err);
      // هرگز currentPlanId جعلی ست نشود
      setIsGenerating(false);
      toast.error("ساخت برنامه ناموفق بود", {
        description: "لطفاً دوباره تلاش کن. برنامه ذخیره نشد.",
      });
    }
  };

  if (isGenerating) {
    return <GeneratingState />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ProgressHeader currentStep={step} />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25 }}
              >
                <BodyStep
                  defaultValues={bodyInfo ?? undefined}
                  onNext={handleBodyNext}
                />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25 }}
              >
                <EquipmentStep
                  defaultValue={equipment ?? undefined}
                  onNext={handleEquipmentNext}
                  onBack={() => setStep(1)}
                />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25 }}
              >
                <GoalStep onNext={handleGoalNext} onBack={() => setStep(2)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
