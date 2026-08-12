"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Dumbbell,
  Activity,
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
import type { Equipment } from "@/lib/store/user-store";

const equipmentSchema = z.object({
  equipment: z.enum(["home", "gym", "both"], {
    required_error: "امکانات تمرینی را انتخاب کنید",
  }),
});

type EquipmentFormValues = z.infer<typeof equipmentSchema>;

const options = [
  {
    value: "home" as const,
    label: "خانه",
    desc: "دمبل، کش، وزن بدن",
    icon: Home,
  },
  {
    value: "gym" as const,
    label: "باشگاه",
    desc: "دستگاه‌ها و وزنه‌های کامل",
    icon: Dumbbell,
  },
  {
    value: "both" as const,
    label: "هر دو",
    desc: "خانه + باشگاه",
    icon: Activity,
  },
];

type EquipmentStepProps = {
  defaultValue?: Equipment;
  onNext: (equipment: Equipment) => void;
  onBack: () => void;
};

export function EquipmentStep({
  defaultValue,
  onNext,
  onBack,
}: EquipmentStepProps) {
  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      equipment: defaultValue,
    },
  });

  const onSubmit = (data: EquipmentFormValues) => {
    onNext(data.equipment);
  };

  return (
    <Card className="border-border bg-card/90 dark:bg-card/80 backdrop-blur-md shadow-xl">
      <CardHeader className="text-center space-y-2 pb-4">
        <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
          امکانات تمرینی
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          کجا می‌خوای تمرین کنی؟
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-3">
            {options.map((item) => {
              const Icon = item.icon;
              const selected = form.watch("equipment") === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    form.setValue("equipment", item.value, {
                      shouldValidate: true,
                    })
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

          {form.formState.errors.equipment && (
            <p className="text-sm text-destructive text-center">
              {form.formState.errors.equipment.message}
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
              ادامه
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
