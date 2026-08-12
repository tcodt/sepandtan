"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useUserStore,
  type BodyInfo,
  type Equipment,
  type Goal,
} from "@/lib/store/user-store";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  name: z.string().min(2, "نام باید حداقل ۲ کاراکتر باشد"),
  gender: z.enum(["male", "female"]),
  age: z.coerce.number().min(14, "حداقل ۱۴").max(80, "حداکثر ۸۰"),
  height: z.coerce.number().min(120).max(230),
  weight: z.coerce.number().min(30).max(250),
  activityLevel: z.enum([
    "sedentary",
    "light",
    "moderate",
    "active",
    "very_active",
  ]),
  equipment: z.enum(["home", "gym", "both"]),
  goal: z.enum([
    "lose_weight",
    "build_muscle",
    "maintain",
    "endurance",
    "general_fitness",
  ]),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const activityOptions = [
  { value: "sedentary", label: "کم‌تحرک" },
  { value: "light", label: "سبک" },
  { value: "moderate", label: "متوسط" },
  { value: "active", label: "فعال" },
  { value: "very_active", label: "بسیار فعال" },
] as const;

const equipmentOptions = [
  { value: "home", label: "خانه" },
  { value: "gym", label: "باشگاه" },
  { value: "both", label: "هر دو" },
] as const;

const goalOptions = [
  { value: "lose_weight", label: "کاهش وزن" },
  { value: "build_muscle", label: "افزایش عضله" },
  { value: "maintain", label: "حفظ تناسب" },
  { value: "endurance", label: "استقامت" },
  { value: "general_fitness", label: "آمادگی عمومی" },
] as const;

export function ProfileForm() {
  const user = useUserStore((s) => s.user);
  const updateProfile = useUserStore((s) => s.updateProfile);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? "",
      gender: user?.bodyInfo?.gender ?? "male",
      age: user?.bodyInfo?.age ?? 25,
      height: user?.bodyInfo?.height ?? 175,
      weight: user?.bodyInfo?.weight ?? 70,
      activityLevel: user?.bodyInfo?.activityLevel ?? "moderate",
      equipment: user?.equipment ?? "home",
      goal: user?.goal ?? "general_fitness",
    },
  });

  // همگام‌سازی وقتی user از persist لود شد
  useEffect(() => {
    if (!user) return;
    form.reset({
      name: user.name ?? "",
      gender: user.bodyInfo?.gender ?? "male",
      age: user.bodyInfo?.age ?? 25,
      height: user.bodyInfo?.height ?? 175,
      weight: user.bodyInfo?.weight ?? 70,
      activityLevel: user.bodyInfo?.activityLevel ?? "moderate",
      equipment: user.equipment ?? "home",
      goal: user.goal ?? "general_fitness",
    });
  }, [user, form]);

  const onSubmit = (data: ProfileFormValues) => {
    const bodyInfo: BodyInfo = {
      gender: data.gender,
      age: data.age,
      height: data.height,
      weight: data.weight,
      activityLevel: data.activityLevel,
    };

    updateProfile({
      name: data.name,
      bodyInfo,
      equipment: data.equipment as Equipment,
      goal: data.goal as Goal,
    });

    toast.success("پروفایل با موفقیت ذخیره شد");
  };

  const selected = {
    gender: form.watch("gender"),
    activityLevel: form.watch("activityLevel"),
    equipment: form.watch("equipment"),
    goal: form.watch("goal"),
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* نام */}
      <div className="space-y-2">
        <Label htmlFor="name">نام و نام خانوادگی</Label>
        <Input id="name" className="h-11" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      {/* تماس (فقط نمایش) */}
      <div className="space-y-2">
        <Label>ایمیل / موبایل</Label>
        <Input
          className="h-11 bg-muted/50"
          value={user?.email || user?.phone || ""}
          disabled
          dir={user?.email ? "ltr" : "rtl"}
        />
        <p className="text-[11px] text-muted-foreground">
          برای تغییر ایمیل یا موبایل فعلاً با پشتیبانی تماس بگیر
        </p>
      </div>

      {/* جنسیت */}
      <div className="space-y-2">
        <Label>جنسیت</Label>
        <div className="grid grid-cols-2 gap-2">
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
                "h-11 rounded-xl border text-sm font-medium transition-all",
                selected.gender === item.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background hover:bg-muted",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* سن / قد / وزن */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="age">سن</Label>
          <Input
            id="age"
            type="number"
            className="h-11"
            {...form.register("age")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="height">قد (cm)</Label>
          <Input
            id="height"
            type="number"
            className="h-11"
            {...form.register("height")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight">وزن (kg)</Label>
          <Input
            id="weight"
            type="number"
            className="h-11"
            {...form.register("weight")}
          />
        </div>
      </div>
      {(form.formState.errors.age ||
        form.formState.errors.height ||
        form.formState.errors.weight) && (
        <p className="text-sm text-destructive">مقادیر بدنی را درست وارد کن</p>
      )}

      {/* سطح فعالیت */}
      <div className="space-y-2">
        <Label>سطح فعالیت</Label>
        <div className="grid grid-cols-1 gap-2">
          {activityOptions.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() =>
                form.setValue("activityLevel", item.value, {
                  shouldValidate: true,
                })
              }
              className={cn(
                "h-11 rounded-xl border text-sm px-4 text-right transition-all",
                selected.activityLevel === item.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background hover:bg-muted",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* امکانات */}
      <div className="space-y-2">
        <Label>امکانات تمرینی</Label>
        <div className="grid grid-cols-3 gap-2">
          {equipmentOptions.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() =>
                form.setValue("equipment", item.value, { shouldValidate: true })
              }
              className={cn(
                "h-11 rounded-xl border text-sm font-medium transition-all",
                selected.equipment === item.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background hover:bg-muted",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* هدف */}
      <div className="space-y-2">
        <Label>هدف اصلی</Label>
        <div className="grid grid-cols-1 gap-2">
          {goalOptions.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() =>
                form.setValue("goal", item.value, { shouldValidate: true })
              }
              className={cn(
                "h-11 rounded-xl border text-sm px-4 text-right transition-all",
                selected.goal === item.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background hover:bg-muted",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-11 gap-2"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            در حال ذخیره...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            ذخیره تغییرات
          </>
        )}
      </Button>
    </form>
  );
}
