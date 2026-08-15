"use client";

import { useEffect, useState } from "react";
import { Download, Share, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "sepandtan-pwa-installed";
const DISMISS_KEY = "sepandtan-pwa-dismissed";
const DISMISS_DAYS = 14;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallPromptProps = {
  className?: string;
  variant?: "banner" | "footer" | "button";
};

function checkStandalone() {
  if (typeof window === "undefined") return false;
  const displayStandalone = window.matchMedia(
    "(display-mode: standalone)",
  ).matches;
  // @ts-expect-error iOS Safari
  const iosStandalone = window.navigator.standalone === true;
  return displayStandalone || iosStandalone;
}

function checkIOS() {
  if (typeof window === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function markInstalled() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

function wasInstalledBefore() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function wasDismissedRecently() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const days = (Date.now() - Number(raw)) / (1000 * 60 * 60 * 24);
    return days < DISMISS_DAYS;
  } catch {
    return false;
  }
}

export function InstallPrompt({
  className,
  variant = "banner",
}: InstallPromptProps) {
  const [mounted, setMounted] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [isIOS, setIsIOS] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    // نصب‌شده → مخفی
    if (checkStandalone() || wasInstalledBefore()) {
      markInstalled();
      setHidden(true);
      return;
    }

    // فقط برای بنر شناور dismiss معنی دارد
    if (variant === "banner" && wasDismissedRecently()) {
      setHidden(true);
      return;
    }

    setHidden(false);
    setIsIOS(checkIOS());

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      markInstalled();
      setDeferred(null);
      setHidden(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [variant]);

  if (!mounted || hidden) return null;

  const handleInstall = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") {
        markInstalled();
        setHidden(true);
      }
    } catch {
      /* کاربر لغو کرد */
    }
  };

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setHidden(true);
  };

  // ---------- FOOTER ----------
  if (variant === "footer") {
    return (
      <div className={cn("space-y-3", className)}>
        {deferred ? (
          <Button
            type="button"
            onClick={handleInstall}
            className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 w-full sm:w-auto h-auto py-2.5 px-4 gap-2"
          >
            <Download className="h-5 w-5" />
            <div className="text-right">
              <div className="text-xs text-gray-400">نصب سریع</div>
              <div className="font-semibold">اپلیکیشن وب</div>
            </div>
          </Button>
        ) : isIOS ? (
          <div className="flex items-start gap-2 text-sm text-gray-300">
            <Share className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              در Safari از Share گزینه{" "}
              <span className="text-white font-medium">Add to Home Screen</span>{" "}
              را بزن.
            </span>
          </div>
        ) : (
          <div className="flex items-start gap-2 text-sm text-gray-300">
            <Smartphone className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              از منوی مرورگر گزینه{" "}
              <span className="text-white font-medium">Install app</span> / نصب
              برنامه را انتخاب کن.
            </span>
          </div>
        )}
      </div>
    );
  }

  // ---------- BUTTON ----------
  if (variant === "button") {
    if (deferred) {
      return (
        <Button
          type="button"
          onClick={handleInstall}
          className={cn("gap-2", className)}
        >
          <Download className="w-4 h-4" />
          نصب اپلیکیشن
        </Button>
      );
    }
    return null;
  }

  // ---------- BANNER ----------
  return (
    <div
      role="dialog"
      aria-label="نصب سپندتن"
      className={cn(
        "fixed bottom-4 left-4 right-4 z-9999 mx-auto max-w-md",
        "rounded-2xl border border-border bg-card/95 backdrop-blur-md p-4 shadow-2xl",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 text-right space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {isIOS
              ? "سپندتن را به صفحه اصلی اضافه کن"
              : "سپندتن را روی گوشی داشته باش"}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isIOS
              ? "از دکمه Share در Safari، گزینه Add to Home Screen را انتخاب کن."
              : deferred
                ? "نصب سریع؛ ورود سریع به تمرین و رژیم روزانه."
                : "از منوی مرورگر، گزینه Install app را بزن تا مثل یک اپ باز شود."}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={dismiss}
          aria-label="بستن"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="mt-3 space-y-2">
        {deferred ? (
          <Button
            type="button"
            className="w-full h-10 gap-2"
            onClick={handleInstall}
          >
            <Download className="w-4 h-4" />
            نصب اپلیکیشن
          </Button>
        ) : isIOS ? (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            <Share className="w-3.5 h-3.5" />
            Share → Add to Home Screen
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            <Smartphone className="w-3.5 h-3.5" />
            منوی مرورگر → Install app
          </div>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={dismiss}
        >
          الان نه
        </Button>
      </div>
    </div>
  );
}
