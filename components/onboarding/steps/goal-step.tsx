"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  //   ChevronLeft,
  ChevronRight,
  Scale,
  Flame,
  Heart,
  Zap,
  Target,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Goal } from "@/lib/store/user-store";

const goalSchema = z.object({
  goal: z.enum(
    ["lose_weight", "build_muscle", "maintain", "endurance", "general_fitness"],
    { required_error: "هدف خود را انتخاب کنید" },
  ),
});

type GoalFormValues = z.infer<typeof goalSchema>;

const options = [
  {
    value: "lose_weight" as const,
    label: "کاهش وزن",
    desc: "چربی‌سوزی و لاغری",
    icon: Scale,
  },
  {
    value: "build_muscle" as const,
    label: "افزایش عضله",
    desc: "هایپرتروفی و حجم",
    icon: Flame,
  },
  {
    value: "maintain" as const,
    label: "حفظ تناسب",
    desc: "نگه داشتن فرم فعلی",
    icon: Heart,
  },
  {
    value: "endurance" as const,
    label: "استقامت",
    desc: "قلب و عروق قوی‌تر",
    icon: Zap,
  },
  {
    value: "general_fitness" as const,
    label: "آمادگی عمومی",
    desc: "سلامت کلی بدن",
    icon: Target,
  },
];

type GoalStepProps = {
  defaultValue?: Goal;
  onNext: (goal: Goal) => void;
  onBack: () => void;
};

export function GoalStep({ defaultValue, onNext, onBack }: GoalStepProps) {
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      goal: defaultValue,
    },
  });

  const onSubmit = (data: GoalFormValues) => {
    onNext(data.goal);
  };

  return (
    <Card className="border-border bg-card/90 dark:bg-card/80 backdrop-blur-md shadow-xl">
      <CardHeader className="text-center space-y-2 pb-4">
        <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
          هدف اصلی‌ات چیه؟
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          برنامه بر اساس هدف تو ساخته می‌شه
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-3">
            {options.map((item) => {
              const Icon = item.icon;
              const selected = form.watch("goal") === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    form.setValue("goal", item.value, { shouldValidate: true })
                  }
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-2xl border text-right transition-all",
                    selected
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-background hover:bg-muted",
                  )}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p
                      className={cn(
                        "font-semibold",
                        selected ? "text-primary" : "text-foreground",
                      )}
                    >
                      {item.label}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                  {selected && (
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {form.formState.errors.goal && (
            <p className="text-sm text-destructive text-center">
              {form.formState.errors.goal.message}
            </p>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1"
              onClick={onBack}
            >
              <ChevronRight className="w-4 h-4" />
              قبلی
            </Button>
            <Button type="submit" className="h-11 flex-1">
              ساخت برنامه
              <Flame className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
