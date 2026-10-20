"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BodyInfo } from "@/lib/store/user-store";

const bodySchema = z.object({
  gender: z.enum(["male", "female"], {
    required_error: "جنسیت را انتخاب کنید",
  }),
  age: z.coerce
    .number({ invalid_type_error: "سن معتبر وارد کنید" })
    .min(14, "حداقل سن ۱۴ سال است")
    .max(80, "حداکثر سن ۸۰ سال است"),
  height: z.coerce
    .number({ invalid_type_error: "قد معتبر وارد کنید" })
    .min(120, "قد باید حداقل ۱۲۰ سانتی‌متر باشد")
    .max(230, "قد باید حداکثر ۲۳۰ سانتی‌متر باشد"),
  weight: z.coerce
    .number({ invalid_type_error: "وزن معتبر وارد کنید" })
    .min(30, "وزن باید حداقل ۳۰ کیلوگرم باشد")
    .max(250, "وزن باید حداکثر ۲۵۰ کیلوگرم باشد"),
  activityLevel: z.enum(
    ["sedentary", "light", "moderate", "active", "very_active"],
    { required_error: "سطح فعالیت را انتخاب کنید" },
  ),
});

type BodyFormValues = z.infer<typeof bodySchema>;

const activityOptions = [
  { value: "sedentary", label: "کم‌تحرک", desc: "نشسته بیشتر روز" },
  { value: "light", label: "سبک", desc: "ورزش ۱–۲ روز در هفته" },
  { value: "moderate", label: "متوسط", desc: "ورزش ۳–۴ روز در هفته" },
  { value: "active", label: "فعال", desc: "ورزش ۵–۶ روز در هفته" },
  {
    value: "very_active",
    label: "بسیار فعال",
    desc: "ورزش روزانه یا شغل فیزیکی",
  },
] as const;

type BodyStepProps = {
  defaultValues?: Partial<BodyInfo>;
  onNext: (data: BodyInfo) => void;
};

export function BodyStep({ defaultValues, onNext }: BodyStepProps) {
  const form = useForm<BodyFormValues>({
    resolver: zodResolver(bodySchema),
    defaultValues: {
      gender: defaultValues?.gender,
      age: defaultValues?.age,
      height: defaultValues?.height,
      weight: defaultValues?.weight,
      activityLevel: defaultValues?.activityLevel,
    },
  });

  const onSubmit = (data: BodyFormValues) => {
    onNext(data as BodyInfo);
  };

  return (
    <Card className="border-border bg-card/90 dark:bg-card/80 backdrop-blur-md shadow-xl">
      <CardHeader className="text-center space-y-2 pb-4">
        <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
          اطلاعات بدنی
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          این اطلاعات برای ساخت برنامه دقیق لازم است
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Gender */}
          <div className="space-y-3">
            <Label className="text-foreground">جنسیت</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "male", label: "مرد" },
                { value: "female", label: "زن" },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    form.setValue("gender", item.value as "male" | "female", {
                      shouldValidate: true,
                    })
                  }
                  className={cn(
                    "h-12 rounded-xl border text-sm font-medium transition-all",
                    form.watch("gender") === item.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background hover:bg-muted text-foreground",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {form.formState.errors.gender && (
              <p className="text-sm text-destructive">
                {form.formState.errors.gender.message}
              </p>
            )}
          </div>

          {/* Age / Height / Weight */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">سن</Label>
              <Input
                id="age"
                type="number"
                placeholder="۲۵"
                className="h-11"
                {...form.register("age")}
              />
              {form.formState.errors.age && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.age.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">قد (سانتی‌متر)</Label>
              <Input
                id="height"
                type="number"
                placeholder="۱۷۵"
                className="h-11"
                {...form.register("height")}
              />
              {form.formState.errors.height && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.height.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">وزن (کیلوگرم)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="۷۰"
                className="h-11"
                {...form.register("weight")}
              />
              {form.formState.errors.weight && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.weight.message}
                </p>
              )}
            </div>
          </div>

          {/* Activity Level */}
          <div className="space-y-3">
            <Label>سطح فعالیت فعلی</Label>
            <div className="space-y-2">
              {activityOptions.map((item) => {
                const selected = form.watch("activityLevel") === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() =>
                      form.setValue("activityLevel", item.value, {
                        shouldValidate: true,
                      })
                    }
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all text-right",
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background hover:bg-muted text-foreground",
                    )}
                  >
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
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
            {form.formState.errors.activityLevel && (
              <p className="text-sm text-destructive">
                {form.formState.errors.activityLevel.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full h-11 text-base">
            ادامه
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
