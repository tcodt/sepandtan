"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/lib/store/user-store";
import { cn } from "@/lib/utils";

type LogoutDialogProps = {
  /** ظاهر دکمه تریگر */
  triggerClassName?: string;
  /** متن دکمه */
  triggerLabel?: string;
  /** اگر true فقط آیکون نشان بده */
  iconOnly?: boolean;
  /** برای استفاده داخل DropdownMenuItem و غیره */
  asChild?: boolean;
  children?: React.ReactNode;
};

export function LogoutDialog({
  triggerClassName,
  triggerLabel = "خروج",
  iconOnly = false,
  children,
}: LogoutDialogProps) {
  const router = useRouter();
  const logout = useUserStore((s) => s.logout);

  const handleConfirm = () => {
    logout();
    toast.success("با موفقیت خارج شدی");
    router.replace("/login");
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children ? (
          children
        ) : (
          <Button
            variant="ghost"
            size={iconOnly ? "icon" : "sm"}
            className={cn(
              "text-destructive hover:text-destructive hover:bg-destructive/10",
              triggerClassName,
            )}
          >
            <LogOut className="w-4 h-4" />
            {!iconOnly && triggerLabel}
          </Button>
        )}
      </AlertDialogTrigger>

      <AlertDialogContent className="max-w-sm rounded-2xl" dir="rtl">
        <AlertDialogHeader className="text-right sm:text-right">
          <AlertDialogTitle className="flex items-center gap-2 justify-start">
            <span className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center">
              <LogOut className="w-4 h-4 text-destructive" />
            </span>
            خروج از حساب؟
          </AlertDialogTitle>
          <AlertDialogDescription className="text-right leading-relaxed">
            مطمئنی می‌خوای خارج بشی؟ برای استفاده دوباره باید وارد حسابت شوی.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-row-reverse gap-2 sm:gap-2">
          <AlertDialogCancel className="mt-0 flex-1 sm:flex-none">
            انصراف
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="flex-1 sm:flex-none bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            بله، خارج شو
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
