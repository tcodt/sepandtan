"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ArrowRight, User, LogOut, Shield, Info } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SettingsSection } from "./settings-section";
import { SettingsRow } from "./settings-row";
import { useSettingsStore } from "@/lib/store/settings-store";
import { useUserStore } from "@/lib/store/user-store";
import { cn } from "@/lib/utils";

export function SettingsScreen() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);

  const {
    notificationsEnabled,
    workoutReminders,
    mealReminders,
    weeklyReport,
    weightUnit,
    heightUnit,
    language,
    reduceMotion,
    setNotificationsEnabled,
    setWorkoutReminders,
    setMealReminders,
    setWeeklyReport,
    setWeightUnit,
    setHeightUnit,
    setLanguage,
    setReduceMotion,
  } = useSettingsStore();

  const handleLogout = () => {
    logout();
    toast.success("از حساب خارج شدی");
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" asChild className="gap-1.5 -mr-2">
            <Link href="/dashboard">
              <ArrowRight className="w-4 h-4" />
              داشبورد
            </Link>
          </Button>
          <h1 className="text-lg font-bold text-foreground">تنظیمات</h1>
          <div className="w-16" />
        </div>

        {/* حساب */}
        <SettingsSection title="حساب کاربری">
          <SettingsRow
            label={user?.name ?? "کاربر"}
            description={user?.email ?? user?.phone ?? "—"}
          >
            <Button asChild variant="outline" size="sm">
              <Link href="/account">
                <User className="w-3.5 h-3.5 ml-1" />
                پروفایل
              </Link>
            </Button>
          </SettingsRow>
        </SettingsSection>

        {/* ظاهر */}
        <SettingsSection title="ظاهر" description="تم و نمایش">
          <SettingsRow label="حالت تاریک">
            <div className="flex rounded-lg border border-border overflow-hidden">
              {[
                { value: "light", label: "روشن" },
                { value: "dark", label: "تاریک" },
                { value: "system", label: "سیستم" },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setTheme(item.value)}
                  className={cn(
                    "px-2.5 py-1.5 text-xs transition-colors",
                    theme === item.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </SettingsRow>

          <SettingsRow
            label="کاهش انیمیشن"
            description="برای تمرکز بیشتر و صرفه‌جویی باتری"
          >
            <Switch checked={reduceMotion} onCheckedChange={setReduceMotion} />
          </SettingsRow>
        </SettingsSection>

        {/* اعلان‌ها */}
        <SettingsSection title="اعلان‌ها" description="یادآوری‌های اپ">
          <SettingsRow label="فعال‌سازی اعلان‌ها">
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={(v) => {
                setNotificationsEnabled(v);
                toast.success(v ? "اعلان‌ها فعال شد" : "اعلان‌ها خاموش شد");
              }}
            />
          </SettingsRow>

          <SettingsRow
            label="یادآوری تمرین"
            description="قبل از زمان تمرین امروز"
          >
            <Switch
              checked={workoutReminders}
              onCheckedChange={setWorkoutReminders}
              disabled={!notificationsEnabled}
            />
          </SettingsRow>

          <SettingsRow
            label="یادآوری وعده"
            description="برای ثبت وعده‌های غذایی"
          >
            <Switch
              checked={mealReminders}
              onCheckedChange={setMealReminders}
              disabled={!notificationsEnabled}
            />
          </SettingsRow>

          <SettingsRow label="گزارش هفتگی">
            <Switch
              checked={weeklyReport}
              onCheckedChange={setWeeklyReport}
              disabled={!notificationsEnabled}
            />
          </SettingsRow>
        </SettingsSection>

        {/* واحدها */}
        <SettingsSection title="واحدها">
          <SettingsRow label="واحد وزن">
            <div className="flex rounded-lg border border-border overflow-hidden">
              {(["kg", "lb"] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setWeightUnit(u)}
                  className={cn(
                    "px-3 py-1.5 text-xs uppercase transition-colors",
                    weightUnit === u
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground",
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
          </SettingsRow>

          <SettingsRow label="واحد قد">
            <div className="flex rounded-lg border border-border overflow-hidden">
              {(["cm", "ft"] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setHeightUnit(u)}
                  className={cn(
                    "px-3 py-1.5 text-xs uppercase transition-colors",
                    heightUnit === u
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground",
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
          </SettingsRow>
        </SettingsSection>

        {/* زبان */}
        <SettingsSection title="زبان">
          <SettingsRow label="زبان اپ">
            <div className="flex rounded-lg border border-border overflow-hidden">
              {(
                [
                  { value: "fa", label: "فارسی" },
                  { value: "en", label: "English" },
                ] as const
              ).map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setLanguage(item.value);
                    toast.success(
                      item.value === "fa"
                        ? "زبان روی فارسی تنظیم شد"
                        : "Language set to English",
                    );
                  }}
                  className={cn(
                    "px-3 py-1.5 text-xs transition-colors",
                    language === item.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </SettingsRow>
        </SettingsSection>

        {/* لینک‌های مفید */}
        <SettingsSection title="بیشتر">
          <Link
            href="/about"
            className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/40 transition-colors"
          >
            <span className="text-sm text-foreground flex items-center gap-2">
              <Info className="w-4 h-4 text-muted-foreground" />
              درباره سپندتن
            </span>
          </Link>
          <Link
            href="/contact"
            className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/40 transition-colors"
          >
            <span className="text-sm text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              پشتیبانی و تماس
            </span>
          </Link>
        </SettingsSection>

        {/* خروج */}
        <Button
          variant="destructive"
          className="w-full h-11 gap-2"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          خروج از حساب
        </Button>

        <p className="text-center text-[11px] text-muted-foreground pb-4">
          سپندتن · نسخه آزمایشی
        </p>
      </div>
    </div>
  );
}
